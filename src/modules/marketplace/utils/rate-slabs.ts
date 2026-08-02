import type { RateSlab } from '../types/product';

/**
 * Rate-slab resolution (change request, 2026-08-02).
 *
 * The comparison screen asks a question the platform could not previously
 * answer: *what rate does **this** deposit earn?* Until now one rate per product
 * was the whole truth, because every figure on every screen was calculated on
 * the same ₹1,00,000 reference. Once the user types their own amount, the rate
 * becomes a function of it.
 *
 * Pure and React-free, like every other rule in `utils/` — so slab selection is
 * assertable without rendering, and so there is exactly one place that decides
 * which band an amount falls in.
 *
 * **This is not a calculation the UI may repeat.** `ProductService` is the sole
 * caller (Document 10 §15): it resolves the band once, hands the rate to
 * `calculateMaturity`, and publishes both as `estimatedReturns`. A component
 * that resolved a slab for itself would be a second opinion about the rate its
 * own maturity figure was derived from.
 */

/**
 * The rate applicable to `amount`, given a product's rate card.
 *
 * The **highest band the amount clears** wins. That phrasing matters more than
 * "the last matching band": it is correct whichever order the fixtures happen to
 * be in, and it does not assume rates rise with size. They frequently do not —
 * bulk deposits are often priced *below* retail — so a resolver that returned
 * the largest *rate* rather than the rate of the largest *band* would quietly
 * hand a ₹2 crore deposit the retail rate.
 *
 * Falls back to `baseRate` when the product publishes no slabs, and when the
 * amount sits below the first band. Both are the same statement: no band
 * applies, so the headline rate stands.
 */
export function resolveApplicableRate(
  baseRate: number,
  amount: number,
  slabs: readonly RateSlab[] = [],
): number {
  const applicable = slabs.reduce<RateSlab | null>((incumbent, slab) => {
    if (amount < slab.minAmount) return incumbent;
    if (incumbent && slab.minAmount <= incumbent.minAmount) return incumbent;
    return slab;
  }, null);

  return applicable?.annualRate ?? baseRate;
}
