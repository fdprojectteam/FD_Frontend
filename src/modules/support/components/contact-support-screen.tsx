'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioCardGroup } from '@/components/ui/radio-card-group';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useSupportRequests } from '@/hooks/use-support-requests';
import { HELP_CATEGORY_LABEL, HELP_CATEGORY_SUMMARY } from '@/services/support';
import type { SupportCategory, SupportSubject } from '@/types/support';

import { describeSubject, resolveSubject } from '../utils/request-context';

/**
 * Contacting support — asking for what is not already known.
 *
 * ## The context comes with the customer
 *
 * Arriving from a deposit or an account carries its reference in the URL, and
 * this screen resolves it against the canonical domain and states what the
 * request is about. **The customer is never asked "which FD?" when they came
 * from one** — that question is the single clearest signal that a product is
 * not paying attention.
 *
 * What is carried is a reference, never a copy: the bank name shown here is
 * read from the portfolio at render time, so it cannot disagree with it. A
 * reference that resolves to nothing falls back to general support and says so,
 * rather than opening a request about a deposit that does not exist.
 *
 * ## Two questions, because two is all that is left
 *
 * A topic and a message. Everything else — who the customer is, which deposit,
 * which account, the reference number — the platform already has.
 *
 * ## It says what submitting does
 *
 * Before the button, not after. Nothing is sent anywhere: no support desk, no
 * bank, no email. A customer is entitled to know that before they type out a
 * problem.
 */
const CATEGORY_OPTIONS: readonly SupportCategory[] = [
  'fd-booking',
  'payment',
  'verification',
  'bank-account',
  'documents',
  'maturity',
  'general',
];

export function ContactSupportScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { holdings, isLoaded: holdingsLoaded } = usePortfolio();
  const { accounts, isLoaded: accountsLoaded } = useBankAccounts();
  const { create } = useSupportRequests();

  const messageFieldId = useId();
  const subjectFieldId = useId();

  const holdingRef = searchParams.get('holding');
  const accountId = searchParams.get('account');

  /*
    The subject the URL asked for, resolved against what the customer actually
    holds. Resolution waits for both stores: deciding "not found" before they
    have loaded would drop context the customer arrived with.
  */
  const requested: SupportSubject = useMemo(() => {
    if (holdingRef !== null && holdingRef !== '') return { kind: 'holding', reference: holdingRef };
    if (accountId !== null && accountId !== '') return { kind: 'bank-account', accountId };
    return { kind: 'none' };
  }, [holdingRef, accountId]);

  const resolved = useMemo(
    () => resolveSubject(requested, { holdings, accounts }),
    [requested, holdings, accounts],
  );

  const isResolving = requested.kind !== 'none' && (!holdingsLoaded || !accountsLoaded);
  const isMissing = resolved.kind === 'holding-missing' || resolved.kind === 'bank-account-missing';

  /* A subject that resolved to nothing is not attached to the request. */
  const relatedTo: SupportSubject = isMissing ? { kind: 'none' } : requested;

  const [category, setCategory] = useState<SupportCategory>(
    requested.kind === 'bank-account'
      ? 'bank-account'
      : requested.kind === 'holding'
        ? 'maturity'
        : 'general',
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const subjectError = trimmedSubject === '' ? 'Give your request a short subject.' : undefined;
  const messageError =
    trimmedMessage.length < 10 ? 'Tell us a little more so we can help.' : undefined;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (subjectError !== undefined || messageError !== undefined) return;

    const created = create({
      category,
      subject: trimmedSubject,
      message: trimmedMessage,
      relatedTo,
    });

    router.push(ROUTES.supportRequest(created.id));
  };

  return (
    <div className="container-detail flex flex-col gap-6 py-8 md:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href={ROUTES.support}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Help &amp; support
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-content">Contact support</h1>
          <p className="text-body-lg text-content-muted">
            Tell us what you need. We already have your account details, so there is no need to
            repeat them.
          </p>
        </div>
      </header>

      {/*
        What this request is about, stated rather than asked. The one case that
        needs the customer's attention is a reference that no longer resolves.
      */}
      <Card variant="outlined" className="flex flex-col gap-1 p-5 md:p-6">
        <span className="text-caption text-content-muted">This request is about</span>
        <span className="text-body text-content font-medium">
          {isResolving ? 'Checking…' : describeSubject(resolved)}
        </span>

        {isMissing ? (
          <p className="text-caption text-content-muted">
            We could not find that in your account, so this will be raised as general support. Tell
            us what it was about in your message.
          </p>
        ) : null}
      </Card>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <RadioCardGroup
          label="What can we help with?"
          options={CATEGORY_OPTIONS.map((id) => ({
            id,
            title: HELP_CATEGORY_LABEL[id],
            description: HELP_CATEGORY_SUMMARY[id],
          }))}
          value={category}
          onChange={setCategory}
        />

        <Card variant="outlined" className="flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={subjectFieldId} className="text-body text-content font-medium">
              Subject
            </label>
            <Input
              id={subjectFieldId}
              value={subject}
              invalid={submitted && subjectError !== undefined}
              aria-describedby={`${subjectFieldId}-error`}
              onChange={(event) => {
                setSubject(event.target.value);
              }}
            />
            <p id={`${subjectFieldId}-error`} className="text-caption text-error empty:hidden">
              {submitted ? subjectError : undefined}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={messageFieldId} className="text-body text-content font-medium">
              Your message
            </label>
            <textarea
              id={messageFieldId}
              rows={6}
              value={message}
              aria-invalid={submitted && messageError !== undefined ? true : undefined}
              aria-describedby={`${messageFieldId}-error`}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
              className="focus-ring border-border-default bg-surface-card text-body text-content rounded-md border px-4 py-3"
            />
            <p id={`${messageFieldId}-error`} className="text-caption text-error empty:hidden">
              {submitted ? messageError : undefined}
            </p>
            <p className="text-caption text-content-muted">
              Please do not include your full bank account number, PAN, Aadhaar, or any password or
              PIN. We never need them, and we do not ask for them.
            </p>
          </div>
        </Card>

        <div className="rounded-card border-border-default flex flex-col gap-1 border border-dashed p-4">
          <p className="text-body text-content font-medium">What happens when you send this</p>
          <p className="text-caption text-content-muted">
            Your request is recorded on this device so you can track it here. In this demonstration
            build there is no support desk to receive it: no team, bank or external system is
            contacted, and nothing is emailed or texted to you.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg">
            Submit request
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={ROUTES.support}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
