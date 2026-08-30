'use client';

import { ArrowLeft, BadgeCheck, CircleAlert, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioCardGroup } from '@/components/ui/radio-card-group';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { SAMPLE_IFSC_CODES, normaliseIfsc, resolveIfsc } from '@/services/bank-accounts';
import type { BankAccountType } from '@/types/bank-account';

import {
  EMPTY_ACCOUNT_ENTRY,
  MAX_ACCOUNT_DIGITS,
  toAccountDigits,
  toNewAccount,
  validateAccountEntry,
  type AccountEntryDraft,
} from '../utils/account-entry';

/**
 * Adding an account.
 *
 * ## IFSC first, because the customer should not type what we can look up
 *
 * The code identifies the bank *and* the branch. Asking for either by hand
 * would be asking the customer to retype something they have already given us,
 * and to get it right — bank names and branch spellings are exactly the fields
 * people fill in inconsistently. One code, resolved, and the institution
 * appears.
 *
 * When it does not resolve, the screen says so and stops. Reading the first
 * four characters as a bank code would name a bank for a mistyped IFSC, and the
 * customer would confirm an account at a bank they do not hold one with.
 *
 * ## The account number is typed twice, and kept nowhere
 *
 * A long digit string is the one field a customer cannot check by reading it
 * back, so it is confirmed. Neither entry leaves this component: what is saved
 * is the last four digits, and the canonical type has no field for more.
 *
 * ## The name is prefilled from the investor record, and still editable
 *
 * Most people are adding their own account, so the name they have already given
 * the platform is the right default. It stays editable because a joint or
 * differently-spelled account is a real case, and a mismatch is something the
 * vault reports rather than something the form prevents.
 *
 * ## Nothing here claims the account was checked
 *
 * The screen says what will be true when it is saved: the details are on file,
 * and ownership has not been confirmed. There is no verification provider in
 * this build, and the button does not pretend otherwise.
 */
const ACCOUNT_TYPE_OPTIONS: readonly { id: BankAccountType; title: string; description: string }[] =
  [
    { id: 'savings', title: 'Savings account', description: 'The usual choice for individuals.' },
    { id: 'current', title: 'Current account', description: 'Typically used by a business.' },
  ];

