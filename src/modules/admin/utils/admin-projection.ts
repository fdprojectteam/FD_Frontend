import type { DemoApplication, DemoCustomer, DemoKycState } from '@/services/admin';
import type {
  AdminApplicationStatus,
  AdminAuditEvent,
  ProductChangeProposal,
  ProductChangeStatus,
} from '@/types/admin';
import type { PortfolioHolding } from '@/types/portfolio';
import { summarisePortfolio, type PortfolioSummary } from '@/utils/portfolio';

/**
 * The operations read model.
 *
 * ## Everything here is a projection
 *
 * Customers, applications and product proposals are **derived on every read**
 * from three sources: the canonical domains (the session investor's portfolio
 * and identity), the demonstration fixture, and the admin journal. Nothing is
 * stored twice. In particular:
 *
 * - a customer's totals come from `summarisePortfolio`, the platform's own
 *   derivation — Admin computes no interest and no maturity value;
 * - an application's status is **replayed from the journal**, so the audit log
 *   and the queue cannot disagree;
 * - a product proposal has no record of its own at all: it *is* the events.
 *
 * ## Why replay rather than store
 *
 * A stored status beside the event that produced it is two records of one fact,
 * and an operations console whose audit trail disagrees with its queue is worse
 * than one with no audit trail. Replay costs nothing at this scale and makes
 * the disagreement unrepresentable.
 *
 * Pure and React-free; the caller supplies `now`.
 */

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export interface AdminCustomerRow {
  id: string;
  displayName: string;
  location: string;
  joinedAt: number;
  kycState: DemoKycState;
  kycNote: string | null;
  /** Derived by the platform's own summariser. Never computed here. */
  summary: PortfolioSummary;
  activeDeposits: number;
  totalPrincipal: number;
  /** True when this row is demonstration data rather than the live investor. */
  isDemo: boolean;
}

export interface CustomerInputs {
  /** The session investor's own holdings, from the canonical store. */
  sessionHoldings: readonly PortfolioHolding[];
  /** What the identity domain says about the session investor. */
  sessionKycState: DemoKycState;
  sessionCustomerId: string;
  sessionDisplayName: string;
  demo: readonly DemoCustomer[];
}

function toRow(
  id: string,
  displayName: string,
  location: string,
  joinedAt: number,
  kycState: DemoKycState,
  kycNote: string | null,
  holdings: readonly PortfolioHolding[],
  isDemo: boolean,
  now: number,
): AdminCustomerRow {
  const summary = summarisePortfolio(holdings, now);

  return {
    id,
    displayName,
    location,
    joinedAt,
    kycState,
    kycNote,
    summary,
    activeDeposits: summary.activeCount,
    totalPrincipal: summary.totalPrincipal,
    isDemo,
  };
}

/** Every customer the console knows about, the live one first. */
export function buildCustomerRows(inputs: CustomerInputs, now: number): AdminCustomerRow[] {
  return [
    toRow(
      inputs.sessionCustomerId,
      inputs.sessionDisplayName,
      'This session',
      now,
      inputs.sessionKycState,
      null,
      inputs.sessionHoldings,
      false,
      now,
    ),
    ...inputs.demo.map((customer) =>
      toRow(
        customer.id,
        customer.displayName,
        customer.location,
        customer.joinedAt,
        customer.kycState,
        customer.kycNote,
        customer.holdings,
        true,
        now,
      ),
    ),
  ];
}

/** Case-insensitive match on name, id or city. Deterministic, like every search here. */
export function filterCustomers(
  rows: readonly AdminCustomerRow[],
  query: string,
  kyc: DemoKycState | 'all',
): AdminCustomerRow[] {
  const term = query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesKyc = kyc === 'all' || row.kycState === kyc;
    if (!matchesKyc) return false;
    if (term === '') return true;

    return `${row.displayName} ${row.id} ${row.location}`.toLowerCase().includes(term);
  });
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export interface AdminApplicationRow {
  id: string;
  customerId: string;
  productId: string;
  bankName: string;
  amount: number;
  submittedAt: number;
  status: AdminApplicationStatus;
  /** True for the synthetic queue; false for a deposit the platform observed. */
  isDemo: boolean;
}

/** The most recent decision recorded against an application, if any. */
function replayApplicationStatus(
  applicationId: string,
  initial: AdminApplicationStatus,
  events: readonly AdminAuditEvent[],
): AdminApplicationStatus {
  const decisions = events
    .filter((event) => event.subject.kind === 'application' && event.subject.id === applicationId)
    .sort((a, b) => a.at - b.at);

  return decisions.reduce<AdminApplicationStatus>((status, event) => {
    if (event.action === 'application.reviewed') return 'in-review';
    if (event.action === 'application.approved') return 'approved';
    if (event.action === 'application.rejected') return 'rejected';
    return status;
  }, initial);
}

export interface ApplicationInputs {
  demo: readonly DemoApplication[];
  /** Confirmed deposits — the one part of the queue the platform can observe. */
  sessionHoldings: readonly PortfolioHolding[];
  sessionCustomerId: string;
  events: readonly AdminAuditEvent[];
}

/**
 * The queue: synthetic applications in flight, plus the deposits this platform
 * genuinely recorded as confirmed.
 *
 * A confirmed deposit is `completed` and stays that way — an operator cannot
 * "approve" a deposit the customer already holds, and the console does not
 * offer to.
 */
