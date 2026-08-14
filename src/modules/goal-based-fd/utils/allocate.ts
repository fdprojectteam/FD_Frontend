import { formatCurrency } from '@/utils';

import type { AllocationPolicy } from '../types/allocation-policy';
import type { AllocationLeg, SafetyAssessment } from '../types/plan';
import type { Recommendation } from '../types/recommendation';

/**
 * Spreading one goal's money across suitable deposits.
 *
 * ## What decides the order
 *
 * **Not rate.** The candidates arriving here are already ranked by
 * `compareCandidates`, which orders on goal suitability first, then exact
 * tenure match, then whether the term overruns the horizon, and only then on
 * rate. This function preserves that order exactly — it chooses *how much* goes
 * where, never *which is better*.
 *
 * ## What decides the split
 *
 * Deposit insurance, as a consideration. Under an `insurance-aware` policy the
 * engine prefers to keep each bank's exposure within insured cover, walking the
 * suitability ranking and taking up to one cover's worth from each distinct
 * bank.
 *
 * **Cover is not a ceiling.** When the suitable banks run out before the money
 * does, the remainder goes to the best-fitting deposit and the leg is marked as
 * exceeding insured cover. Refusing to place it would serve nobody, and the
 * client has not confirmed a maximum-per-bank rule — so the platform acts on the
 * safety fact it has and discloses the rest.
 *
 * ## No scenario knowledge
 *
 * Nothing here knows about education, retirement, ₹10,00,000 or four banks. The
 * documented allocations fall out of the policy and the catalogue: a goal splits
 * when more than one suitable bank exists and the amount exceeds cover, and it
 * does not when either is untrue.
 */
export function allocateForGoal(
  ranked: readonly Recommendation[],
  amount: number,
  policy: AllocationPolicy,
): AllocationLeg[] {
  const best = ranked[0];
  if (!best || amount <= 0) return [];

  if (policy.concentration === 'none') {
    return [toLeg(best, amount, policy)];
  }

  /*
    Spreading changes who holds the money, not how long it is held. Under
    `same-term-only` the eligible set is the deposits sharing the best
    candidate's term — so a ten-year goal is never half-placed in a five-year
    deposit in the name of diversification.
  */
  const eligible =
    policy.spreadAcross === 'same-term-only'
      ? ranked.filter((entry) => entry.quote.tenureMonths === best.quote.tenureMonths)
      : ranked;

  const legs: AllocationLeg[] = [];
  const usedBankIds = new Set<string>();
  let remaining = amount;

  for (const candidate of eligible) {
    if (remaining <= 0 || legs.length >= policy.maxLegsPerGoal) break;

    const bankId = candidate.product.bank.id;
    if (policy.requireDistinctBanks && usedBankIds.has(bankId)) continue;

    /*
      One cover's worth at most from each bank — the whole point of walking the
      ranking rather than filling the best deposit first.
    */
    const take = Math.min(remaining, policy.insuredCoverageAmount);
    legs.push(toLeg(candidate, take, policy));
    usedBankIds.add(bankId);
    remaining -= take;
  }

  /*
    The suitable banks ran out before the money did. The remainder joins the
    best-fitting leg rather than being left unplaced, and that leg is then
    outside insured cover — which `toLeg` states rather than hides.

    This is the branch that reproduces a single large allocation without any
    rule saying "retirement is not split": there is simply nowhere else suitable
    to put it.
  */
  if (remaining > 0 && legs.length > 0) {
    const [first, ...rest] = legs;
    return [toLeg(best, first!.amount + remaining, policy), ...rest];
  }

  return legs;
}

/**
 * One placement, with its safety position stated.
 *
 * The reasoning is attached to the leg rather than computed by a screen: a UI
 * that decided for itself whether an amount was insured would be a second
 * authority on the customer's safety.
 */
function toLeg(
  recommendation: Recommendation,
  amount: number,
  policy: AllocationPolicy,
): AllocationLeg {
  const { product, quote, reasons, productId } = recommendation;

  return {
    goalType: recommendation.goalType,
    productId,
    bank: product.bank,
    amount,
    quote,
    reasons,
    safety: assessSafety(amount, product.bank.name, policy),
  };
}

/**
 * Whether this placement sits within deposit insurance, and what to say about it.
 *
 * Both outcomes carry the same rule id — the consideration ran either way, and a
 * customer is entitled to know it ran and concluded the exposure was fine.
 */
function assessSafety(
  amount: number,
  bankName: string,
  policy: AllocationPolicy,
): SafetyAssessment {
  const withinInsuredCover = amount <= policy.insuredCoverageAmount;

  return {
    ruleId: '§11.deposit-insurance',
    withinInsuredCover,
    insuredCoverageAmount: policy.insuredCoverageAmount,
    text: withinInsuredCover
      ? `This ${formatCurrency(amount)} at ${bankName} is within the ${formatCurrency(policy.insuredCoverageAmount)} deposit-insurance cover.`
      : `This ${formatCurrency(amount)} at ${bankName} is above the ${formatCurrency(policy.insuredCoverageAmount)} deposit-insurance cover. No other deposit suited this goal, so it has not been split further.`,
  };
}
