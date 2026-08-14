import type { RateCriteria, RateQuote, TenureRate } from '@/types/finance';

import type { DepositTerms } from '../types/booking';

/**
 * Tenure → rate resolution (T3.2.4b).
 *
 * ## Why this exists
 *
 * A fixed deposit is a rate-**for-tenure** contract. Until Booking, one rate per
 * product was the whole truth, because every Marketplace figure was quoted at
 * the product's own single tenure. The moment a user may *choose* a tenure, the
 * rate becomes a function of that choice — and M2.6 decision D2 refused to offer
 * the choice precisely because the mapping did not exist:
 *
 * > *"A fixed deposit is a rate-for-tenure contract: this product has one rate
 * > and one tenure, so offering other tenures would quote a return the user
 * > cannot obtain."*
 *
 * This module is that mapping. It does not make the problem go away — it makes
 * it **answerable**, and answerable only where data exists.
 *
 * ## The rule that matters: no rate, no tenure
 *
 * `resolveRate` returns `null` for a tenure the product does not price. It does
 * **not** fall back to the headline rate, and that is the entire point.
 *
 * Falling back would be the defect wearing a helpful face: a 36-month selection
 * silently quoted at the 24-month rate looks like a working feature and is a
 * wrong number on the screen where the user commits money. Per the decision of
 * 2026-08-06 — **"Booking must not invent rates"** — an unpriced tenure is not
 * offered at all. `selectableTenures` is the list a UI may render, and it is
 * derived from the rate card rather than from `tenureRange`.
 *
 * ## Consequence, stated so it is not a surprise
 *
 * The approved screen draws seven tenure chips. The fixture prices **one**
 * tenure, because one is all the product actually publishes and inventing the
 * other six is forbidden. So the tenure control will render a single fixed
 * option until a real rate card arrives. That is a data gap, not a modelling
 * gap: `tenureRates` gains six rows and the screen matches the artwork with no
 * code change.
 *
 * Pure and React-free, like every rule under `utils/`.
 */

/**
 * The rate quote for a configuration, or `null` when the product does not price
 * it.
 *
 * An **exact** match, not a nearest or a bracketing one. Rate cards are
 * published as discrete terms — 12 months, 24 months, 36 months — and a deposit
 * held for 30 months is not "the 24-month product for longer", it is a term the
 * bank has not quoted. Interpolating between published rates would invent a
 * rate as surely as typing one in.
 *
 * ## Why criteria and a quote rather than a tenure and a number
 *
 * The behaviour is unchanged — `resolveRate(terms, { tenureMonths }).annualRate`
 * is exactly what `resolveTenureRate(terms, tenureMonths)` returned, and `null`
 * is still `null` on every path. What changes is the **shape of the question and
 * the answer**:
 *
 * - **Criteria** is where a second pricing dimension lands. Amount slabs already
 *   exist in the Marketplace catalogue; senior-citizen and payout-specific
 *   pricing are both foreseeable. Each becomes an optional field on
 *   `RateCriteria` — not a new function, not a changed signature, not a touched
 *   caller.
 * - **A quote** carries which band answered. A bare number cannot, and once a
 *   product prices by tenure *and* amount *and* investor type, "7.25%" alone is
 *   not something anyone can check.
 *
 * Nothing speculative is modelled: the quote holds only what the rate card
 * actually contains.
 */
export function resolveRate(terms: DepositTerms, criteria: RateCriteria): RateQuote | null {
  const { tenureMonths } = criteria;

  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) return null;

  const match = terms.tenureRates.find((rate) => rate.tenureMonths === tenureMonths);

  if (!match) return null;

  /*
    The quote carries the band it came from, not just the number it produced.
    Today that is only the tenure; when a product prices by amount or investor
    type as well, this is where "which band answered" is recorded — and the
    callers below already ignore fields they do not use, so adding one changes
    nothing here.
  */
  return { annualRate: match.annualRate, tenureMonths: match.tenureMonths };
}

/**
 * The tenures a UI may offer, ascending.
 *
 * Sorted here rather than trusting the fixture's order, so a rate card entered
 * in any order still renders as a rail the user can read. Sorting a copy — the
 * card belongs to the product and this function does not own it.
 */
export function selectableTenures(terms: DepositTerms): TenureRate[] {
  return [...terms.tenureRates].sort((a, b) => a.tenureMonths - b.tenureMonths);
}

/**
 * Whether `tenureMonths` is one the product actually prices.
 *
 * The predicate the validation schema and the tenure control both call, so
 * "supported tenure" has one definition (spec 21b §8, BR-INV rules on tenure).
 */
export function isSupportedTenure(terms: DepositTerms, tenureMonths: number): boolean {
  return resolveRate(terms, { tenureMonths }) !== null;
}

/**
 * The tenure to select when a booking has not chosen one.
 *
 * The shortest tenure the product prices, because `selectableTenures` is
 * ascending and the first entry is the least commitment the user could be
 * defaulted into. Choosing the *highest* rate instead would be the platform
 * quietly steering the deposit, which is a recommendation and not this screen's
 * job — the goal-led planner is where a suggestion belongs.
 *
 * Returns `null` for a product that prices nothing, which is a product that
 * cannot be booked. Callers must handle it rather than assume a default exists,
 * exactly as `defaultPayoutOption` requires.
 */
export function defaultTenure(terms: DepositTerms): number | null {
  return selectableTenures(terms)[0]?.tenureMonths ?? null;
}

/**
 * Structural problems with a product's rate card.
 *
 * Returns a list of messages rather than throwing. A throw would take down a
 * screen over a data problem the user cannot fix, and the eventual consumer of
 * this is an API ingestion adapter that needs to *report* a bad card and reject
 * it — not crash mid-import. Empty array means the card is sound.
 *
 * ## Why uniqueness is the headline rule
 *
 * `resolveTenureRate` uses `Array.find`, so two rows for 24 months resolve to
 * whichever appears first — a **wrong rate with no error anywhere**. That is the
 * worst failure mode available to this module: silent, plausible, and about
 * money. Ordering is not a tie-break the platform is entitled to invent, so a
 * duplicate is a data defect rather than something to resolve.
 *
 * The remaining checks catch the shapes that would otherwise reach
 * `resolveTenureRate` and be rejected one row at a time, invisibly, leaving a
 * product that simply offers fewer tenures than it should with no explanation.
 */
export function validateRateCard(terms: DepositTerms): string[] {
  const errors: string[] = [];
  const { tenureRates } = terms;

  if (tenureRates.length === 0) {
    errors.push('Rate card is empty: the product prices no tenure and cannot be booked.');
    return errors;
  }

  const seen = new Set<number>();
  const duplicates = new Set<number>();

  for (const rate of tenureRates) {
    if (!Number.isInteger(rate.tenureMonths) || rate.tenureMonths <= 0) {
      errors.push(
        `Rate card has an invalid tenure: ${String(rate.tenureMonths)} months. Tenures must be whole months greater than zero.`,
      );
    }

    if (!Number.isFinite(rate.annualRate) || rate.annualRate <= 0) {
      errors.push(
        `Rate card has an invalid rate for ${String(rate.tenureMonths)} months: ${String(rate.annualRate)}.`,
      );
    }

    if (seen.has(rate.tenureMonths)) duplicates.add(rate.tenureMonths);
    seen.add(rate.tenureMonths);
  }

  for (const tenureMonths of [...duplicates].sort((a, b) => a - b)) {
    errors.push(
      `Rate card has more than one rate for ${tenureMonths} months. Each tenure must appear once.`,
    );
  }

  return errors;
}
