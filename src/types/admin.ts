/**
 * The operations side of the same product.
 *
 * ## What Admin owns, and what it only reads
 *
 * Admin owns **operational intent**: who proposed a change, who reviewed an
 * application, when, and what the outcome was. It owns none of the underlying
 * facts. Customers, deposits, products, accounts and support requests each have
 * a canonical home, and Admin refers to them by id and resolves them for
 * display — the same discipline Support and the Family Dashboard follow.
 *
 * ```
 * AdminAuditEvent ──subject──▶ customer id / product id / application id / request id
 *                              ▲ resolved against the canonical domain, never copied
 * ```
 *
 * ## One store, and it is a journal
 *
 * Every operational action is recorded as an **immutable event**. Current state
 * — whether a proposal is awaiting review, whether an application was approved —
 * is *projected* from those events rather than stored beside them. Two records
 * of the same fact is how an operations console starts disagreeing with itself,
 * and an audit log that can disagree with the thing it audits is worse than no
 * audit log.
 *
 * ## Permissions here are a UI demonstration
 *
 * `AdminRole` and `AdminPermission` express the distinction a financial
 * operations platform must make — **seeing something is not permission to change
 * it** — and the screens honour it. They are not security: there is no
 * authentication, no session, no server and nothing enforcing any of this
 * beyond the components themselves. Production authorisation happens on an API
 * that does not exist in this build, and no part of this file pretends
 * otherwise.
 */

/** The roles this demonstration models. Deliberately four, not an RBAC engine. */
export type AdminRole = 'operations' | 'product' | 'support' | 'auditor';

/**
 * What a role may do.
 *
 * Split into *view* and *act* deliberately: an auditor sees everything and
 * changes nothing, and that is only expressible if visibility and mutation are
 * separate permissions.
 */
export type AdminPermission =
  | 'customers.view'
  | 'applications.view'
  | 'applications.decide'
  | 'products.view'
  | 'products.propose'
  | 'products.approve'
  | 'kyc.view'
  | 'support.view'
  | 'support.act'
  | 'audit.view';

/** What the platform knows about the person operating it. No credentials, ever. */
export interface AdminIdentity {
  id: string;
  displayName: string;
  role: AdminRole;
  /** True for every identity in this build: nobody has authenticated. */
  isSimulated: boolean;
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

/** What an event is about. A reference, never the entity itself. */
export type AdminSubject =
  | { kind: 'customer'; id: string }
  | { kind: 'application'; id: string }
  | { kind: 'product'; id: string }
  | { kind: 'support-request'; id: string }
  | { kind: 'kyc-case'; id: string };

export type AdminSubjectKind = AdminSubject['kind'];

/**
 * The operational actions this build can genuinely perform.
 *
 * Every one is a change to *this platform's own* records. None of them reaches
 * a bank, a registry, a payment rail or a customer's inbox, and none of the
 * names implies that it does — `product.change.approved` is an approval within
 * the platform, not a product published to a bank.
 */
export type AdminAction =
  | 'application.reviewed'
  | 'application.approved'
  | 'application.rejected'
  | 'product.change.proposed'
  | 'product.change.approved'
  | 'product.change.rejected'
  | 'support.status.changed'
  | 'kyc.case.reviewed';

/**
 * One thing that happened, recorded once and never edited.
 *
 * Answers who, what, when, to which object, and with what outcome — the five
 * questions an audit record exists to answer.
 */
export interface AdminAuditEvent {
  id: string;
  at: number;
  /** The role acting. There is no user identity to record, and none is invented. */
  actorRole: AdminRole;
  actorName: string;
  action: AdminAction;
  subject: AdminSubject;
  /** One line, in operational language. Carries no customer PII and no figures. */
  summary: string;
  /**
   * Structured detail for a change: what moved, from what, to what.
   *
   * Strings so a rate, a status and a tenure can all be recorded without this
   * type learning what any of them mean.
   */
  change: { field: string; from: string; to: string } | null;
  /** True for every event in this build. Nothing left the platform. */
  isSimulated: boolean;
}

/* ------------------------------------------------------------------ */
/* Maker / checker                                                     */
/* ------------------------------------------------------------------ */

/**
 * Where a proposed product change stands.
 *
 * `published` is modelled and **deliberately unreachable**: publishing a change
 * means telling the bank, and there is no bank integration in this build. The
 * member exists so the eventual step is an implementation rather than a
 * redesign, and the screens say plainly why a change stops at `approved`.
 */
export type ProductChangeStatus =
  'draft' | 'pending-review' | 'approved' | 'rejected' | 'published';

/** A proposed change to a product, projected from the journal. */
export interface ProductChangeProposal {
  /** The event that proposed it — proposals have no identity of their own. */
  id: string;
  productId: string;
  field: string;
  from: string;
  to: string;
  status: ProductChangeStatus;
  proposedAt: number;
  proposedByRole: AdminRole;
  reviewedAt: number | null;
  reviewedByRole: AdminRole | null;
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

/**
 * Where an application stands in the operations queue.
 *
 * `completed` is the one status this platform can observe without an operator:
 * a confirmed deposit exists in the customer's portfolio. The rest are
 * operational states an admin moves it through in this demonstration.
 */
export type AdminApplicationStatus =
  'pending' | 'in-review' | 'approved' | 'rejected' | 'completed';
