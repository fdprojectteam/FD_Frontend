import type { PortfolioHolding } from '@/types/portfolio';
import {
  MATURING_SOON_MONTHS,
  calculateDepositReturns,
  maturityDate,
  monthsUntil,
} from '@/utils/finance';

/**
 * What the investor's holdings add up to.
 *
 * ## Everything here is derived, nothing is stored
 *
 * A holding records the **terms of the contract** — principal, rate, tenure,
 * whether interest compounds, when it started. Every figure on the dashboard is
 * computed from those, through the platform's own calculators, on every read.
 *
 * That is the rule Document 09 §10 states for the booking draft, applied to the
 * record that outlives it: a stored maturity amount is a figure that can drift
 * from the contract it claims to describe, and a portfolio is precisely where
 * nobody would notice.
 *
 * ## No invented metric
 *
 * A fixed deposit has no market price, so there is no "current market value"
 * here and no gain/loss against one. What an FD portfolio can honestly state is
 * what was put in, what it will pay, and when — and that is what this produces.
 *
 * `currentValue` is **not** a valuation: it is principal plus the interest
 * accrued so far on a straight-line basis, and it is named and labelled as
 * contracted rather than market value.
 *
 * Pure and React-free; the caller supplies `now`, so every figure is assertable
 * without a clock.
 */

/** One holding with the figures the dashboard needs. */
export interface HoldingView {
  holding: PortfolioHolding;
  /** `null` for a term the bank publishes in days — never an approximated date. */
  maturesOn: Date | null;
  /** Whole months remaining, or `null` when there is no maturity date. */
  monthsRemaining: number | null;
  totalInterest: number;
  maturityValue: number;
  /** Principal plus straight-line interest accrued to `now`. Never a market price. */
  accruedValue: number;
  /**
   * How far through its term the deposit is, 0–100.
   *
   * Derived here so the card draws a proportion rather than computing one — and
   * so the rail, the months remaining and the accrued figure all come from the
   * same elapsed count.
   */
  progressPercent: number;
}

export interface BankAllocation {
  bankId: string;
  bankName: string;
  principal: number;
  /** Share of total principal, 0–100, rounded to whole percent. */
  sharePercent: number;
  holdings: number;
}

/**
 * A band of deposit terms, for the maturity-mix insight.
 *
 * Bucketed by the **term of the deposit**, not by time remaining: the question
 * this answers is "how is my money spread across short and long commitments",
 * which is a property of what was bought, and it does not change as the clock
 * runs.
 */
export interface MaturityBucket {
  id: string;
  label: string;
  principal: number;
  sharePercent: number;
  holdings: number;
}

export interface PortfolioSummary {
  holdings: readonly HoldingView[];
  activeCount: number;
  totalPrincipal: number;
  /** Principal plus interest accrued so far. Contracted, not market. */
  currentValue: number;
  totalMaturityValue: number;
  totalInterest: number;
  /** Sorted by maturity date, soonest first. Excludes undated holdings. */
  upcomingMaturities: readonly HoldingView[];
  byBank: readonly BankAllocation[];
  /** Only bands that contain something — an empty band is not information. */
  byMaturity: readonly MaturityBucket[];
  /** When these figures were derived, so the screen can say so honestly. */
  generatedAt: number;
}

/**
 * The bands, longest last.
 *
 * Chosen to match how fixed deposits are actually sold in India — under a year,
 * the common one-to-three window, and then the long commitments — rather than
 * an even split that would put nothing in most of them.
 */
interface MaturityBand {
  id: string;
  label: string;
  maxMonths: number;
}

/* The last band is open-ended, so a term always lands somewhere. */
const LONGEST_BAND: MaturityBand = {
  id: '10y-plus',
  label: '10+ years',
  maxMonths: Number.POSITIVE_INFINITY,
};

const MATURITY_BANDS: readonly MaturityBand[] = [
  { id: 'under-1y', label: 'Under 1 year', maxMonths: 12 },
  { id: '1-3y', label: '1–3 years', maxMonths: 36 },
  { id: '3-5y', label: '3–5 years', maxMonths: 60 },
  { id: '5-10y', label: '5–10 years', maxMonths: 120 },
  LONGEST_BAND,
];

function bandFor(tenureMonths: number): MaturityBand {
  return MATURITY_BANDS.find((band) => tenureMonths <= band.maxMonths) ?? LONGEST_BAND;
}

/** How long a deposit has been running, capped at its own term. */
function elapsedMonths(holding: PortfolioHolding, now: number): number {
  const months =
    (new Date(now).getFullYear() - new Date(holding.startedAt).getFullYear()) * 12 +
    (new Date(now).getMonth() - new Date(holding.startedAt).getMonth());

  return Math.min(Math.max(months, 0), holding.tenureMonths);
}

