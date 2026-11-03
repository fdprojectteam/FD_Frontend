import type { ProductMaster } from '@/types/product-master';
import { publishedTenure } from '@/utils/finance';
import { calculateDepositReturns } from '@/utils/finance';

import { selectCandidates } from './candidates';
import { blockedRuleWarnings, buildReasons, buildWarnings } from './explain';
import { compareCandidates } from './ranking';
import { assessTarget } from './target';
import { supportsMaturity } from './tenure-fit';
import { BLOCKED_RULES } from '../constants/blocked-rules';
import type { GoalInput } from '../types/goal';
import type { GoalRecommendationResult, Recommendation } from '../types/recommendation';
import type { RecommendationWarning } from '../types/rule';

/**
 * The Goal-Based FD rule engine (`04-rule-engine.md` §15).
 *
 * The document's execution flow, with the steps that can run:
 *
 * ```
 * Validate input                    ← here
 * Classify goal                     ← constants/goals.ts
 * Check customer eligibility        ✗ blocked (R-ELIG-002)
 * Filter eligible FDs               ← utils/candidates.ts (§8, two of five filters)
 * Match goal → tenure               ← utils/ranking.ts
 * Evaluate benefits                 ✗ blocked (R-ELIG-001)
 * Allocate investment               ← single-goal only; multi-goal needs §11
 * Apply diversification             ✗ blocked (§11)
 * Calculate maturity                ← @/utils/maturity
 * Check target                      ← utils/target.ts
 * Rank suitable options             ← utils/ranking.ts
 * Generate recommendation           ← here
 * Generate explanation              ← utils/explain.ts
 * ```
 *
 * ## Ownership
 *
 * Pure. It is handed products and returns recommendations; it does not fetch,
 * format for a screen, or know what a component is. `08-data-model.md` §2 —
 * *"Goal-Based FD must consume the existing FD product model. It must not create
 * a second FD product catalogue."* — so `ProductMaster` comes in whole and goes
 * out whole.
 *
 * ## Determinism (§19)
 *
 * No clock, no randomness, no iteration over object keys. The same products and
 * the same goal produce the same result, in the same order, every time. The
 * comparator's final tie-break on `productId` is what makes "same order" true
 * rather than merely likely.
 */

/** Why a goal could not be evaluated at all. Structural, not a rule outcome. */
function validateGoal(goal: GoalInput): RecommendationWarning[] {
  const problems: RecommendationWarning[] = [];

  if (!Number.isFinite(goal.principal) || goal.principal <= 0) {
    problems.push({ kind: 'limitation', text: 'Enter the amount you want to invest.' });
  }

  /*
    A horizon stated in its own unit is validated on that unit. `horizonMonths`
    remains the check for every caller that gives months only — so the original
    message and behaviour are unchanged for them.
  */
  if (goal.horizon === undefined) {
    if (!Number.isInteger(goal.horizonMonths) || goal.horizonMonths <= 0) {
      problems.push({ kind: 'limitation', text: 'Enter your investment horizon in whole months.' });
    }
  } else if (!Number.isFinite(goal.horizon.value) || goal.horizon.value <= 0) {
    problems.push({ kind: 'limitation', text: 'Enter how long you can invest for.' });
  }

  if (
    goal.selectedTenureMonths !== undefined &&
    (!Number.isInteger(goal.selectedTenureMonths) || goal.selectedTenureMonths <= 0)
  ) {
    problems.push({ kind: 'limitation', text: 'Choose a supported FD term in whole months.' });
  }

  if (
    goal.targetAmount !== undefined &&
    (!Number.isFinite(goal.targetAmount) || goal.targetAmount <= 0)
  ) {
    problems.push({ kind: 'limitation', text: 'A target amount must be greater than zero.' });
  }

  return problems;
}

/**
 * Recommend deposits for one goal.
 *
 * Returns an empty recommendation list rather than throwing when nothing
 * qualifies — "no product in this catalogue suits that goal" is a legitimate
 * answer and the customer is entitled to see the reason alongside it.
 */
