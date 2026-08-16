/**
 * When a deposit matures.
 *
 * The approved Review, Processing and Success screens all state a maturity
 * date, and it is the one figure on them that is neither in the catalogue nor
 * computed by `calculateReturns` — so it is derived here, once, rather than
 * three times in three components.
 *
 * ## Whole months, added as calendar months
 *
 * A 24-month deposit opened on 12 May matures on 12 May two years later, not
 * 730 days later. `setMonth` handles that, including the end-of-month case: a
 * deposit opened on 31 January with a one-month term lands on 3 March in a
 * 28-day February, because JavaScript rolls the overflow forward. That is a
 * real ambiguity in date arithmetic and **no source in this repository states
 * which convention the partner banks use**, so the platform's behaviour is left
 * as the language's and recorded here rather than silently "corrected" to a
 * rule nobody specified.
 *
 * ## Day-based terms are not handled
 *
 * `tenureMonths` is `0` for a deposit priced in days — the 91-day product — and
 * this returns `null` for it rather than treating zero as "matures today". The
 * screens show nothing instead of a wrong date, which is the same posture
 * `toWholeMonths` already takes: never approximate a published term.
 *
 * Pure and React-free. The caller supplies the start date, so the result is
 * assertable without a clock.
 */
export function maturityDate(startedAt: number, tenureMonths: number): Date | null {
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) return null;

  const date = new Date(startedAt);
  date.setMonth(date.getMonth() + tenureMonths);
  return date;
}

/** "12 May 2027" — the artwork's format, in the platform's locale. */
export function formatMaturityDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