export function toHoldingView(holding: PortfolioHolding, now: number): HoldingView {
  const { totalInterest, maturityValue } = calculateDepositReturns({
    principal: holding.principal,
    annualRate: holding.annualRate,
    tenureMonths: holding.tenureMonths,
    isCumulative: holding.isCumulative,
  });

  const maturesOn = maturityDate(holding.startedAt, holding.tenureMonths);

  /*
    Straight-line accrual, and deliberately simple. A precise day-count basis
    is a partner-bank convention no document in this repository states, so the
    honest options were "state nothing" or "state a plainly-labelled
    approximation". A share of the term elapsed is the latter, and the screen
    calls it contracted value rather than a valuation.
  */
  const accrued =
    holding.tenureMonths === 0
      ? 0
      : Math.round((totalInterest * elapsedMonths(holding, now)) / holding.tenureMonths);

  const elapsed = elapsedMonths(holding, now);

  return {
    holding,
    progressPercent:
      holding.tenureMonths === 0 ? 0 : Math.round((elapsed * 100) / holding.tenureMonths),
    maturesOn,
    monthsRemaining: maturesOn === null ? null : monthsUntil(maturesOn, now),
    totalInterest,
    maturityValue,
    accruedValue: holding.principal + (holding.isCumulative ? accrued : 0),
  };
}

export function summarisePortfolio(
  holdings: readonly PortfolioHolding[],
  now: number = Date.now(),
): PortfolioSummary {
  const views = holdings.map((holding) => toHoldingView(holding, now));
  const active = views.filter((view) => view.holding.status === 'active');

  const totalPrincipal = active.reduce((sum, view) => sum + view.holding.principal, 0);

  const byBankMap = new Map<string, BankAllocation>();
  for (const view of active) {
    const { bank, principal } = view.holding;
    const entry = byBankMap.get(bank.id);

    byBankMap.set(bank.id, {
      bankId: bank.id,
      bankName: bank.name,
      principal: (entry?.principal ?? 0) + principal,
      sharePercent: 0,
      holdings: (entry?.holdings ?? 0) + 1,
    });
  }

  const byBank = [...byBankMap.values()]
    .map((entry) => ({
      ...entry,
      sharePercent: totalPrincipal === 0 ? 0 : Math.round((entry.principal / totalPrincipal) * 100),
    }))
    .sort((a, b) => b.principal - a.principal);

  const byMaturityMap = new Map<string, MaturityBucket>();
  for (const view of active) {
    const band = bandFor(view.holding.tenureMonths);
    const entry = byMaturityMap.get(band.id);

    byMaturityMap.set(band.id, {
      id: band.id,
      label: band.label,
      principal: (entry?.principal ?? 0) + view.holding.principal,
      sharePercent: 0,
      holdings: (entry?.holdings ?? 0) + 1,
    });
  }

  /* Band order, not size order — a spread reads as a spectrum, shortest first. */
  const byMaturity = MATURITY_BANDS.flatMap((band) => {
    const entry = byMaturityMap.get(band.id);
    if (!entry) return [];

    return [
      {
        ...entry,
        sharePercent:
          totalPrincipal === 0 ? 0 : Math.round((entry.principal / totalPrincipal) * 100),
      },
    ];
  });

  return {
    holdings: views,
    activeCount: active.length,
    byMaturity,
    generatedAt: now,
    totalPrincipal,
    currentValue: active.reduce((sum, view) => sum + view.accruedValue, 0),
    totalMaturityValue: active.reduce((sum, view) => sum + view.maturityValue, 0),
    totalInterest: active.reduce((sum, view) => sum + view.totalInterest, 0),
    upcomingMaturities: active
      .filter((view) => view.maturesOn !== null)
      .sort((a, b) => (a.maturesOn?.getTime() ?? 0) - (b.maturesOn?.getTime() ?? 0)),
    byBank,
  };
}

/** Something the investor may need to act on. Only real actions belong here. */
export interface PortfolioAttention {
  id: string;
  title: string;
  detail: string;
}

/**
 * What needs attention — and nothing that does not.
 *
 * A dashboard that manufactures alerts teaches the investor to ignore them. The
 * only item this build can honestly raise is a deposit approaching maturity,
 * because that is the one thing the data actually knows and the one that has a
 * deadline.
 */
/*
  The notice window is platform-level: the notification layer raises a maturity
  on the same threshold these screens use, and three copies of `3` is how one
  surface starts warning a month before another.
*/
export { MATURING_SOON_MONTHS };

export function portfolioAttention(summary: PortfolioSummary): PortfolioAttention[] {
  return summary.upcomingMaturities
    .filter((view) => view.monthsRemaining !== null && view.monthsRemaining <= MATURING_SOON_MONTHS)
    .map((view) => ({
      id: `maturing-${view.holding.reference}`,
      title: `${view.holding.bank.name} deposit maturing soon`,
      detail:
        view.monthsRemaining === 0
          ? 'This deposit matures within the month. Decide whether to renew or withdraw.'
          : `Matures in ${String(view.monthsRemaining)} ${view.monthsRemaining === 1 ? 'month' : 'months'}. Decide whether to renew or withdraw.`,
    }));
}
