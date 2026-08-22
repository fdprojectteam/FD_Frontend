import type { Bank } from '@/types/finance';

/**
 * What an investor **holds** — the platform's first surface for ownership
 * rather than intent.
 *
 * ## The distinction this type exists to draw
 *
 * ```
 * Product  →  Booking  →  Confirmed FD  →  Portfolio holding
 * ```
 *
 * A marketplace product is something on offer. A booking draft is an intention,
 * editable and abandonable. A **holding is a deposit that exists** — the
 * partner bank has confirmed it and the money has moved. Only the last of those
 * belongs here, which is why an incomplete or cancelled booking can never
 * appear as one: a holding is only ever written from a confirmation.
 *
 * That line matters more later than it does now. Maturity management,
 * statements, notifications and a family view all attach to *ownership*, not to
 * a booking in progress, and they will all read this.
 *
 * ## Why it is platform-level
 *
 * Booking writes a holding when a deposit is confirmed; Portfolio reads them.
 * Modules cannot import each other, so the vocabulary belongs to the platform —
 * the same reasoning that put `InvestorIdentity` here.
 *
 * ## What is stored, and what is not
 *
 * Stored: the **terms of the contract**, which are fixed the moment the bank
 * confirms — principal, rate, tenure, whether interest compounds, when it
 * started. Those are facts, not derivations, and a later change to the
 * catalogue must not rewrite a deposit somebody already owns.
 *
 * Not stored: maturity amount, interest earned, maturity date. Every one is
 * derived on read from the fields above, through the platform's own
 * calculators — the rule Document 09 §10 states for the booking draft, applied
 * to the record that outlives it.
 */

/** Where a holding is in its life. */
export type HoldingStatus =
  /** Confirmed by the bank and earning interest. */
  | 'active'
  /** The term has run its course. */
  | 'matured'
  /** Closed before maturity. */
  | 'closed';

/**
 * The product family a holding belongs to.
 *
 * A discriminant, present from the first day, so a future product is a new
 * member of this union rather than a reshaping of the portfolio. Fixed deposits
 * are the only one now and nothing else is modelled — the boundary is cheap to
 * keep, and inventing the others would be building products nobody has asked
 * for.
 */
export type HoldingProductType = 'fixed-deposit';

export interface PortfolioHolding {
  /** The bank's reference for this deposit — the investor's own identifier. */
  reference: string;
  productType: HoldingProductType;
  /** The catalogue product this was booked from. Never substituted. */
  productId: string;
  productName: string;
  bank: Bank;
  /** Rupees deposited. Fixed at confirmation. */
  principal: number;
  /** The rate the deposit actually earns, resolved for its term at booking. */
  annualRate: number;
  /** Whole months. `0` for a term the bank publishes in days. */
  tenureMonths: number;
  /**
   * Whether interest compounds, rather than a payout vocabulary.
   *
   * The maturity rule turns on exactly this one fact, and a boolean cannot fall
   * out of step with a module's option list the way a copied union would.
   */
  isCumulative: boolean;
  /** What the customer chose, in their words — for display only. */
  payoutLabel: string;
  /** Epoch ms the deposit began, taken from the confirmed booking. */
  startedAt: number;
  status: HoldingStatus;
}
