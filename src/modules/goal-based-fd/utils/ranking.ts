import { publishedTenure } from '@/utils/finance';

import { goalHorizon, type PricedCandidate } from './candidates';
import { compareTenure } from './tenure-fit';
import { bankStrengthRank } from '../constants/bank-strength';
import { GOAL_TENURE_PREFERENCE, type TenurePreference } from '../constants/goals';
import type { GoalInput } from '../types/goal';

/**
 * Candidate ranking (`04-rule-engine.md` §5, §7, §13).
 *
 * ## Why an ordering and not a score
 *
 * A weighted score would need weights, and §13 gives a **priority order**, not
 * coefficients:
 *
 * > *1. Customer eligibility · 2. Goal suitability · 3. Tenure suitability ·
 * > 4. Required liquidity · 5. Target achievement · 6. Applicable benefits ·
 * > 7. Diversification · 8. Interest rate · 9. Expected maturity*
 *
 * Inventing "goal match is worth 40 points" would be inventing business rules,
 * and would also be untestable against anything. A lexicographic comparator over
 * the priorities that *can* be evaluated expresses exactly what the document
 * says and nothing more.
 *
 * Priorities 1, 6 and 7 are data-blocked and therefore absent from the
 * comparator, not zero-weighted. Priority 5 (target achievement) is applied by
 * the engine, which knows the target; this comparator handles 2, 3, 8 and 9.
 *
 * ## Rate is deliberately near the bottom
 *
 * §9: *"Highest interest rate alone does NOT determine the recommendation."*
 * §13 puts interest rate eighth. So rate breaks ties between products that are
 * equally good for the goal — it never overrides goal fit.
 */

/** Whether the product's own tenure is exactly the customer's horizon (R-TENURE-001). */
export function isExactTenureMatch(candidate: PricedCandidate, goal: GoalInput): boolean {
  return compareTenure(publishedTenure(candidate.product.terms), goalHorizon(goal)).exact;
}

/** Whether the deposit would still be locked after the customer needs the money. */
export function exceedsHorizon(candidate: PricedCandidate, goal: GoalInput): boolean {
  return compareTenure(publishedTenure(candidate.product.terms), goalHorizon(goal)).exceeds;
}

/**
 * Goal-suitability order among candidates that are not exact matches.
 *
 * Lower is better. Derived from `GOAL_TENURE_PREFERENCE`, which is derived from
 * the R-GOAL rules — no thresholds anywhere, only comparisons between tenures
 * the catalogue actually publishes.
 */
/*
  The fit key is computed from the comparison rather than from a month count, so
  a day-based goal ranks day-based deposits by the same three preferences. Both
  terms are always in the same unit here — `selectCandidates` has already dropped
  anything incomparable — so `magnitude` and `distance` are like-for-like.
*/
function goalFitKey(candidate: PricedCandidate, goal: GoalInput, preference: TenurePreference) {
  const fit = compareTenure(publishedTenure(candidate.product.terms), goalHorizon(goal));

  switch (preference) {
    case 'shortest':
      return fit.magnitude;
    case 'longest':
      return -fit.magnitude;
    case 'closest-to-horizon':
      return fit.distance;
  }
}

/**
 * Compares two candidates, best first.
 *
 * **Total and deterministic** — §19 requires identical inputs to produce
 * identical recommendations, and a comparator that can return 0 for two
 * different products would let array-sort stability decide the winner. The final
 * tie-break on `productId` guarantees it never does.
 */
export function compareCandidates(a: PricedCandidate, b: PricedCandidate, goal: GoalInput): number {
  /*
    §13.2 — **goal suitability first**, per the R-GOAL rule for this goal.

    This ordering was wrong until the Step 1–5 audit. The exact-tenure check
    below used to run *first*, which put tenure suitability (§13 priority 3)
    above goal suitability (priority 2) and diverged from the document in five of
    nine goal × horizon combinations. The visible symptom was an emergency goal
    with a 12-month horizon recommending the 12-month deposit over the 6-month
    one — while citing R-GOAL-001 ("prefer short-duration") and R-TENURE-003
    ("prefer shorter available tenures") as the reasons for doing so. The
    explanation and the ranking contradicted each other.

    §13 is followed literally now. No new rule was introduced to justify the old
    behaviour.
  */
  const preference = GOAL_TENURE_PREFERENCE[goal.goalType];
  const fit = goalFitKey(a, goal, preference) - goalFitKey(b, goal, preference);
  if (fit !== 0) return fit;

  /*
    §13.3 — R-TENURE-001: an exact tenure match is a strong preference, but a
    preference *within* equal goal fit. For `closest-to-horizon` goals an exact
    match already has the best fit key, so this changes nothing; for `shortest`
    and `longest` goals it breaks ties between tenures the R-GOAL rule ranks
    equally.
  */
  const exact = Number(isExactTenureMatch(b, goal)) - Number(isExactTenureMatch(a, goal));
  if (exact !== 0) return exact;

  /* §13.4 — required liquidity: among equally suitable terms, prefer the money back in time. */
  const beyond = Number(exceedsHorizon(a, goal)) - Number(exceedsHorizon(b, goal));
  if (beyond !== 0) return beyond;

  /* §13.8 — interest rate, only once goal fit is equal. */
  const rate = b.quote.annualRate - a.quote.annualRate;
  if (rate !== 0) return rate;

  /*
    Bank strength, once suitability, tenure and rate are all equal. It replaces
    an alphabetical accident with a safety consideration; it never overrides
    rate, because no approved document says it should. See `bank-strength.ts`.
  */
  const strength =
    bankStrengthRank(a.product.bank.rating) - bankStrengthRank(b.product.bank.rating);
  if (strength !== 0) return strength;

  /* Determinism (§19). Never reached by two distinct products with distinct data. */
  return a.product.productId.localeCompare(b.product.productId);
}
