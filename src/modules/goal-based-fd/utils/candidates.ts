import type { RateQuote, Tenure } from '@/types/finance';
import type { ProductMaster } from '@/types/product-master';
import { publishedTenure, resolveProductRate } from '@/utils/finance';

import { compareTenure } from './tenure-fit';
import type { GoalInput } from '../types/goal';

/**
 * Product filtering and pricing (`04-rule-engine.md` §8).
 *
 * §8 lists five filters. Two of them can run — investment amount and tenure
 * constraints — and three cannot: customer eligibility, product availability and
 * maximum investment all require data the catalogue does not publish. The three
 * are declared in `constants/blocked-rules.ts` rather than approximated here.
 *
 * Pure and React-free, like every rule under `utils/`.
 */

/** A product that survived filtering, together with the rate it was priced at. */
export interface PricedCandidate {
  product: ProductMaster;
  quote: RateQuote;
}

/**
 * The products that can carry this goal's money, each with a resolved rate.
 *
 * Three things happen, in this order, and each one drops a product for a stated
 * reason:
 *
 * 1. **§8 investment amount** — the principal must clear `minInvestment`. This
 *    is the lower bound only; the upper bound is blocked
 *    (`§8.maximum-investment`), so no product is dropped for being too small a
 *    home for the money.
 * 2. **§8 tenure constraints** — the product must publish a usable tenure. A
 *    product with a non-positive tenure is not bookable.
 * 3. **Pricing** — `resolveProductRate` must return a quote at the product's own
 *    tenure and this principal. A product it cannot price is **dropped, not
 *    defaulted**. That is the §16 rule *"must not invent rates"* applied at the
 *    only place it could be violated: a candidate with no rate would otherwise
 *    need a fallback, and any fallback is a number no bank agreed to pay.
 *
 * Note what is *not* here: no filter on tenure exceeding the horizon. The
 * documents do not define one, so a longer product is ranked lower and warned
 * about rather than silently removed.
 */
/**
 * The customer's horizon in its published unit.
 *
 * `horizon` when they stated one — the only way a day-based goal survives — and
 * months otherwise, which is what every existing caller means.
 */
export function goalHorizon(goal: GoalInput): Tenure {
  return goal.horizon ?? { value: goal.horizonMonths, unit: 'months' };
}

export function selectCandidates(
  products: readonly ProductMaster[],
  goal: GoalInput,
): PricedCandidate[] {
  const candidates: PricedCandidate[] = [];

  /*
    A verified partner catalogue is authoritative where it exists. The older
    demonstration fixtures remain useful to exercise Marketplace UI, but must
    never outrank or duplicate a bank's verified rate in advice.
   */
  const verifiedProducts = products.filter((product) => product.dataStatus === 'verified-live');
  const catalogue =
    goal.selectedTenureMonths !== undefined && verifiedProducts.length > 0
      ? verifiedProducts
      : products;

  const horizon = goalHorizon(goal);

  for (const product of catalogue) {
    if (goal.principal < product.minInvestment) continue;

    /*
      A term the customer's horizon cannot be compared with is not a candidate.
      That is what excludes a 91-day deposit from a 12-month goal and a 12-month
      deposit from a 91-day goal — in both directions, and without either term
      being converted into the other's unit.
    */
    const tenureFit = compareTenure(publishedTenure(product.terms), horizon);
    if (!tenureFit.comparable) continue;

    /*
      A selected FD term is an instruction, not a ranking preference. Without
      this gate the emergency-goal comparator could put a six-month product
      ahead of a customer's explicit 24-month selection. We retain the normal
      horizon-only ranking for programmatic callers that did not receive an
      explicit selection.
    */
    if (
      goal.selectedTenureMonths !== undefined &&
      product.terms.tenureMonths !== goal.selectedTenureMonths
    ) {
      continue;
    }

    const quote = resolveProductRate(product.terms, {
      tenureMonths: product.terms.tenureMonths,
      /* Match on the published term, so a day-based deposit can be priced. */
      tenure: publishedTenure(product.terms),
      amount: goal.principal,
      /*
        The depositor's status travels to the one authority that prices. The
        uplift is the product's to publish and the resolver's to apply; nothing
        in this module adds, defaults or infers a rate.
      */
      isSeniorCitizen: goal.isSeniorCitizen,
    });

    if (quote === null) continue;

    candidates.push({ product, quote });
  }

  return candidates;
}
