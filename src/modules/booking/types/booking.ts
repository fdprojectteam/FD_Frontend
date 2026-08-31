import type { Bank, TenureRate } from '@/types/finance';

import type { PayoutOptionId } from './draft';

/**
 * Booking domain types (T3.1).
 *
 * **Why Booking declares its own product shape.** `modules/*` may not import
 * from another module — the boundary is ESLint-enforced — so this module cannot
 * reach for `ProductSummary`. That is the correct outcome rather than an
 * obstacle: what Booking needs is the *deposit the user chose*, frozen at the
 * moment they chose it, and that is a different concept from a catalogue row
 * even where the fields overlap. When the Booking API arrives it will return
 * this shape; today a fixture supplies it.
 *
 * `Bank` and `TrustIndicator` come from `@/types/finance`, the platform
 * vocabulary promoted in M2.2 precisely so Booking, Portfolio and Reports would
 * not each invent a bank.
 */

/** The eight steps of the approved booking journey, in order. */
export type BookingStepId =
  | 'overview'
  /**
   * Investor Verification — doc 07, **Stage 3**.
   *
   * Placed here, immediately after the overview and *before* configuration,
   * because that is where the approved future-state journey puts it: establish
   * what is already known about the investor before asking them for anything.
   * Moving it after Nominee would mean collecting an amount, a tenure and a
   * third party's details from someone the platform has not yet identified.
   */
  | 'identity'
  | 'investment'
  | 'nominee'
  | 'bank-account'
  /**
   * The partner bank's own FD application.
   *
   * After Bank Account and before Review: it is assembled from everything
   * collected up to that point, and Review then presents it alongside the rest
   * for one final read. Placed earlier it would have nothing to prefill from;
   * placed later the customer would confirm a booking before seeing the
   * application it produces.
   */
  | 'application'
  | 'review'
  | 'payment'
  | 'processing'
  | 'success';

export interface BookingStep {
  id: BookingStepId;
  label: string;
}

/**
 * The four progress steps the user is shown (T3.2.1).
 *
 * Distinct from `BookingStepId` on purpose. A step is **where the user is** — a
 * route, a guard, a resume point. A phase is **what the user is told** — one of
 * the four the Founder Note requires. They are different vocabularies and
 * collapsing them into one union is how a route id ends up in a progress label.
 *
 * The mapping lives in `constants/phases.ts` and nowhere else.
 */
export type BookingPhaseId = 'details' | 'nominee' | 'review' | 'pay-confirm';

export interface BookingPhase {
  id: BookingPhaseId;
  label: string;
}

/**
 * The product highlights shown as an icon row on the Overview screen.
 *
 * The icon is an **id**, not a component. Data that carries React elements
 * cannot come from an API, and the moment this shape is served rather than
 * hard-coded, an icon component in it would have to be stripped out again. The
 * mapping id → glyph lives in the component that renders it, the same pattern
 * `TrustIndicatorItem` and `MobileTabBar` already use.
 */
/**
 * ⚠ **`guaranteed-returns`, `secure-investment` and `regulated-bank` were
 * removed, not renamed.** Each was a claim about the bank or the money rather
 * than a property of the deposit: nothing in this build establishes that a
 * return is guaranteed, that an investment is secure, or that a partner bank's
 * licence has been checked. What remains describes the product's own published
 * terms, which the catalogue does carry.
 */
export type DepositHighlightId =
  'flexible-tenure' | 'payout-options' | 'premature-withdrawal' | 'auto-renewal';

export interface DepositHighlight {
  id: DepositHighlightId;
  label: string;
}

/** Icons for the Investment Summary rows, resolved the same way. */
export type SummaryRowIconId =
  | 'bank'
  | 'product'
  | 'rate'
  | 'min-investment'
  | 'max-investment'
  | 'tenure'
  | 'payout'
  | 'withdrawal'
  | 'renewal';

/**
 * The deposit the user selected, as Booking sees it.
 *
 * Every figure is a **number**, never a formatted string: formatting is a
 * presentation decision that belongs to `@/utils/format`, and a payload of
 * pre-rendered "₹5,00,000" strings cannot be compared, validated, or
 * recalculated. `investment-summary.ts` turns these into display rows.
 */
/**
 * A term the platform renders but the product does not publish.
 *
 * The catalogue publishes a bank, a rate, a tenure and a minimum. Everything
 * else on `DepositTerms` exists because the approved Booking screens draw it —
 * so for a deposit derived from a catalogue product those fields carry
 * placeholder values, and the customer must not read them as bank terms.
 *
 * Listing them by id lets the display layer say *"not published"* for exactly
 * those rows while every real figure renders normally. It is a fact about
 * provenance, not a business rule: nothing prices, filters or ranks by it.
 */
export type DemoTermId =
  | 'max-investment'
  | 'tenure-range'
  | 'payout-options'
  | 'premature-withdrawal'
  | 'auto-renewal'
  | 'tagline'
  | 'highlights';

export interface SelectedDeposit {
  productId: string;
  productName: string;
  /** Short trust line under the product name, e.g. "Secure • Trusted". */
  tagline: string;
  bank: Bank;
  /** The approved screen flags partner banks beside the product name. */
  isPreferredPartner: boolean;
  about: string;
  highlights: DepositHighlight[];
  terms: DepositTerms;
  /**
   * Terms on this deposit that are demo placeholders, not published bank terms.
   *
   * **Absent or empty means every term is real** — which is true of the curated
   * deposit taken from the approved artwork. A derived deposit lists the fields
   * the catalogue does not publish, and the screens render those as unpublished
   * rather than as figures the bank has agreed to.
   */
  demoTerms?: readonly DemoTermId[];
}

