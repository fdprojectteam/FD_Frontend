import type { Tenure } from '@/types/finance';

/**
 * Tenure arithmetic — exact conversions only.
 *
 * ## The rule this file exists to enforce
 *
 * The client source document prices a **91-day** deposit alongside 3-year and
 * 10-year ones. 91 days is not a whole number of months, and the platform must
 * not decide that it is. So there is exactly one bridge between units, it is
 * total only where the conversion is lossless, and it returns `null` everywhere
 * else rather than rounding.
 *
 * A `null` is not a failure. It is the correct answer to *"how many whole months
 * is 91 days?"* — and it is what stops a day-based term entering the month-based
 * engine as an approximation nobody sanctioned.
 *
 * ## Why there is no `toDays`
 *
 * Because it would need a month-length convention — 30, 30.4375, or actual
 * calendar months — and none of the three is in any approved document. A
 * convention invented here would silently price deposits. When ordering across
 * mixed units is genuinely needed, the rule that decides it has to come from the
 * client first.
 */

const MONTHS_PER_YEAR = 12;

/**
 * Whole months, or `null` when the term cannot be expressed in whole months.
 *
 * - `months` → itself.
 * - `years` → `× 12`, exact by definition.
 * - `days` → **always `null`**. There is no exact day-to-month conversion, and
 *   an inexact one is the error this module prevents.
 */
export function toWholeMonths(tenure: Tenure): number | null {
  switch (tenure.unit) {
    case 'months':
      return Number.isInteger(tenure.value) && tenure.value > 0 ? tenure.value : null;
    case 'years': {
      const months = tenure.value * MONTHS_PER_YEAR;
      return Number.isInteger(months) && months > 0 ? months : null;
    }
    case 'days':
      return null;
  }
}

/** A term the month-based engine can evaluate today. */
export function isMonthExpressible(tenure: Tenure): boolean {
  return toWholeMonths(tenure) !== null;
}

/**
 * A deposit's published term, tolerating payloads that predate the field.
 *
 * `FixedDepositTerms.tenure` is required and the mapper always fills it, so real
 * catalogue data always carries it. This exists for the older shape — fixtures
 * and any stored payload written before the field was added — where a term in
 * whole months is exactly what `tenureMonths` already says. It is a fallback for
 * a *missing field*, never a conversion: a day-based term cannot reach this path,
 * because a payload without `tenure` has no way to express one.
 */
export function publishedTenure(terms: { tenure?: Tenure; tenureMonths: number }): Tenure {
  return terms.tenure ?? { value: terms.tenureMonths, unit: 'months' };
}

/** Convenience constructor, so call sites read as terms rather than tuples. */
export function months(value: number): Tenure {
  return { value, unit: 'months' };
}

export function years(value: number): Tenure {
  return { value, unit: 'years' };
}

export function days(value: number): Tenure {
  return { value, unit: 'days' };
}

/**
 * Whether two terms are the same term.
 *
 * Same unit and value, or an exact month-equivalence — so `36 months` equals
 * `3 years`, and `91 days` equals nothing but itself.
 */
export function isSameTenure(a: Tenure, b: Tenure): boolean {
  if (a.unit === b.unit) return a.value === b.value;

  const aMonths = toWholeMonths(a);
  const bMonths = toWholeMonths(b);

  return aMonths !== null && bMonths !== null && aMonths === bMonths;
}

/**
 * The term as the customer stated it — never normalised.
 *
 * `91 days` prints as "91 days", not "3 months"; `10 years` prints as
 * "10 years", not "120 months". The unit the term was published in is part of
 * what was published.
 */
export function formatTenureExact(tenure: Tenure): string {
  const plural = tenure.value === 1 ? '' : 's';

  switch (tenure.unit) {
    case 'days':
      return `${String(tenure.value)} day${plural}`;
    case 'months':
      return `${String(tenure.value)} month${plural}`;
    case 'years':
      return `${String(tenure.value)} year${plural}`;
  }
}
