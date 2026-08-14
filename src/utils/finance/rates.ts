import type { RateCriteria, RateQuote } from '@/types/finance';
import type { FixedDepositTerms, ProductRateBand } from '@/types/product-master';

import { isSameTenure, publishedTenure } from './tenure';

/**
 * Platform rate resolution — amount bands (R1, step 2 · partial).
 *
 * ## Why this moved here
 *
 * This is `resolveApplicableRate`, unchanged, relocated from
 * `src/modules/marketplace/utils/rate-slabs.ts`. Not a rewrite and not a second
 * opinion: the same reduction, the same tie-breaks, the same fallback, asserted
 * by the same tests.
 *
 * `docs/engineering/shared-finance-layer.md` §5 scheduled the move and named the
 * triggers that would bring it forward. One of them was *"the first
 * platform-level finance need from a third module"*. Goal-Based FD is that third
 * module: it may import `services`, `types` and `utils`, and it may **not**
 * import Marketplace or Booking (`eslint.config.mjs`). A rule that lives inside
 * a feature module is a rule the platform cannot reach.
 *
 * Marketplace now imports from here. Its own file is a re-export and holds no
 * implementation, so there is no duplicate to keep in step — the outcome TD-001
 * is still waiting for on the maturity side.
 *
 * ## What did *not* move
 *
 * Booking's tenure resolver (`modules/booking/utils/tenure-rates.ts`) stays where
 * it is. It answers a different question against a type this layer does not
 * model, nothing is blocked on it, and moving it would widen the blast radius
 * for no present gain. R1 step 2 merges it later.
 */

/**
 * The rate applicable to `amount`, given a base rate and a published rate card.
 *
 * The **highest band the amount clears** wins. That phrasing matters more than
 * "the last matching band": it is correct whichever order the bands arrive in,
 * and it does not assume rates rise with size. They frequently do not — bulk
 * deposits are often priced *below* retail — so a resolver that returned the
 * largest *rate* rather than the rate of the largest *band* would quietly hand a
 * ₹2 crore deposit the retail rate.
 *
 * Falls back to `baseRate` when the product publishes no bands, and when the
 * amount sits below the first one. Both are the same statement: no band applies,
 * so the published base rate stands.
 *
 * Band rates are **absolute, not deltas** (`ProductRateBand.annualRate`), so the
 * value returned is the rate a saver receives and needs no reconstruction.
 */
export function resolveApplicableRate(
  baseRate: number,
  amount: number,
  bands: readonly ProductRateBand[] = [],
): number {
  const applicable = bands.reduce<ProductRateBand | null>((incumbent, band) => {
    if (amount < band.minAmount) return incumbent;
    if (incumbent && band.minAmount <= incumbent.minAmount) return incumbent;
    return band;
  }, null);

  return applicable?.annualRate ?? baseRate;
}

/**
 * What a fixed deposit earns for a given configuration, as a quote.
 *
 * The composition law this implements is already stated on `TenureRate` in
 * `@/types/finance`:
 *
 * > *"the tenure sets the base rate, the amount slab may then override it"*
 *
 * So: `terms.baseRate` is the rate published at `terms.tenureMonths`, and
 * `terms.rateSlabs` may override it for large enough amounts. Both halves come
 * from the product; neither is derived from the other.
 *
 * ## Why it returns `null` for another tenure
 *
 * A catalogue product publishes **one** tenure. Asked for a rate at a tenure the
 * product does not offer, this returns `null` rather than quoting the base rate
 * anyway — the same rule Booking's `resolveRate` follows, for the same reason:
 * *"Booking must not invent rates"* (decision of 2026-08-06). A 36-month figure
 * derived from a 24-month product is a number no bank has agreed to pay.
 *
 * When the catalogue publishes a tenure rate card this function gains a lookup
 * and its callers do not change. Until then the single tenure is the whole
 * truth, and it is checked rather than assumed.
 *
 * ## Why `amount` is optional
 *
 * `RateCriteria.amount` is optional, so an omitted amount means "no amount band
 * applies" and the base rate stands — identical to passing an amount below the
 * first band. That keeps the base rate reachable without a caller inventing a
 * placeholder amount to ask for it.
 */
export function resolveProductRate(
  terms: FixedDepositTerms,
  criteria: RateCriteria,
): RateQuote | null {
  const { tenureMonths, amount, isSeniorCitizen, tenure } = criteria;

  /*
    A caller that supplies the term in its published unit is matched on that,
    exactly. It is the only way a deposit whose term is not whole months — a
    91-day deposit — can be priced at all, and it never converts: the units must
    agree or the product is simply not this one.

    Callers that supply only months take the original path, byte for byte.
  */
  if (tenure !== undefined) {
    if (!isSameTenure(tenure, publishedTenure(terms))) return null;
  } else {
    if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) return null;
    if (tenureMonths !== terms.tenureMonths) return null;
  }

  const bandedRate =
    amount === undefined
      ? terms.baseRate
      : resolveApplicableRate(terms.baseRate, amount, terms.rateSlabs);

  /*
    The senior-citizen uplift applies *after* the amount band, so the two
    compose: a ₹5,00,000 deposit by a senior citizen earns the banded rate plus
    the published benefit. The delta is only applied when the product publishes
    one and the depositor qualifies — there is no default, so a product without
    the field is unaffected and every existing quote is byte-identical.

    Rounded to two decimals for the reason `buildRateSlabs` already documents:
    `7.4 + 0.1` is `7.500000000000001` in binary floating point, and an unrounded
    rate loses ties against a literal it should have drawn.
  */
  const uplift = isSeniorCitizen === true ? (terms.seniorCitizenDelta ?? 0) : 0;
  const annualRate = uplift === 0 ? bandedRate : Math.round((bandedRate + uplift) * 100) / 100;

  return { annualRate, tenureMonths: terms.tenureMonths };
}