export function recommendForGoal(
  products: readonly ProductMaster[],
  goal: GoalInput,
): GoalRecommendationResult {
  const invalid = validateGoal(goal);

  if (invalid.length > 0) {
    return {
      recommendations: [],
      candidatesConsidered: products.length,
      warnings: [...invalid, ...blockedRuleWarnings()],
      blockedRules: BLOCKED_RULES,
    };
  }

  const candidates = selectCandidates(products, goal);
  const ranked = [...candidates].sort((a, b) => compareCandidates(a, b, goal));

  const recommendations: Recommendation[] = ranked.map((candidate) => {
    /*
      One maturity calculation per recommendation, from the quote that was
      resolved for this principal — the same discipline `product-service.ts`
      follows. A second call anywhere would be a second opinion about the rate
      its own figure came from.
    */
    /*
      Maturity needs a month count to compound over. A deposit published in days
      has none, and turning days into months requires a day-count basis — 365,
      360 or actual — that no approved document states. So the figure is **not
      produced** for such a deposit rather than derived from a convention this
      platform invented.

      `null`, not zero and not omitted: the absence is a modelled outcome that a
      screen must handle, which is the point.
    */
    const maturity = supportsMaturity(publishedTenure(candidate.product.terms))
      ? (() => {
          const returns = calculateDepositReturns({
            principal: goal.principal,
            annualRate: candidate.quote.annualRate,
            tenureMonths: candidate.quote.tenureMonths,
            compoundingFrequency: candidate.product.terms.compoundingFrequency,
            isCumulative: candidate.product.terms.interestType === 'cumulative',
          });

          return {
            principal: goal.principal,
            interestEarned: returns.totalInterest,
            maturityValue: returns.maturityValue,
          };
        })()
      : null;

    /* No maturity, no target assessment — a target cannot be compared with nothing. */
    const target = maturity === null ? undefined : assessTarget(maturity, goal);

    return {
      productId: candidate.product.productId,
      /* Carried so an allocation leg keeps the goal it was recommended for. */
      goalType: goal.goalType,
      product: candidate.product,
      principal: goal.principal,
      tenureMonths: candidate.product.terms.tenureMonths,
      quote: candidate.quote,
      isSeniorCitizen: goal.isSeniorCitizen === true,
      maturity,
      ...(target ? { target } : {}),
      reasons: buildReasons(candidate, goal, maturity, target),
      warnings: [
        ...buildWarnings(candidate, goal),
        ...(maturity === null
          ? [
              {
                kind: 'limitation' as const,
                text: 'This deposit’s term is published in days, so an estimated maturity is not shown — the platform does not assume a day-count basis the bank has not published.',
              },
            ]
          : []),
      ],
    };
  });

  const warnings: RecommendationWarning[] = [];

  if (recommendations.length === 0 && products.length > 0) {
    const selectedTermExists =
      goal.selectedTenureMonths !== undefined &&
      products.some(
        (product) =>
          product.dataStatus === 'verified-live' &&
          product.terms.tenureMonths === goal.selectedTenureMonths,
      );

    warnings.push(
      goal.selectedTenureMonths !== undefined && !selectedTermExists
        ? {
            kind: 'limitation',
            ruleId: '§8.tenure-constraints',
            text: `No FD in the current demonstration catalogue is published for your selected ${String(goal.selectedTenureMonths)}-month term. Choose another term to see available options.`,
          }
        : {
            kind: 'limitation',
            ruleId: '§8.investment-amount',
            text:
              goal.selectedTenureMonths === undefined
                ? 'No product in the catalogue accepts this amount at a published rate.'
                : 'No product at your selected term accepts this amount at a published rate.',
          },
    );
  }

  return {
    recommendations,
    candidatesConsidered: products.length,
    warnings: [...warnings, ...blockedRuleWarnings()],
    blockedRules: BLOCKED_RULES,
  };
}