/**
 * The commercial terms quoted on the Overview screen.
 *
 * Ranges are modelled as pairs and unions as lists, so the summary can render
 * "7 Days – 10 Years" and "Monthly, Quarterly, Cumulative, At Maturity" from
 * data rather than from a sentence someone typed into a fixture.
 */
export interface DepositTerms {
  interestRate: number;
  tenureMonths: number;
  minInvestment: number;
  maxInvestment: number;
  /**
   * Supported step between valid amounts, measured from `minInvestment`
   * (BR-INV-003 — "in supported increments", e.g. minimum ₹10,000, increment
   * ₹1,000, so ₹15,000 is valid and ₹15,550 is not).
   *
   * **Optional, and absent means no increment rule** — any amount inside the
   * range is acceptable. BR-INV-003 itself says "if applicable", and the demo
   * product publishes none. Defaulting it to some round number would be
   * inventing a business rule and would reject amounts the bank accepts.
   */
  investmentIncrement?: number;
  /**
   * Candidate quick-amount chips this product wants to offer (T3.2.8, C3b).
   *
   * **Candidates, not the rendered list.** `resolveQuickAmounts` filters them
   * against this product's own minimum, maximum and increment, so a value here
   * is a suggestion rather than a guarantee. Optional: when absent the approved
   * screen's three amounts stand in, filtered the same way.
   */
  quickAmounts?: number[];
  tenureRange: { minDays: number; maxYears: number };
  /**
   * The rate card — what this product pays for each tenure it prices (T3.2.4b).
   *
   * **Authoritative for what may be selected.** `tenureRange` is marketing copy
   * ("7 Days – 10 Years") and is displayed on the summary panel; it is not a
   * list of terms the bank has quoted. Only tenures present here may be offered,
   * because only these have a rate the platform can stand behind.
   *
   * `interestRate` above remains the **headline** rate — the figure the product
   * is advertised at and the one the summary panel shows. It is not a fallback
   * for an unpriced tenure; `resolveTenureRate` returns `null` for those, by
   * design. See `utils/tenure-rates.ts`.
   *
   * Required, not optional: a product that priced nothing would be a product
   * that cannot be booked, and that should fail at the type rather than at
   * runtime.
   */
  tenureRates: TenureRate[];
  /**
   * The payout options as the product advertises them, for the summary rail.
   *
   * Display copy — "Monthly, Quarterly, Cumulative, At Maturity" — and
   * deliberately *not* what the selector reads. A partner bank may call the same
   * thing "Cumulative" or "At Maturity"; the control must offer one card, not
   * two, so it works from `supportedPayouts` instead.
   */
  payoutOptions: string[];
  /**
   * The payout options this product actually offers, in platform vocabulary
   * (T3.2.9).
   *
   * Spec 21b §D — *"Unavailable options should not be displayed"* — needs a
   * machine-readable answer, and a list of human strings is not one. This is
   * that answer, and `resolvePayoutOptions` narrows the platform's five to it.
   *
   * Required rather than optional: a product that stated no payout options
   * would be one nothing could price, and that should fail at the type rather
   * than render an empty control.
   */
  supportedPayouts: PayoutOptionId[];
  prematureWithdrawal: 'allowed-with-terms' | 'allowed' | 'not-allowed';
  autoRenewal: boolean;
}

/** One row of the Investment Summary panel, ready to render. */
export interface InvestmentSummaryRow {
  id: string;
  icon: SummaryRowIconId;
  label: string;
  value: string;
  /** Draws the value in the brand tone — the approved screen emphasises the rate. */
  emphasis?: boolean;
}

/**
 * Everything the Overview screen displays.
 *
 * One object rather than loose props for the same reason the comparison's
 * preferences are one object: the next field the client adds is a key here, not
 * a new prop threaded through the page, the screen, and three sections.
 */
export interface BookingOverview {
  deposit: SelectedDeposit;
  /** Assurance cards in the screen header (security, regulation, support). */
  assurances: BookingAssurance[];
  /** The plain-language notes shown in the Important Information callout. */
  importantInformation: string[];
  /**
   * The Investment Details screen's own disclosure notes (T3.2.7).
   *
   * A separate list because the approved artwork carries **different copy** on
   * the two screens: Overview discloses that rates come from the partner bank,
   * Investment Details discloses TDS, premature withdrawal and terms review.
   * One shared list would force one screen to show the other's copy.
   *
   * Transcribed from the approved artwork — see the fixture.
   */
  investmentInformation: string[];
  /**
   * The Nominee screen's "Why Nomination is Important" points (T3.3.2).
   *
   * A third list for the same reason there is a second: the approved artwork
   * carries different copy on each screen, and one shared list would force one
   * screen to show another's words. Transcribed from
   * `FD_booking_nominee_03.png`.
   */
  nominationInformation: string[];
  /** What pressing Continue leads to, stated before it is pressed. */
  nextStep: string;
}

/**
 * What the platform undertakes to do, at the point the customer is committing.
 *
 * ⚠ **`bank-grade-security`, `safe-and-secure` and `support` were removed.**
 * They read "Bank Grade Security · 256-bit encryption", "100% Safe & Secure ·
 * RBI Regulated Platform" and "24x7 Support · Always here to help". No
 * encryption standard has been implemented or audited here, this platform is
 * not RBI regulated, and no support line is staffed. Three reassurances at the
 * exact moment a customer decides to trust a screen, none of them true.
 *
 * The replacements are properties of the flow the customer is standing in, and
 * each is verifiable by continuing through it.
 */
export type BookingAssuranceId = 'terms-first' | 'no-credentials' | 'demonstration';

export interface BookingAssurance {
  id: BookingAssuranceId;
  title: string;
  description: string;
}
