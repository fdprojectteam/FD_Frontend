import type { TaxYear } from '@/types/tax';

/**
 * The Tax Year, expressed once.
 *
 * ## Why a model rather than a string
 *
 * "Tax Year 2026–27" appears in a selector, a heading, a summary line, a table
 * caption and a document title. Written as a literal in each, the five drift.
 * Written here, a year is **data** — and a future year is a computation rather
 * than a code change, which is what "must be able to represent future Tax
 * Years" actually requires.
 *
 * ## The convention
 *
 * A tax year runs from **1 April to 31 March**, and income arising in that
 * window belongs to it. `2026-27` therefore starts 1 April 2026 and ends the
 * instant 1 April 2027 begins.
 *
 * `endDate` is **exclusive**. Two consecutive years then tile the calendar with
 * no shared day — which is the property that stops an allocation counting 31
 * March twice, and the reason this is stated in the type rather than left to
 * each caller's `<=` or `<`.
 *
 * ## Local dates, deliberately
 *
 * Boundaries are built with the local-time constructor, matching
 * `maturityDate`, which adds calendar months in local time. Mixing a UTC
 * boundary with a local term end would shift an allocation by a few hours at
 * exactly the moment precision matters.
 *
 * Pure and React-free.
 */

/** The month index of April. Named, because `3` in a date constructor is not. */
const APRIL = 3;

/** The tax year that begins in `startYear`. */
export function taxYearStarting(startYear: number): TaxYear {
  const nextYear = startYear + 1;
  const shortLabel = `${String(startYear)}–${String(nextYear).slice(-2)}`;

  return {
    id: `${String(startYear)}-${String(nextYear).slice(-2)}`,
    label: `Tax Year ${shortLabel}`,
    shortLabel,
    startDate: new Date(startYear, APRIL, 1, 0, 0, 0, 0),
    endDate: new Date(nextYear, APRIL, 1, 0, 0, 0, 0),
  };
}

/**
 * The tax year a moment falls in.
 *
 * January to March belong to the year that began the previous April — the one
 * off-by-one this whole file exists to get right in a single place.
 */
export function taxYearFor(at: number | Date): TaxYear {
  const date = at instanceof Date ? at : new Date(at);
  const startYear = date.getMonth() >= APRIL ? date.getFullYear() : date.getFullYear() - 1;

  return taxYearStarting(startYear);
}

/** `2026-27` back to a year, or `null` when the id names none. */
export function parseTaxYearId(id: string): TaxYear | null {
  const match = /^(\d{4})-(\d{2})$/.exec(id.trim());
  if (match === null) return null;

  const startYear = Number(match[1]);
  if (!Number.isInteger(startYear)) return null;

  /* The second half must be the year after the first: `2026-28` names nothing. */
  const expected = String(startYear + 1).slice(-2);
  if (match[2] !== expected) return null;

  return taxYearStarting(startYear);
}

/**
 * The tax years a set of deposit terms touches, newest first.
 *
 * Derived from the deposits rather than from a fixed list, so a ten-year
 * deposit produces ten selectable years and a portfolio with nothing in it
 * still offers the current one. `null` term ends — a deposit with no maturity
 * date — contribute their start year only, because that is all the platform
 * knows.
 */
export function taxYearsSpanning(
  terms: readonly { start: number; end: number | null }[],
  now: number = Date.now(),
): TaxYear[] {
  const years = new Set<number>([taxYearFor(now).startDate.getFullYear()]);

  for (const term of terms) {
    const first = taxYearFor(term.start).startDate.getFullYear();
    const last = term.end === null ? first : taxYearFor(term.end).startDate.getFullYear();

    for (let year = first; year <= last; year += 1) years.add(year);
  }

  return [...years].sort((a, b) => b - a).map(taxYearStarting);
}
