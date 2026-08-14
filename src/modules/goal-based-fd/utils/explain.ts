import type { MaturityResult } from '@/types/finance';
import { formatCurrency, formatRate, formatTenure } from '@/utils';

import type { PricedCandidate } from './candidates';
import { exceedsHorizon, isExactTenureMatch } from './ranking';
import { targetReason } from './target';
import { BLOCKED_RULES } from '../constants/blocked-rules';
import { GOAL_LABELS } from '../constants/goals';
import type { GoalInput } from '../types/goal';
import type { TargetAssessment } from '../types/recommendation';
import type { RecommendationReason, RecommendationWarning } from '../types/rule';

/**
 * Explanation generation (`04-rule-engine.md` §14).
 *
 * > *"Every recommendation must provide explainable reasons."*
 *
 * The constraint that shapes this file: **a reason is emitted only by a rule
 * that actually fired**. No sentence is composed here that some rule above did
 * not already decide, and every sentence carries the rule id that decided it.
 * That is what makes the explanation checkable rather than decorative — if the
 * ranking changes, the reasons change with it, because they are built from the
 * same predicates the comparator uses.
 */

/** The goal-classification reason for this goal (R-GOAL-001/002/003). */
function goalReason(goal: GoalInput, candidate: PricedCandidate): RecommendationReason {
  const tenure = formatTenure(candidate.product.terms.tenureMonths);

  switch (goal.goalType) {
    case 'emergency':
      return {
        ruleId: 'R-GOAL-001',
        text: `A ${tenure} term keeps your emergency fund available sooner, which is what an emergency goal needs.`,
      };
    case 'education':
      return {
        ruleId: 'R-GOAL-002',
        text: `A ${tenure} term is the closest available match to your ${formatTenure(goal.horizonMonths)} education horizon.`,
      };
    case 'retirement':
      return {
        ruleId: 'R-GOAL-003',
        text: `A ${tenure} term is the longest available, which suits a retirement horizon of ${formatTenure(goal.horizonMonths)}.`,
      };
  }
}

/**
 * Every reason supporting one recommendation, best-reason first.
 *
 * Ordered to match §13's priority list, so the sentence a customer reads first
 * is the consideration the document ranks highest among those that ran.
 */
export function buildReasons(
  candidate: PricedCandidate,
  goal: GoalInput,
  maturity: MaturityResult | null,
  target: TargetAssessment | undefined,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  const { product, quote } = candidate;

  /* §13.3 — R-TENURE-001, the strongest signal when it fires. */
  if (isExactTenureMatch(candidate, goal)) {
    reasons.push({
      ruleId: 'R-TENURE-001',
      text: `The ${formatTenure(product.terms.tenureMonths)} term matches your ${formatTenure(goal.horizonMonths)} horizon exactly.`,
    });
  }

  /* §13.2 — goal suitability. */
  reasons.push(goalReason(goal, candidate));

  /* R-TENURE-003 — stated separately from R-GOAL-001 because §7 lists it separately. */
  if (goal.goalType === 'emergency' && !exceedsHorizon(candidate, goal)) {
    reasons.push({
      ruleId: 'R-TENURE-003',
      text: 'Shorter available terms are preferred for emergency goals so the money is not locked away when you need it.',
    });
  }

  /* §13.5 — target achievement, when a target was set. */
  if (target && maturity) reasons.push(targetReason(target, maturity, formatCurrency));

  /*
    R-ELIG-001 — stated only when the benefit actually changed the rate. A line
    claiming a senior-citizen rate on a product that publishes none would be a
    reason for something that did not happen.
  */
  if (goal.isSeniorCitizen === true && product.terms.seniorCitizenDelta !== undefined) {
    reasons.push({
      ruleId: 'R-ELIG-001',
      text: `This deposit publishes a senior-citizen benefit, so the rate quoted includes it. The bank confirms eligibility at booking.`,
    });
  }

  /* §8 — the filters that actually ran, so the customer knows what was checked. */
  reasons.push({
    ruleId: '§8.investment-amount',
    text: `Your ${formatCurrency(goal.principal)} clears this product's ${formatCurrency(product.minInvestment)} minimum.`,
  });

  /* §13.8 — rate last, because §9 says rate alone does not decide. */
  reasons.push({
    ruleId: '§8.tenure-constraints',
    text: `Priced at ${formatRate(quote.annualRate)} for ${formatTenure(quote.tenureMonths)}, the rate this product publishes for your amount.`,
  });

  return reasons;
}

/**
 * Warnings specific to one recommendation.
 *
 * A limitation is a **fact about this deposit**, not a rule that failed. The
 * horizon warning is the one that matters for retirement: the catalogue's
 * longest term is far shorter than any retirement horizon, so a customer must
 * be told the deposit matures long before the goal rather than left to infer it
 * from a tenure figure.
 */
export function buildWarnings(
  candidate: PricedCandidate,
  goal: GoalInput,
): RecommendationWarning[] {
  const warnings: RecommendationWarning[] = [];
  const { tenureMonths } = candidate.product.terms;

  if (exceedsHorizon(candidate, goal)) {
    warnings.push({
      kind: 'limitation',
      ruleId: 'R-TENURE-001',
      text: `This deposit matures in ${formatTenure(tenureMonths)}, after your ${formatTenure(goal.horizonMonths)} horizon. Your money stays locked until then.`,
    });
  } else if (tenureMonths < goal.horizonMonths) {
    warnings.push({
      kind: 'limitation',
      ruleId: 'R-TENURE-001',
      text: `This deposit matures in ${formatTenure(tenureMonths)}, before your ${formatTenure(goal.horizonMonths)} horizon ends. Reinvesting afterwards is at rates not yet published.`,
    });
  }

  return warnings;
}

/**
 * One warning per rule the documents define that the engine did not evaluate.
 *
 * Emitted on every result, not only when it might matter. A customer comparing
 * two recommendations has no way to know that senior-citizen benefits were never
 * considered unless the result says so.
 */
export function blockedRuleWarnings(): RecommendationWarning[] {
  return BLOCKED_RULES.map((rule) => ({
    kind: 'blocked-rule' as const,
    ruleId: rule.ruleId,
    text: `${rule.ruleId} was not evaluated: ${rule.missingData}`,
  }));
}

/** The goal's display label, for callers that render the result. */
export function goalLabel(goal: GoalInput): string {
  return GOAL_LABELS[goal.goalType];
}
