import type { MaturityInstruction } from '@/types/portfolio';

/*
  The notice window comes from the portfolio's own constant, imported rather
  than restated — so the dashboard's attention area and this screen can never
  disagree about what "soon" means.
*/
import { MATURING_SOON_MONTHS, type HoldingView, type PortfolioSummary } from './portfolio-summary';

export { MATURING_SOON_MONTHS };

/**
 * What is coming, and what decision it needs.
 *
 * ## Why this sits beside the portfolio summary rather than in its own module
 *
 * A maturity is not a second kind of thing — it is a **question asked of the
 * same holdings**. Portfolio answers "what do I own"; this answers "what
 * happens next". Splitting them into two modules would mean either duplicating
 * `HoldingView` or promoting it, and neither buys anything: they share a data
 * source, a calculator and a lifetime. Two files in one domain is the smaller
 * clean boundary.
 *
 * ## Status is derived, never asserted
 *
 * A holding's stored `status` is what the platform was told — and it is only
 * ever `active`, because there is no settlement integration to tell it
 * otherwise. What this derives is a *schedule* position from the maturity date:
 * whether the term has run out, is about to, or is still running.
 *
 * That distinction matters. Saying a deposit has "matured" because its date has
 * passed is a statement about the calendar, which is true. Saying the proceeds
 * were credited would be a statement about the bank, which nothing here knows —
 * and the screens are careful not to make it.
 *
 * Pure and React-free; the caller supplies `now`.
 */

/** Where a deposit sits in its own schedule. Derived from the date, every read. */
export type MaturityStage =
  /** Running, with more than the notice window left. */
  | 'scheduled'
  /** Inside the notice window — the decision is now. */
  | 'maturing-soon'
  /** The maturity date has passed. Says nothing about settlement. */
  | 'matured'
  /** The bank publishes the term in days, so there is no month-based date. */
  | 'undated';

/** Customer-facing wording for each instruction. One home, no retyping. */
export const MATURITY_INSTRUCTION_LABEL: Record<MaturityInstruction, string> = {
  'renew-principal-and-interest': 'Renew principal and interest',
  'renew-principal-only': 'Renew principal, pay out interest',
  'pay-out': 'Pay out principal and interest',
};

export interface MaturityEntry {
  view: HoldingView;
  stage: MaturityStage;
  /** Whole days until maturity; negative once passed. `null` when undated. */
  daysRemaining: number | null;
  instruction: MaturityInstruction | null;
  /** One sentence saying what is scheduled to happen. Never a promise. */
  outlook: string;
}

export interface MaturitySchedule {
  /** Everything still to come, soonest first. */
  upcoming: readonly MaturityEntry[];
  /** Inside the notice window. A subset of `upcoming`, kept for prominence. */
  maturingSoon: readonly MaturityEntry[];
  /** Dates that have passed, most recent first. */
  matured: readonly MaturityEntry[];
  /** Deposits with no month-based maturity date. Listed, never guessed at. */
  undated: readonly MaturityEntry[];
  /** The soonest maturity, or `null` when nothing is scheduled. */
  next: MaturityEntry | null;
  /** Maturities falling in the same calendar year as `now`. */
  maturingThisYear: number;
  /** What every scheduled maturity is expected to pay, in total. */
  totalUpcomingValue: number;
  /** Scheduled maturities grouped by calendar year, ascending. */
  byYear: readonly { year: number; entries: readonly MaturityEntry[] }[];
  generatedAt: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * What is scheduled to happen, in one sentence.
 *
 * Deliberately short, and deliberately conditional. The platform has no
 * settlement integration, so it can say what the instruction *is* and that the
 * bank confirms the handling — never that the bank will do it.
 */
function outlookFor(instruction: MaturityInstruction | null, stage: MaturityStage): string {
  if (stage === 'undated') {
    return 'This deposit’s term is published in days, so no maturity date is available yet.';
  }

  if (instruction === null) {
    return 'No maturity instruction is recorded for this deposit. Final handling will be confirmed by the bank.';
  }

  const action = MATURITY_INSTRUCTION_LABEL[instruction].toLowerCase();

  return stage === 'matured'
    ? `The instruction on this deposit was to ${action}. Final handling is confirmed by the bank.`
    : `The instruction on this deposit is to ${action}. Final handling will be confirmed by the bank.`;
}

export function toMaturityEntry(view: HoldingView, now: number): MaturityEntry {
  const stage: MaturityStage =
    view.maturesOn === null
      ? 'undated'
      : view.maturesOn.getTime() <= now
        ? 'matured'
        : view.monthsRemaining !== null && view.monthsRemaining <= MATURING_SOON_MONTHS
          ? 'maturing-soon'
          : 'scheduled';

  return {
    view,
    stage,
    daysRemaining:
      view.maturesOn === null ? null : Math.ceil((view.maturesOn.getTime() - now) / MS_PER_DAY),
    instruction: view.holding.maturityInstruction,
    outlook: outlookFor(view.holding.maturityInstruction, stage),
  };
}

export function buildMaturitySchedule(
  summary: PortfolioSummary,
  now: number = Date.now(),
): MaturitySchedule {
  /* Only deposits the investor still holds have a maturity to manage. */
  const entries = summary.holdings
    .filter((view) => view.holding.status === 'active')
    .map((view) => toMaturityEntry(view, now));

  const byDate = (a: MaturityEntry, b: MaturityEntry) =>
    (a.view.maturesOn?.getTime() ?? 0) - (b.view.maturesOn?.getTime() ?? 0);

  const upcoming = entries
    .filter((entry) => entry.stage === 'scheduled' || entry.stage === 'maturing-soon')
    .sort(byDate);

  const matured = entries.filter((entry) => entry.stage === 'matured').sort((a, b) => byDate(b, a));

  const thisYear = new Date(now).getFullYear();

  const yearMap = new Map<number, MaturityEntry[]>();
  for (const entry of upcoming) {
    const year = entry.view.maturesOn?.getFullYear();
    if (year === undefined) continue;

    yearMap.set(year, [...(yearMap.get(year) ?? []), entry]);
  }

  return {
    upcoming,
    maturingSoon: upcoming.filter((entry) => entry.stage === 'maturing-soon'),
    matured,
    undated: entries.filter((entry) => entry.stage === 'undated'),
    next: upcoming[0] ?? null,
    maturingThisYear: upcoming.filter((entry) => entry.view.maturesOn?.getFullYear() === thisYear)
      .length,
    totalUpcomingValue: upcoming.reduce((sum, entry) => sum + entry.view.maturityValue, 0),
    byYear: [...yearMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, yearEntries]) => ({ year, entries: yearEntries })),
    generatedAt: now,
  };
}
