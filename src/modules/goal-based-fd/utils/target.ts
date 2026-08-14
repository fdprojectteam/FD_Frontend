import type { MaturityResult } from '@/types/finance';

import type { GoalInput } from '../types/goal';
import type { TargetAssessment } from '../types/recommendation';
import type { RecommendationReason } from '../types/rule';

/**
 * Target maturity rules (`04-rule-engine.md` §12, R-TARGET-001/002/003).
 *
 * These are the rules the base-rate decision (D1) unblocked: they need an
 * expected maturity, an expected maturity needs a rate, and until `baseRate`
 * reached `ProductMaster` no rate was obtainable below ₹5,00,000.
 *
 * The arithmetic is trivial; the discipline is not. R-TARGET-003: *"The system
 * must not claim that the target is achievable when the calculated maturity is
 * below the target."* So `achieved` is a comparison of computed figures and
 * never a rounding-tolerant one — a ₹1 shortfall is a shortfall.
 */

/**
 * Assess a maturity against the customer's target, when they set one.
 *
 * Returns `undefined` when no target was given, so the recommendation simply has
 * no target section rather than an empty one.
 */
export function assessTarget(
  maturity: MaturityResult,
  goal: GoalInput,
): TargetAssessment | undefined {
  const { targetAmount } = goal;

  if (targetAmount === undefined) return undefined;

  const achieved = maturity.maturityValue >= targetAmount;

  return {
    targetAmount,
    achieved,
    /* R-TARGET-002 — floored at zero: a surplus is not a negative gap. */
    gap: achieved ? 0 : targetAmount - maturity.maturityValue,
  };
}

/**
 * The adjustments R-TARGET-003 permits the system to *present* when a target is
 * not reached.
 *
 * Suggestions in the document's own words — *"Increase investment · Extend
 * tenure · Modify product allocation"*. Deliberately not quantified: computing
 * "invest ₹1,40,000 more" would require assuming the same rate holds at the
 * higher amount, which the rate card contradicts, and assuming a longer tenure
 * exists, which the catalogue does not publish.
 */
export const TARGET_ADJUSTMENTS: readonly string[] = [
  'Increase the amount invested',
  'Extend the investment horizon',
  'Split the amount across more than one deposit',
] as const;

/** The reason a target assessment contributes to the explanation (§14). */
export function targetReason(
  assessment: TargetAssessment,
  maturity: MaturityResult,
  money: (value: number) => string,
): RecommendationReason {
  return assessment.achieved
    ? {
        ruleId: 'R-TARGET-001',
        text: `Expected maturity of ${money(maturity.maturityValue)} meets your ${money(assessment.targetAmount)} target.`,
      }
    : {
        ruleId: 'R-TARGET-002',
        text: `Expected maturity of ${money(maturity.maturityValue)} falls ${money(assessment.gap)} short of your ${money(assessment.targetAmount)} target.`,
      };
}
