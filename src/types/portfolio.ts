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

/** Where the platform received the recorded FD information. This is not verification. */
export type HoldingSource = 'platform-booked' | 'connected' | 'imported' | 'manually-added';

/** Customer-facing origin labels. They deliberately make no verification claim. */
export const HOLDING_SOURCE_LABEL: Readonly<Record<HoldingSource, string>> = {
  'platform-booked': 'Booked here',
  connected: 'Connected',
  imported: 'Imported',
  'manually-added': 'Self-added',
};

/** The evidence available for a source in this POC, stated without overclaiming. */
export const HOLDING_SOURCE_PROVENANCE: Readonly<Record<HoldingSource, string>> = {
  'platform-booked': 'Platform transaction record',
  connected: 'Source data received',
  imported: 'Document provided',
  'manually-added': 'Customer provided',
};

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

/**
 * What the bank does when the deposit matures.
 *
 * ## Why a canonical set rather than each bank's own option ids
 *
 * SBI and AU ask the same question with different wording and different values
 * — "Auto-renew principal, pay back interest" against "Renew principal, repay
 * interest". Storing whichever string that bank's form happened to use would
 * make the portfolio unable to say anything about a deposit without also
 * knowing which form it came from.
 *
 * These three are the union of what the two real forms actually offer, reduced
 * to what they mean. **No fourth option is invented**: a bank that offers
 * something else adds a member here when its form says so.
 */
export type MaturityInstruction =
  /** Both principal and interest roll into a new deposit. */
  | 'renew-principal-and-interest'
  /** The principal rolls over; interest is paid out. */
  | 'renew-principal-only'
  /** Principal and interest are both paid out. */
  | 'pay-out';

export interface PortfolioHolding {
  /** Stable, opaque identity for this holding inside the platform. */
  reference: string;
  /**
   * Where this holding was supplied from. It answers provenance only; it does
   * not imply that a bank independently verified the terms.
   */
  source: HoldingSource;
  /**
   * An optional reference the customer supplied for an FD held elsewhere.
   * Kept out of routes; `reference` remains the stable platform identity.
   */
  externalReference: string | null;
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
  /**
   * What the investor asked the bank to do at maturity.
   *
   * `null` when the bank's form did not ask, or the answer was not captured —
   * an absence the screens state rather than fill in with a default. Guessing
   * here would tell someone their money renews when it may be paid out.
   */
  maturityInstruction: MaturityInstruction | null;
  /**
   * The vault account that funded this deposit — **a reference, not a copy.**
   *
   * `ExternalBankAccount.id` and nothing else. The bank name, the IFSC and the
   * four digits stay in the vault, so an account corrected there is corrected
   * everywhere, and a holding cannot carry bank-account details that have
   * drifted from the record they describe.
   *
   * `null` for a deposit recorded before the vault existed, or one whose
   * funding account was never chosen. Stated as unknown rather than guessed.
   *
   * It says which account was **nominated at booking**. It does not say money
   * moved: there is no payment rail here, and nothing claims one.
   */
  fundingAccountId: string | null;
  status: HoldingStatus;
}
