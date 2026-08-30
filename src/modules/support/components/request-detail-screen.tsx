'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useSupportRequests } from '@/hooks/use-support-requests';
import { HELP_CATEGORY_LABEL } from '@/services/support';
import { formatMaturityDate } from '@/utils/finance';

import { RequestStatusBadge } from './request-status-badge';
import { STATUS_PRESENTATION, describeSubject, resolveSubject } from '../utils/request-context';

/**
 * One request: what was asked, where it stands, and what to do next.
 *
 * ## The three questions, answered in order
 *
 * What happened, what is the status, what does the customer need to do. Each is
 * a labelled line rather than a paragraph to interpret — and "nothing is needed
 * from you" is only ever shown when the status genuinely requires nothing.
 *
 * ## No agent, no promise
 *
 * A message written by this application is labelled as being from the platform,
 * and the acknowledgement says plainly that nothing was sent anywhere. There is
 * no name, no avatar, no "typically replies within" and no queue position,
 * because there is no support desk behind any of them.
 *
 * ## Replying is real, so the control is real
 *
 * The reply is appended to the thread and moves a request that was waiting on
 * the customer back to in progress. That is a genuine action, so the button
 * exists. Nothing else here can be acted on, so nothing else is offered.
 */
export interface RequestDetailScreenProps {
  requestId: string;
}

export function RequestDetailScreen({ requestId }: RequestDetailScreenProps) {
  const { requests, isLoaded, reply } = useSupportRequests();
  const { holdings, isLoaded: holdingsLoaded } = usePortfolio();
  const { accounts, isLoaded: accountsLoaded } = useBankAccounts();

  const [draft, setDraft] = useState('');

  const request = requests.find((entry) => entry.id === requestId) ?? null;

  const resolved = useMemo(
    () => (request === null ? null : resolveSubject(request.relatedTo, { holdings, accounts })),
    [request, holdings, accounts],
  );

  if (!isLoaded || !holdingsLoaded || !accountsLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-detail flex flex-col gap-6 py-10 md:py-14"
      >
        <span className="sr-only">Loading this request…</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (request === null || resolved === null) {
    return (
      <div className="container-detail flex flex-col gap-6 py-10 md:py-14">
        <div className="flex max-w-lg flex-col gap-3">
          <h1 className="text-h1 text-content">We couldn&apos;t find that request</h1>
          <p className="text-body-lg text-content-muted">
            No request with the number <span className="tabular-nums">{requestId}</span> exists on
            this device. Requests are kept for the browser session they were created in, so one from
            an earlier session will not be here.
          </p>
        </div>

        <Button asChild size="lg" className="w-fit">
          <Link href={ROUTES.support}>
            Back to help &amp; support
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const presentation = STATUS_PRESENTATION[request.status];

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
          <span className="text-caption text-content-muted tabular-nums">{request.id}</span>
          <h1 className="text-h1 text-content">{request.subject}</h1>
          <p className="text-body-lg text-content-muted">
            {HELP_CATEGORY_LABEL[request.category]} · {describeSubject(resolved)}
          </p>
        </div>
      </header>

      {/* ---- Status, and what it means for the customer ---- */}
      <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RequestStatusBadge status={request.status} />
          <span className="text-caption text-content-muted tabular-nums">
            Submitted {formatMaturityDate(new Date(request.createdAt))}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-caption text-content-muted">Current status</span>
          <span className="text-body text-content">{presentation.current}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-caption text-content-muted">Next step</span>
          <span className="text-body text-content">{presentation.nextStep}</span>
        </div>

        {resolved.kind === 'holding' ? (
          <Link
            href={ROUTES.portfolio}
            className="focus-ring text-caption text-content-brand w-fit rounded-md font-medium"
          >
            View this deposit in your portfolio
          </Link>
        ) : null}

        {resolved.kind === 'bank-account' ? (
          <Link
            href={ROUTES.bankAccount(resolved.accountId)}
            className="focus-ring text-caption text-content-brand w-fit rounded-md font-medium"
          >
            View this account
          </Link>
        ) : null}

        {resolved.kind === 'holding-missing' || resolved.kind === 'bank-account-missing' ? (
          <p className="text-caption text-content-muted">
            The item this request refers to is no longer in your account, so it cannot be shown.
          </p>
        ) : null}
      </Card>

      {/* ---- The thread ---- */}
      <section aria-labelledby="request-thread-title" className="flex flex-col gap-3">
        <h2 id="request-thread-title" className="text-h3 text-content">
          Conversation
        </h2>

        <Card variant="outlined" className="px-5 md:px-6">
          <ul className="divide-border-default/60 flex list-none flex-col divide-y">
            {request.messages.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-caption text-content font-semibold">
                    {entry.author === 'customer' ? 'You' : 'Platform'}
                  </span>
                  <span className="text-caption text-content-placeholder tabular-nums">
                    {formatMaturityDate(new Date(entry.at))}
                  </span>
                </div>

                <p className="text-body text-content-muted break-words">{entry.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ---- Reply ---- */}
      <section aria-labelledby="request-reply-title" className="flex flex-col gap-3">
        <h2 id="request-reply-title" className="text-h3 text-content">
          Add to this request
        </h2>

        <label htmlFor="support-reply" className="sr-only">
          Your reply
        </label>
        <textarea
          id="support-reply"
          rows={4}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          className="focus-ring border-border-default bg-surface-card text-body text-content rounded-md border px-4 py-3"
        />

        <Button
          variant="secondary"
          className="w-fit"
          disabled={draft.trim().length < 2}
          onClick={() => {
            reply(request.id, draft);
            setDraft('');
          }}
        >
          Send reply
        </Button>

        <p className="text-caption text-content-muted">
          Demonstration build: this request is recorded on this device only. No support team, bank
          or external system has received it, and nothing has been emailed or texted to you.
        </p>
      </section>
    </div>
  );
}
