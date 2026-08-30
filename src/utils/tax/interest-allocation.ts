import type { PortfolioHolding } from '@/types/portfolio';
import type { TaxAllocation } from '@/types/tax';
import { calculateDepositReturns, maturityDate } from '@/utils/finance';

/**
 * Which part of a deposit's interest belongs to a period.
 *
 * ## This is an allocator, not an interest engine
 *
 * It computes **no interest**. The total comes from `calculateDepositReturns`
 * — the platform's single FD rule, which already decides between quarterly
 * compounding and simple interest from `isCumulative` — and this file does one
 * thing with it: divides it across the term by day count.
 *
 * ```
 * calculateDepositReturns → totalInterest → × overlapDays / termDays
 * ```
 *
 * If that total ever changes, every figure here changes with it. That is the
 * point: a Tax Center with its own formula would agree with Portfolio until
 * somebody edited one of them.
 *
 * ## Straight-line, and openly so
 *
 * Interest is attributed evenly across the days of the term. It is an
 * **approximation**: a cumulative deposit compounds, so true accrual is slower
 * early and faster late, and this under-states the first years and over-states
 * the last. No partner-bank day-count or accrual basis exists anywhere in this
 * repository, so the honest options were an approximation stated as one, or no
 * figure at all. Every screen that shows these numbers says "straight-line
 * approximation, platform-derived".
 *
 * The same basis is used for payout deposits, because the platform does not
 * know when a bank actually credits an instalment. Stated on screen rather than
 * implied.
 *
 * ## Why the rounding telescopes
 *
 * Each period is derived as *(interest up to the end) − (interest up to the
 * start)*, each rounded once. Rounding the slice itself would let a deposit's
 * years sum to a rupee more or less than the deposit earns; done this way,
 * consecutive periods always sum **exactly** to `totalInterest`. A tax figure
 * that does not add up is a tax figure nobody trusts.
 *
 * ## Fail closed
 *
 * No maturity date, a non-positive term, a non-positive rate or an unusable
 * start produces `unavailable` with the reason, never a guess and never a zero
 * dressed as a measurement.
 *
 * Pure and React-free.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between two instants, never negative. */
function daysBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.round((toMs - fromMs) / DAY_MS));
}

/**
 * Interest accrued from the start of the term to a moment, straight-line.
 *
 * The cumulative form the telescoping subtraction is built from.
 */
function accruedTo(totalInterest: number, termDays: number, elapsedDays: number): number {
  const clamped = Math.min(Math.max(elapsedDays, 0), termDays);
  return Math.round((totalInterest * clamped) / termDays);
}

export interface AllocationPeriod {
  /** Inclusive start. */
  start: Date;
  /** **Exclusive** end — 1 April of the following year for a tax year. */
  end: Date;
}

/**
 * The interest attributable to `period` for one deposit.
 *
 * The deposit's own term is `[startedAt, maturityDate)` — also half-open, so a
 * term ending exactly as a period begins contributes nothing to that period
 * rather than a final day to both.
 */
export function allocateInterestToPeriod(
  holding: PortfolioHolding,
  period: AllocationPeriod,
): TaxAllocation {
  const maturesOn = maturityDate(holding.startedAt, holding.tenureMonths);

  if (maturesOn === null) {
    return {
      status: 'unavailable',
      reason:
        'The bank publishes this deposit’s term in days, so the platform holds no maturity date to allocate interest against.',
    };
  }

  if (!Number.isFinite(holding.startedAt)) {
    return {
      status: 'unavailable',
      reason: 'This deposit has no usable start date, so its interest cannot be allocated.',
    };
  }

  if (holding.annualRate <= 0 || holding.principal <= 0) {
    return {
      status: 'unavailable',
      reason:
        'This deposit has no recorded rate or amount, so there is no interest to attribute to a tax year.',
    };
  }

  const termStart = holding.startedAt;
  const termEnd = maturesOn.getTime();
  const termDays = daysBetween(termStart, termEnd);

  if (termDays <= 0) {
    return {
      status: 'unavailable',
      reason: 'This deposit’s recorded term is too short to allocate interest across.',
    };
  }

  const overlapStart = Math.max(termStart, period.start.getTime());
  const overlapEnd = Math.min(termEnd, period.end.getTime());

  if (overlapEnd <= overlapStart) return { status: 'outside-period' };

  const { totalInterest } = calculateDepositReturns({
    principal: holding.principal,
    annualRate: holding.annualRate,
    tenureMonths: holding.tenureMonths,
    isCumulative: holding.isCumulative,
  });

  const before = accruedTo(totalInterest, termDays, daysBetween(termStart, overlapStart));
  const through = accruedTo(totalInterest, termDays, daysBetween(termStart, overlapEnd));

  return {
    status: 'allocated',
    interest: through - before,
    periodStart: new Date(overlapStart),
    /*
      Shown as the last day *inside* the period rather than the exclusive
      boundary: "1 Apr 2026 – 31 Mar 2027" is what a customer expects to read,
      and "– 1 Apr 2027" would look like a day that belongs to both years.
    */
    periodEnd: new Date(overlapEnd - DAY_MS),
    overlapDays: daysBetween(overlapStart, overlapEnd),
    termDays,
  };
}

/**
 * The interest a deposit earns over its whole term.
 *
 * A thin, named re-export of the canonical rule so callers that need the total
 * beside an allocation do not reach past this module for it — and so the unit
 * suite can assert that a deposit's tax-year allocations sum to exactly this.
 */
export function totalInterestForHolding(holding: PortfolioHolding): number {
  return calculateDepositReturns({
    principal: holding.principal,
    annualRate: holding.annualRate,
    tenureMonths: holding.tenureMonths,
    isCumulative: holding.isCumulative,
  }).totalInterest;
}
