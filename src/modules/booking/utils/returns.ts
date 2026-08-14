import { calculateMaturity, calculateSimpleInterest } from '@/utils/maturity';

import { resolveRate } from './tenure-rates';
import type { DepositTerms } from '../types/booking';
import type { PayoutOptionId } from '../types/draft';

/**
 * Payout-aware returns (T3.2.5).
 *
 * ## The rule this module exists to enforce
 *
 * > **Never display a compounded maturity for a payout product.**
 * > *(Decision C4, 2026-08-06.)*
 *
 * "Maturity Amount" means two different things depending on how interest is
 * paid, and the approved artwork only ever shows one of them:
 *
 * - **Cumulative / At Maturity** — interest is retained and compounds. The user
 *   receives principal *plus* interest at the end.
 * - **Monthly / Quarterly / Half-Yearly / Annual** — interest leaves the deposit
 *   as it accrues, so it cannot compound and the balance earning interest stays
 *   at the principal. The user receives **the principal** at maturity, having
 *   already been paid the interest in instalments.
 *
 * Showing ₹5,77,270 to someone on monthly payout would tell them they will
 * receive ₹5,77,270 at maturity when they will receive ₹5,00,000. That is not a
 * rounding disagreement; it is the wrong answer to the question the screen
 * exists to answer.
 *
 * ## What this module refuses to do
 *
 * It returns `null` when the tenure has no published rate. It does not fall back
 * to the headline rate, and it does not interpolate — see `tenure-rates.ts`. A
 * caller that gets `null` has nothing to display, which is the correct outcome
 * for a term nobody has priced.
 *
 * ## Tax
 *
 * `taxProfile` is a **seam, not a feature** (decision C6). Founder Vision §6
 * requires a post-tax view; Founder §5 places the user's tax bracket among the
 * *goal-led planner's* inputs, and that module does not exist. So this function
 * computes post-tax figures **only** when a profile is supplied and returns
 * `null` for them otherwise. No default rate, no assumed TDS, no invented
 * bracket.
 *
 * Pure and React-free. Every figure is a number; formatting belongs to
 * `@/utils/format`.
 */

/** Payouts that retain and compound interest rather than paying it out. */
const CUMULATIVE_PAYOUTS: readonly PayoutOptionId[] = ['at-maturity'];

/** How many interest instalments a year each payout option produces. */
const PAYOUTS_PER_YEAR: Record<PayoutOptionId, number> = {
  'at-maturity': 0,
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  annual: 1,
};

export function isCumulativePayout(payoutOption: PayoutOptionId): boolean {
  return CUMULATIVE_PAYOUTS.includes(payoutOption);
}

/**
 * A user's tax position. Supplied by the planner; never assumed here.
 *
 * `marginalRatePercent` rather than a slab name, because the slab → rate mapping
 * is a tax-policy concern that changes yearly and belongs wherever the planner
 * gets its data, not in a returns calculator.
 */
export interface TaxProfile {
  marginalRatePercent: number;
}

export interface ReturnsInput {
  principal: number;
  tenureMonths: number;
  payoutOption: PayoutOptionId;
  terms: DepositTerms;
  /** Omit for pre-tax figures only — the C6 seam. */
  taxProfile?: TaxProfile;
}

export interface ReturnsResult {
  principal: number;
  /** The rate actually applied — resolved from the tenure, never the headline. */
  annualRate: number;
  tenureMonths: number;
  payoutOption: PayoutOptionId;
  isCumulative: boolean;
  /** Total interest earned across the whole term. */
  totalInterest: number;
  /**
   * What the user receives at maturity.
   *
   * Equals `principal` for every payout option that pays interest out — the
   * invariant C4 asks for, and the one a probe asserts.
   */
  maturityValue: number;
  /**
   * One interest instalment, or `null` for cumulative deposits where there are
   * no instalments. Not zero: zero would claim a payout of nothing exists.
   */
  instalmentAmount: number | null;
  /** Instalments per year, or `null` when cumulative. */
  instalmentsPerYear: number | null;
  /**
   * Post-tax figures — `null` unless a `taxProfile` was supplied (C6).
   *
   * Null rather than optional so the absence is visible at the call site: a
   * caller must decide what to render when tax is unknown, rather than reading
   * `undefined` and formatting it as ₹0.
   */
  postTaxInterest: number | null;
  postTaxMaturityValue: number | null;
}

/**
 * Returns for one configuration, or `null` when the tenure has no published rate.
 */
export function calculateReturns({
  principal,
  tenureMonths,
  payoutOption,
  terms,
  taxProfile,
}: ReturnsInput): ReturnsResult | null {
  const quote = resolveRate(terms, { tenureMonths });

  // No published rate, no figures. See the module docstring.
  if (quote === null) return null;

  /*
    Destructured to a plain number here, deliberately.

    `ReturnsResult.annualRate` stays flat rather than becoming a nested quote:
    the returns strip and the summary rail both read `result.annualRate`, and
    nesting it would push this change into two approved components for no
    behavioural gain. The quote's extra provenance is available to callers that
    want it via `resolveRate` directly; this engine needs the rate.
  */
  const { annualRate } = quote;

  const cumulative = isCumulativePayout(payoutOption);

  const totalInterest = cumulative
    ? calculateMaturity({ principal, annualRate, tenureMonths }).interestEarned
    : calculateSimpleInterest({ principal, annualRate, tenureMonths });

  /*
    The C4 rule, expressed once. A payout deposit returns the principal because
    the interest has already been handed over in instalments.
  */
  const maturityValue = cumulative ? principal + totalInterest : principal;

  const instalmentsPerYear = cumulative ? null : PAYOUTS_PER_YEAR[payoutOption];

  /*
    The instalment is derived from the *number of instalments actually paid*
    rather than from an annual figure, so a term that is not a whole number of
    years still divides correctly. A 9-month deposit paying quarterly makes
    three payments, not four.

    `Math.floor` on the count: an instalment is only paid once its period has
    completed, and a 10-month quarterly deposit pays three times, not 3.33.
  */
  const instalmentCount =
    instalmentsPerYear === null ? null : Math.floor((tenureMonths * instalmentsPerYear) / 12);

  const instalmentAmount =
    instalmentCount === null || instalmentCount <= 0
      ? null
      : Math.round(totalInterest / instalmentCount);

  /*
    Tax applies to interest, never to the principal — returning your own money
    is not income. So the post-tax maturity value keeps the full principal and
    reduces only the interest component, which for a payout deposit means the
    maturity value is unchanged.
  */
  const postTaxInterest =
    taxProfile === undefined
      ? null
      : Math.round(totalInterest * (1 - taxProfile.marginalRatePercent / 100));

  const postTaxMaturityValue =
    postTaxInterest === null ? null : cumulative ? principal + postTaxInterest : principal;

  return {
    principal,
    annualRate,
    tenureMonths,
    payoutOption,
    isCumulative: cumulative,
    totalInterest,
    maturityValue,
    instalmentAmount,
    instalmentsPerYear,
    postTaxInterest,
    postTaxMaturityValue,
  };
}