export function AddAccountScreen() {
  const router = useRouter();
  const { add } = useBankAccounts();
  const { identity } = useInvestorIdentity();

  const [entry, setEntry] = useState<AccountEntryDraft>(EMPTY_ACCOUNT_ENTRY);
  const [submitted, setSubmitted] = useState(false);

  const accountFieldId = useId();
  const confirmFieldId = useId();
  const ifscFieldId = useId();
  const nameFieldId = useId();

  /*
    The investor's own name, once the record has loaded and only while the
    customer has not typed one. Seeding again after an edit would overwrite what
    they deliberately changed.
  */
  const knownName = identity?.profile.fullName ?? null;
  useEffect(() => {
    if (knownName === null) return;

    setEntry((current) =>
      current.accountHolderName === '' ? { ...current, accountHolderName: knownName } : current,
    );
  }, [knownName]);

  /*
    Resolution runs on what has been typed, so the institution appears as soon
    as the code is complete rather than on blur or on submit. A local directory
    makes that free; a network lookup would debounce here and nothing else on
    this screen would change.
  */
  const resolved = useMemo(() => resolveIfsc(entry.ifsc), [entry.ifsc]);
  const ifscTouched = normaliseIfsc(entry.ifsc).length >= 11;

  const errors = validateAccountEntry(entry, resolved !== null);
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    const input = toNewAccount(entry, resolved);
    if (input === null) return;

    const created = add(input);
    if (created === null) return;

    router.push(ROUTES.bankAccount(created.id));
  };

  return (
    <div className="container-detail flex flex-col gap-6 py-8 md:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href={ROUTES.bankAccounts}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Bank accounts
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-content">Add a bank account</h1>
          <p className="text-body-lg text-content-muted">
            We use it to fund your investments and to receive supported proceeds.
          </p>
        </div>
      </header>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <Card variant="outlined" className="flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={accountFieldId} className="text-body text-content font-medium">
              Account number
            </label>
            <Input
              id={accountFieldId}
              inputMode="numeric"
              autoComplete="off"
              maxLength={MAX_ACCOUNT_DIGITS}
              value={entry.accountNumber}
              invalid={show('accountNumber') !== undefined}
              aria-describedby={`${accountFieldId}-error`}
              onChange={(event) => {
                setEntry((current) => ({
                  ...current,
                  accountNumber: toAccountDigits(event.target.value),
                }));
              }}
            />
            <p id={`${accountFieldId}-error`} className="text-caption text-error empty:hidden">
              {show('accountNumber')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={confirmFieldId} className="text-body text-content font-medium">
              Confirm account number
            </label>
            <Input
              id={confirmFieldId}
              inputMode="numeric"
              autoComplete="off"
              maxLength={MAX_ACCOUNT_DIGITS}
              value={entry.confirmAccountNumber}
              invalid={show('confirmAccountNumber') !== undefined}
              aria-describedby={`${confirmFieldId}-error`}
              onChange={(event) => {
                setEntry((current) => ({
                  ...current,
                  confirmAccountNumber: toAccountDigits(event.target.value),
                }));
              }}
            />
            <p id={`${confirmFieldId}-error`} className="text-caption text-error empty:hidden">
              {show('confirmAccountNumber')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={ifscFieldId} className="text-body text-content font-medium">
              IFSC
            </label>
            <Input
              id={ifscFieldId}
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={11}
              value={entry.ifsc}
              invalid={ifscTouched && resolved === null}
              aria-describedby={`${ifscFieldId}-status`}
              onChange={(event) => {
                setEntry((current) => ({ ...current, ifsc: normaliseIfsc(event.target.value) }));
              }}
            />

            {/*
              One region, three states: nothing typed yet, resolved, or not
              recognised. Never a guess at the bank.
            */}
            <div id={`${ifscFieldId}-status`} aria-live="polite" className="min-h-5">
              {resolved !== null ? (
                <p className="text-caption text-success flex items-center gap-1.5">
                  <BadgeCheck aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="text-content">
                    {resolved.institution.name} — {resolved.branch.name}, {resolved.branch.city}
                  </span>
                </p>
              ) : ifscTouched ? (
                <p className="text-caption text-error flex items-center gap-1.5">
                  <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                  Bank details couldn’t be identified from this IFSC. Check the code on a cheque or
                  in your bank’s app.
                </p>
              ) : (
                <p className="text-caption text-content-muted">
                  Your bank and branch are identified from this code. Try {SAMPLE_IFSC_CODES[0]} in
                  this demonstration.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card variant="outlined" className="flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={nameFieldId} className="text-body text-content font-medium">
              Account holder name
            </label>
            <Input
              id={nameFieldId}
              autoComplete="name"
              value={entry.accountHolderName}
              invalid={show('accountHolderName') !== undefined}
              aria-describedby={`${nameFieldId}-error`}
              onChange={(event) => {
                setEntry((current) => ({ ...current, accountHolderName: event.target.value }));
              }}
            />
            <p id={`${nameFieldId}-error`} className="text-caption text-error empty:hidden">
              {show('accountHolderName')}
            </p>
            <p className="text-caption text-content-muted">
              As it appears on your bank records. We compare it with the name on your identity
              record and tell you if they differ.
            </p>
          </div>

          <RadioCardGroup
            label="Account type"
            options={ACCOUNT_TYPE_OPTIONS}
            value={entry.accountType}
            onChange={(accountType) => {
              setEntry((current) => ({ ...current, accountType }));
            }}
          />
        </Card>

        {/*
          What saving actually does, said before it is done. The alternative —
          a green tick on the next screen — would be the product claiming
          something no part of this build performed.
        */}
        <div className="rounded-card border-border-default flex items-start gap-3 border border-dashed p-4">
          <span className="bg-surface-muted text-content-muted flex size-9 shrink-0 items-center justify-center rounded-full">
            <Landmark aria-hidden="true" className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-body text-content font-medium">
              Saving records your details, not proof of ownership
            </p>
            <p className="text-caption text-content-muted">
              Confirming that an account belongs to you needs a verification provider, and none is
              connected in this build. The account is saved as not verified, and cannot fund an
              investment until it is. We never ask for your internet banking password or UPI PIN.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg">
            Add account
          </Button>

          <Button asChild variant="ghost" size="lg">
            <Link href={ROUTES.bankAccounts}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