export function buildApplicationRows(inputs: ApplicationInputs): AdminApplicationRow[] {
  const pending: AdminApplicationRow[] = inputs.demo.map((application) => ({
    id: application.id,
    customerId: application.customerId,
    productId: application.productId,
    bankName: application.bankName,
    amount: application.amount,
    submittedAt: application.submittedAt,
    status: replayApplicationStatus(application.id, application.initialStatus, inputs.events),
    isDemo: true,
  }));

  const completed: AdminApplicationRow[] = inputs.sessionHoldings
    .filter((holding) => holding.status === 'active')
    .map((holding) => ({
      id: holding.reference,
      customerId: inputs.sessionCustomerId,
      productId: holding.productId,
      bankName: holding.bank.name,
      amount: holding.principal,
      submittedAt: holding.startedAt,
      status: 'completed' as const,
      isDemo: false,
    }));

  return [...pending, ...completed].sort((a, b) => b.submittedAt - a.submittedAt);
}

export function filterApplications(
  rows: readonly AdminApplicationRow[],
  status: AdminApplicationStatus | 'all',
): AdminApplicationRow[] {
  return status === 'all' ? [...rows] : rows.filter((row) => row.status === status);
}

/** Whether an operator may still decide this application. */
export function isDecidable(row: AdminApplicationRow): boolean {
  return row.status === 'pending' || row.status === 'in-review';
}

/* ------------------------------------------------------------------ */
/* Product changes — maker / checker                                   */
/* ------------------------------------------------------------------ */

/**
 * Proposals, replayed from the journal.
 *
 * A proposal is a `product.change.proposed` event; its status is whatever the
 * latest matching decision says. Nothing else records a proposal, which is why
 * the audit log is necessarily complete.
 *
 * `published` never appears: publishing means telling the bank, and there is no
 * bank integration in this build. The status exists in the type so the eventual
 * step is an implementation rather than a redesign.
 */
export function buildProposals(events: readonly AdminAuditEvent[]): ProductChangeProposal[] {
  const ordered = [...events].sort((a, b) => a.at - b.at);

  const proposals: ProductChangeProposal[] = [];

  for (const event of ordered) {
    if (event.subject.kind !== 'product') continue;

    if (event.action === 'product.change.proposed' && event.change !== null) {
      proposals.push({
        id: event.id,
        productId: event.subject.id,
        field: event.change.field,
        from: event.change.from,
        to: event.change.to,
        status: 'pending-review',
        proposedAt: event.at,
        proposedByRole: event.actorRole,
        reviewedAt: null,
        reviewedByRole: null,
      });
      continue;
    }

    const decided: ProductChangeStatus | null =
      event.action === 'product.change.approved'
        ? 'approved'
        : event.action === 'product.change.rejected'
          ? 'rejected'
          : null;

    if (decided === null) continue;

    /* The oldest pending proposal for that product is the one being decided. */
    const target = proposals.find(
      (proposal) => proposal.productId === event.subject.id && proposal.status === 'pending-review',
    );
    if (target === undefined) continue;

    target.status = decided;
    target.reviewedAt = event.at;
    target.reviewedByRole = event.actorRole;
  }

  return proposals.sort((a, b) => b.proposedAt - a.proposedAt);
}

export function pendingProposals(
  proposals: readonly ProductChangeProposal[],
): ProductChangeProposal[] {
  return proposals.filter((proposal) => proposal.status === 'pending-review');
}

export function proposalsForProduct(
  proposals: readonly ProductChangeProposal[],
  productId: string,
): ProductChangeProposal[] {
  return proposals.filter((proposal) => proposal.productId === productId);
}

/* ------------------------------------------------------------------ */
/* Attention                                                           */
/* ------------------------------------------------------------------ */

/** One thing an operator should look at, and where to look at it. */
export interface AttentionItem {
  id: string;
  label: string;
  detail: string;
  count: number;
}

/**
 * What needs attention, counted from what is actually there.
 *
 * An item with a count of zero is omitted rather than shown as a reassuring
 * "0 outstanding" — a console that lists everything it is not worried about
 * teaches its users to skim.
 */
export function buildAttention(inputs: {
  applications: readonly AdminApplicationRow[];
  customers: readonly AdminCustomerRow[];
  proposals: readonly ProductChangeProposal[];
  openSupport: number;
}): AttentionItem[] {
  const pendingApplications = inputs.applications.filter(
    (row) => row.status === 'pending' || row.status === 'in-review',
  ).length;

  const kycCases = inputs.customers.filter(
    (row) => row.kycState === 'needs-attention' || row.kycState === 'pending',
  ).length;

  const awaitingApproval = pendingProposals(inputs.proposals).length;

  return [
    {
      id: 'applications',
      label: 'Applications awaiting a decision',
      detail: 'Pending or in review in the operations queue.',
      count: pendingApplications,
    },
    {
      id: 'kyc',
      label: 'Verification cases needing a decision',
      detail: 'Customers whose verification is incomplete or has a mismatch.',
      count: kycCases,
    },
    {
      id: 'products',
      label: 'Product changes awaiting review',
      detail: 'Proposed by a product admin, not yet reviewed.',
      count: awaitingApproval,
    },
    {
      id: 'support',
      label: 'Support requests still open',
      detail: 'Requests that have not been resolved or closed.',
      count: inputs.openSupport,
    },
  ].filter((item) => item.count > 0);
}
