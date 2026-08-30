import type { ExternalBankAccount } from '@/types/bank-account';
import type { PortfolioHolding } from '@/types/portfolio';
import type { SupportRequest, SupportStatus, SupportSubject } from '@/types/support';

/**
 * What a request is about, and what to say about where it has got to.
 *
 * ## Context is resolved, never stored
 *
 * A request holds a reference — a deposit's bank reference, or an account's
 * vault id. This resolves that reference against the canonical domains **at
 * render time**, so the bank name and amount a support screen shows are the
 * portfolio's own, and a request cannot display a figure that has drifted.
 *
 * A reference that resolves to nothing is reported as such rather than
 * rendered as an empty row: a support screen quietly dropping the deposit it
 * was supposed to be about is how a customer ends up explaining it again.
 *
 * ## Status wording is written once
 *
 * Five statuses, each with what is true now and what the customer should do.
 * **No times, no SLAs, no agent.** "We aim to reply within 24 hours" would be a
 * promise nobody in this build can keep, and "an agent is reviewing your case"
 * would name a person who does not exist.
 *
 * Pure and React-free.
 */

/** Resolved context for one request, or the honest absence of it. */
export type ResolvedSubject =
  | { kind: 'none' }
  | { kind: 'holding'; reference: string; holding: PortfolioHolding }
  | { kind: 'holding-missing'; reference: string }
  | { kind: 'bank-account'; accountId: string; account: ExternalBankAccount }
  | { kind: 'bank-account-missing'; accountId: string };

export interface SubjectSources {
  holdings: readonly PortfolioHolding[];
  accounts: readonly ExternalBankAccount[];
}

export function resolveSubject(subject: SupportSubject, sources: SubjectSources): ResolvedSubject {
  if (subject.kind === 'holding') {
    const holding = sources.holdings.find((entry) => entry.reference === subject.reference);

    return holding === undefined
      ? { kind: 'holding-missing', reference: subject.reference }
      : { kind: 'holding', reference: subject.reference, holding };
  }

  if (subject.kind === 'bank-account') {
    const account = sources.accounts.find((entry) => entry.id === subject.accountId);

    return account === undefined
      ? { kind: 'bank-account-missing', accountId: subject.accountId }
      : { kind: 'bank-account', accountId: subject.accountId, account };
  }

  return { kind: 'none' };
}

/**
 * One line naming what the request is about.
 *
 * The deposit is named by its bank and its reference — the same two things the
 * portfolio shows — and never by its amount, because a support header is not a
 * place to restate someone's balance.
 */
export function describeSubject(resolved: ResolvedSubject): string {
  switch (resolved.kind) {
    case 'holding':
      return `${resolved.holding.bank.name} fixed deposit · ${resolved.reference}`;
    case 'holding-missing':
      return 'A deposit that is no longer in your portfolio';
    case 'bank-account':
      return `${resolved.account.institution.name} account`;
    case 'bank-account-missing':
      return 'An account that is no longer in your vault';
    case 'none':
      return 'General support';
  }
}

export interface StatusPresentation {
  label: string;
  /** What is true right now. */
  current: string;
  /** What the customer has to do. Never "no action" unless that is true. */
  nextStep: string;
  /** Whether the customer is the one holding this up. */
  needsCustomer: boolean;
}

export const STATUS_PRESENTATION: Record<SupportStatus, StatusPresentation> = {
  open: {
    label: 'Open',
    current: 'Your request has been recorded.',
    nextStep:
      'Nothing is needed from you. In this demonstration build no support team receives requests, so this one will stay open.',
    needsCustomer: false,
  },
  'in-progress': {
    label: 'In progress',
    current: 'This request is being looked at.',
    nextStep: 'Nothing is needed from you right now.',
    needsCustomer: false,
  },
  'waiting-for-customer': {
    label: 'Waiting for you',
    current: 'This request needs something from you before it can go further.',
    nextStep: 'Reply below with the information asked for.',
    needsCustomer: true,
  },
  resolved: {
    label: 'Resolved',
    current: 'An answer was given for this request.',
    nextStep: 'Nothing is needed from you. Reply if it did not answer your question.',
    needsCustomer: false,
  },
  closed: {
    label: 'Closed',
    current: 'This request is finished.',
    nextStep: 'Nothing is needed from you. Start a new request if something else comes up.',
    needsCustomer: false,
  },
};

/** Requests that still need something, newest first. */
export function requestsNeedingCustomer(
  requests: readonly SupportRequest[],
): readonly SupportRequest[] {
  return requests.filter((request) => STATUS_PRESENTATION[request.status].needsCustomer);
}
