import type { ProductMaster } from '@/types/product-master';
import { toWholeMonths } from '@/utils/finance';

import { allocateForGoal } from './allocate';
import { recommendForGoal } from './engine';
import { DEFAULT_ALLOCATION_POLICY } from '../constants/allocation-policy';
import type { AllocationPolicy } from '../types/allocation-policy';
import type { GoalInput } from '../types/goal';
import type { GoalPlanResult, MultiGoalPlan, MultiGoalPlanResult } from '../types/plan';
import type { RecommendationWarning } from '../types/rule';

/**
 * Multi-goal orchestration (client source document, Use Case 2).
 *
 * ## It orchestrates; it does not decide
 *
 * `recommendForGoal` is called **once per goal, unchanged**, and its best
 * candidate becomes that goal's leg. No ranking, filtering, pricing or maturity
 * logic exists here — this file's entire job is to keep each goal's money and
 * timeline attached to its own answer.
 *
 * Spreading is `allocateForGoal`'s job and is driven entirely by the
 * `AllocationPolicy` it is given — this file chooses no bank and divides no
 * amount.
 *
 * ## What it deliberately does not do
 *
 * - **No rate optimisation.** Candidates arrive ranked by suitability; nothing
 *   here reorders them, and the highest rate is not the objective.
 * - **No concentration cap.** The client has confirmed no maximum per bank.
 *   `§11.diversification` stays in `BLOCKED_RULES`; what runs is the
 *   insurance-aware consideration, which never refuses a placement.
 * - **No combined maturity.** The document reports none, and a plan-level figure
 *   is the sort a customer reads as a promise.
 * - **No scenario branches.** Nothing here knows what UC2 or UC3 look like.
 *
 * ## Horizons in any published unit
 *
 * The goal's horizon travels to the engine **in the unit the customer stated
 * it**. A 91-day goal is matched against 91-day deposits and nothing else; a
 * month-based goal never sees a day-based deposit. Neither term is converted,
 * because no approved document supplies a month length.
 *
 * `tenure-unsupported` therefore no longer fires for days. It remains in the
 * status union for a horizon that is neither whole months nor days — a fraction
 * of a month, say — which the comparison would refuse rather than round.
 */
export function recommendForPlan(
  products: readonly ProductMaster[],
  plan: MultiGoalPlan,
  policy: AllocationPolicy = DEFAULT_ALLOCATION_POLICY,
): MultiGoalPlanResult {
  const goals: GoalPlanResult[] = plan.goals.map((goal) => {
    /*
      `horizonMonths` is filled where an exact equivalent exists and left at zero
      where it does not — a 91-day term has none. `horizon` is the field the
      comparison actually reads, so the zero is never a term anyone is quoted.
    */
    const input: GoalInput = {
      goalType: goal.goalType,
      principal: goal.amount,
      horizonMonths: toWholeMonths(goal.horizon) ?? 0,
      horizon: goal.horizon,
      /*
        The investor profile, asked once for the journey, applied to every goal.
        A person is a senior citizen or is not; that fact does not vary by what
        the money is for, so it is not asked again per goal.
      */
      ...(plan.investor?.isSeniorCitizen === undefined
        ? {}
        : { isSeniorCitizen: plan.investor.isSeniorCitizen }),
    };

    /* The existing engine, unchanged, once per goal. */
    const result = recommendForGoal(products, input);
    const best = result.recommendations[0];

    if (!best) {
      return { goal, status: 'no-match', legs: [], warnings: result.warnings };
    }

    /*
      The suitability ranking goes in untouched; the policy decides only how the
      money is spread across it.
    */
    const legs = allocateForGoal(result.recommendations, goal.amount, policy);

    return { goal, status: 'allocated', legs, warnings: best.warnings };
  });

  const allocatedAmount = goals
    .flatMap((entry) => entry.legs)
    .reduce((total, leg) => total + leg.amount, 0);

  const warnings: RecommendationWarning[] = [];

  /*
    Reconciliation is reported, never corrected. If the goals do not sum to the
    total the customer stated, that is a fact about their plan — redistributing
    the difference would be this module inventing an allocation rule.
  */
  const goalsTotal = plan.goals.reduce((total, goal) => total + goal.amount, 0);

  if (goalsTotal !== plan.totalAmount) {
    warnings.push({
      kind: 'limitation',
      text: 'The amounts across your goals do not add up to the total you entered. Each goal is planned for the amount you gave it.',
    });
  }

  return {
    plan,
    goals,
    allocatedAmount,
    unallocatedAmount: Math.max(plan.totalAmount - allocatedAmount, 0),
    warnings,
  };
}
