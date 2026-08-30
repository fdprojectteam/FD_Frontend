import type { Route } from 'next';

/**
 * What the platform tells an investor about their money.
 *
 * ## Derived, not stored
 *
 * A notification here is a **statement about current domain state**, not a
 * record mailed at some point in the past. "This deposit matures in 40 days" is
 * true because of the deposit's own maturity date; it is recomputed on every
 * read from the holding, and it stops being true by itself when the date
 * passes.
 *
 * That is why this type carries no financial data of its own — only a reference
 * to the entity it is about. Copying a principal or a maturity amount into a
 * notification record would be a second source of truth for a figure the
 * portfolio already owns, and it would go stale in exactly the place a customer
 * would trust it.
 *
 * The only genuinely new state in this module is **which notifications have been
 * read**, which is why that lives on its own, keyed by id.
 *
 * ## Extensible without being built out
 *
 * `category` and `subject` are open enough for a future product to add its own
 * kinds without reshaping this, and nothing beyond fixed deposits is modelled.
 */

/** What the notification is about. Severity is derived from this, not stored twice. */
export type NotificationCategory =
  /** The booking journey — confirmations and anything needing attention. */
  | 'booking'
  /** Investor verification. */
  | 'identity'
  /** Deposit maturities. */
  | 'maturity';

/**
 * How much attention it deserves.
 *
 * Three levels, deliberately. A ladder of five teaches people to ignore the
 * middle three, and this product has no event urgent enough to sit above
 * `action`.
 */
export type NotificationSeverity =
  /** Something happened. Nothing to do. */
  | 'info'
  /** A decision or step is genuinely outstanding. */
  | 'action'
  /** Completed successfully — a confirmation worth keeping. */
  | 'success';

/** The entity a notification refers to, so nothing about it is copied. */
export interface NotificationSubject {
  kind: 'holding' | 'investor';
  /** A holding's bank reference, or the investor id. Never a financial figure. */
  id: string;
}

export interface AppNotification {
  /**
   * Stable across re-derivation — e.g. `maturity-approaching:AXISFD…`.
   *
   * It has to be, because read state is keyed by it. An id built from a
   * timestamp would make every notification unread again on the next render.
   */
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  /** One sentence. No paragraph, and no claim the platform cannot support. */
  body: string;
  /** Epoch ms of the event this describes — not of the render. */
  occurredAt: number;
  subject: NotificationSubject;
  /** Where to go, when an action genuinely exists. Absent otherwise. */
  action?: { label: string; href: Route };
  /**
   * ⚠ True when this describes a simulated event rather than one a bank
   * reported.
   *
   * Every notification in this build is derived from local state, because no
   * bank integration exists. The flag is on the type rather than assumed, so
   * the day a real event arrives the two are distinguishable without a
   * migration — and so the UI can say which is which today.
   */
  isSimulated: boolean;
}

/** A notification with the reader's own state attached. */
export interface NotificationWithState extends AppNotification {
  isRead: boolean;
}
