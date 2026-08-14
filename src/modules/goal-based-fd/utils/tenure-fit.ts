import type { Tenure } from '@/types/finance';
import { toWholeMonths } from '@/utils/finance';

/**
 * Comparing a customer's horizon with a deposit's published term.
 *
 * ## Why comparison needs its own module
 *
 * The client source document prices deposits in **days** (91 days) and in
 * **years** (3 years, 10 years). Years convert to months exactly; days do not.
 * So "is this deposit's term a good fit for this goal?" is no longer subtraction
 * of two month counts, and pretending it is would mean choosing a month length —
 * a convention no approved document supplies.
 *
 * ## The rule: compare within a unit, never across one
 *
 * Two terms are comparable when both reduce to whole months (months and years),
 * **or** when both are stated in days. A day term and a month term are *not*
 * comparable, and this module says so rather than guessing.
 *
 * That is why a 91-day goal matches the 91-day deposit and nothing else, and why
 * a 12-month goal never sees the 91-day deposit. Neither outcome required a
 * day-count convention, and neither restates a term the bank published.
 *
 * ## What it does not do
 *
 * It computes no maturity and no rate. It answers only how well two terms line
 * up, in a unit both are expressed in.
 */

/** How a deposit's term stands against a goal's horizon. */
export interface TenureFit {
  /**
   * Whether the two terms can be compared at all.
   *
   * `false` is a real answer — a day-based deposit against a month-based goal —
   * and the candidate is excluded rather than approximated in.
   */
  comparable: boolean;
  /** Distance from the horizon, in whichever unit both are expressed. Lower is closer. */
  distance: number;
  /** The deposit's term is exactly the customer's horizon. */
  exact: boolean;
  /** The deposit matures after the customer needs the money. */
  exceeds: boolean;
  /** The deposit's term, in its own unit, for ordering within a comparable set. */
  magnitude: number;
}

const INCOMPARABLE: TenureFit = {
  comparable: false,
  distance: Number.POSITIVE_INFINITY,
  exact: false,
  exceeds: false,
  magnitude: Number.POSITIVE_INFINITY,
};

/**
 * Compare a deposit's published term with a customer's horizon.
 *
 * Both arguments are the terms **as published and as stated** — nothing is
 * normalised on the way in, because normalising is the thing being avoided.
 */
export function compareTenure(productTerm: Tenure, horizon: Tenure): TenureFit {
  /* Days are only ever compared with days. No convention exists to do otherwise. */
  if (productTerm.unit === 'days' || horizon.unit === 'days') {
    if (productTerm.unit !== 'days' || horizon.unit !== 'days') return INCOMPARABLE;

    return fit(productTerm.value, horizon.value);
  }

  const productMonths = toWholeMonths(productTerm);
  const horizonMonths = toWholeMonths(horizon);

  if (productMonths === null || horizonMonths === null) return INCOMPARABLE;

  return fit(productMonths, horizonMonths);
}

function fit(term: number, horizon: number): TenureFit {
  return {
    comparable: true,
    distance: Math.abs(term - horizon),
    exact: term === horizon,
    exceeds: term > horizon,
    magnitude: term,
  };
}

/**
 * Whether a maturity figure can be produced for this term.
 *
 * `calculateMaturity` compounds quarterly over a month count. A day term has no
 * month count, and turning one into the other needs a day-count basis — 365, 360
 * or actual — that no approved document states. So the platform reports **no
 * maturity** for such a deposit rather than publishing a figure derived from a
 * convention it invented.
 *
 * Explicit and named, so the absence is a modelled outcome rather than a
 * `null` someone later "fixes" with a default.
 */
export function supportsMaturity(productTerm: Tenure): boolean {
  return toWholeMonths(productTerm) !== null;
}
