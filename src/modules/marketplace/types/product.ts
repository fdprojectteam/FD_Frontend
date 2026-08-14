import type { Bank, Benefit, Tenure, TrustIndicator } from '@/types/finance';

import type { BankDto } from './bank';

/**
 * Product domain types (M2.1).
 *
 * Split by use, per the approved adjustment:
 *   ProductSummary — everything a product card needs
 *   ProductDetails — the full product page payload (extends the summary)
 *
 * This block previously said the summary was everything "a card or comparison
 * column" needs. That was true until the comparison screen was designed in
 * detail: its Eligibility row reads `eligibility`, which lives on
 * ProductDetails. The comparison batch is therefore detail-level (T2.7.1a),
 * and the summary remains the card's shape.
 *
 * Rate slabs stood deliberately unmodelled until "a screen requires them"
 * (M2.1). The comparison screen now does: its Investment Preferences section
 * asks for a deposit amount and the Interest Rate row must answer with the rate
 * *that amount* actually earns (change request, 2026-08-02). So they are
 * modelled here — and only here. Nothing downstream reads a slab directly.
 */

export type InterestType = 'cumulative' | 'non-cumulative';
export type PayoutType = 'at-maturity' | 'monthly' | 'quarterly';

/**
 * One band of a product's rate card: "₹5,00,000 and above earns 7.85%".
 *
 * Bands are **half-open and lower-bounded** — `minAmount` is inclusive and the
 * upper edge is implied by the next band. An explicit `maxAmount` would let a
 * fixture describe a gap (or an overlap) between two bands, and there is no
 * sensible rate to return for an amount that falls in a hole. With lower bounds
 * only, every amount at or above the first band has exactly one answer.
 *
 * The rate is absolute, not a delta from `interestRate`. A published rate card
 * quotes the rate a saver receives, and storing "+0.10" would mean every
 * consumer reconstructs the real figure — the second opinion this codebase
 * keeps out of components (Document 07 §15).
 */
export interface RateSlab {
  /** Inclusive lower bound of the band, in rupees. */
  minAmount: number;
  /** Annual rate for deposits in this band, as a percentage number, e.g. 7.85. */
  annualRate: number;
}

export type ProductCategoryId =
  'highest-rate' | 'senior-citizen' | 'tax-saving' | 'short-term' | 'high-returns';

/** Flags rendered as highlight badges on cards (approved UI). */
export type ProductFlagId = 'highest-rate' | 'high-returns' | 'short-term' | 'limited-time';

export type { Benefit };

export interface Eligibility {
  /** Sentence shown on the product page (approved UI). */
  summary: string;
  minAge: number;
  residency: string;
  panRequired: boolean;
}

/* ------------------------------- DTO ------------------------------- */

export interface ProductSummaryDto {
  id: string;
  bank: BankDto;
  name: string;
  interestRate: number;
  /**
   * The senior-citizen uplift in percentage points, where the product publishes
   * one. Absent means it publishes none — never zero.
   */
  seniorCitizenDelta?: number;
  /**
   * The term in its published unit, when it is not whole months.
   *
   * Optional: a product that omits it publishes a whole-month term and
   * `tenureMonths` is authoritative. A day-based deposit carries it, and
   * `tenureMonths` is then `0` — the value the candidate filters and the rate
   * resolver already reject, so such a product is excluded from the month-based
   * engine rather than rounded into it.
   */
  tenure?: Tenure;
  tenureMonths: number;
  minInvestment: number;
  interestType: InterestType;
  payout: PayoutType;
  benefits: Benefit[];
  categories: ProductCategoryId[];
  flags: ProductFlagId[];
  /**
   * The product's rate card, in ascending `minAmount` order.
   *
   * Optional, and empty is legitimate: a product with no published slabs earns
   * `interestRate` at every amount. Making it required would force every fixture
   * and every future API payload to carry a one-entry array restating the
   * headline rate, and a resolver that has to handle "no slabs" anyway gains
   * nothing from being handed a synthetic band.
   */
  rateSlabs?: RateSlab[];
}

export interface ProductDetailsDto extends ProductSummaryDto {
  trustIndicators: TrustIndicator[];
  eligibility: Eligibility;
  interestBreakdown: string;
  faqs: { question: string; answer: string }[];
  terms: string[];
}

/* ----------------------------- Domain ------------------------------ */

export interface ProductSummary {
  id: string;
  bank: Bank;
  name: string;
  /**
   * The **headline** annual rate as a percentage number, e.g. 7.75 — the figure
   * the product is advertised, filtered and sorted on.
   *
   * Deliberately *not* the rate a given deposit earns: that depends on the
   * amount and lives in `estimatedReturns.appliedRate`. Keeping both means a
   * card can quote the rate card's opening rate while a comparison quotes what
   * the user's own money would earn, without either recomputing the other.
   */
  interestRate: number;
  /**
   * The senior-citizen uplift in percentage points, where the product publishes
   * one. Absent means it publishes none — never zero.
   */
  seniorCitizenDelta?: number;
  /**
   * The term in its published unit, when it is not whole months.
   *
   * Passed through from the DTO so the display layer can print what the bank
   * published. Absent means whole months, and `tenureMonths` is authoritative.
   */
  tenure?: Tenure;
  tenureMonths: number;
  minInvestment: number;
  interestType: InterestType;
  payout: PayoutType;
  benefits: Benefit[];
  categories: ProductCategoryId[];
  flags: ProductFlagId[];
  /** The published rate card, passed through from the DTO. */
  rateSlabs?: RateSlab[];
  /**
   * Returns on the amount this product was resolved for, derived by
   * ProductService — never sent by the API and never computed in a component.
   */
  estimatedReturns: {
    principal: number;
    /**
     * The rate `principal` actually earns, resolved from `rateSlabs`.
     *
     * It sits **inside** `estimatedReturns` rather than beside `interestRate`
     * because it is an amount-derived value exactly like `interestEarned` — it
     * is only meaningful paired with the `principal` it was resolved for.
     * Hoisting it to the top level would put two rates side by side with
     * nothing in the shape saying which one moves.
     */
    appliedRate: number;
    interestEarned: number;
    maturityValue: number;
  };
}

export interface ProductDetails extends ProductSummary {
  trustIndicators: TrustIndicator[];
  eligibility: Eligibility;
  interestBreakdown: string;
  faqs: { question: string; answer: string }[];
  terms: string[];
}
