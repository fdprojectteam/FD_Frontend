/**
 * When a deposit matures.
 *
 * ## Why it is platform-level
 *
 * Booking states a maturity date on Review, Processing and Success; Portfolio
 * states it for every deposit an investor holds, and orders their maturity
 * timeline by it. Neither module may import the other, so the calculation
 * belongs to the platform — otherwise Portfolio would carry a second copy, and
 * two answers to "when does this mature" is one too many.
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

/** "12 May 2027" — the platform's date format, in the platform's locale. */
export function formatMaturityDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Whole months from `from` until `to`, or `0` once the date has passed.
 *
 * Used to say "matures in 18 months". Whole months only: "in 17.6 months" is
 * not how anyone thinks about a deposit, and rounding up would overstate the
 * wait on the day before maturity.
 */
export function monthsUntil(to: Date, from: number = Date.now()): number {
  const start = new Date(from);
  const months = (to.getFullYear() - start.getFullYear()) * 12 + (to.getMonth() - start.getMonth());
  const adjusted = to.getDate() < start.getDate() ? months - 1 : months;

  return Math.max(adjusted, 0);
}
