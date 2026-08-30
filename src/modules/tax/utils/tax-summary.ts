import type { PortfolioHolding } from '@/types/portfolio';
import type { TaxYear, TaxYearSummary, TaxDepositContribution } from '@/types/tax';
import { maturityDate } from '@/utils/finance';
import { allocateInterestToPeriod, taxYearsSpanning } from '@/utils/tax';

/**
 * The tax year, seen across everything the investor holds.
 *
 * ## A projection, and nothing else
 *
 * Holdings come from the canonical portfolio store; each deposit's share of the
 * year comes from `allocateInterestToPeriod`, which divides what
 * `calculateDepositReturns` already produced. This file adds up what those
 * return and sorts them. There is no store, nothing persisted, and no second
 * figure for anything Portfolio already states.
 *
 * ## Deposits that cannot be allocated are kept, not dropped
 *
 * A deposit whose term the bank publishes in days has no maturity date and
 * therefore no allocable period. Removing it from the list would make the page
 * look complete while quietly omitting one of the investor's deposits; it is
 * listed with the reason instead, and excluded from the total.
 *
 * Pure and React-free; the caller supplies `now`.
 */

function toContribution(holding: PortfolioHolding, taxYear: TaxYear): TaxDepositContribution {
  return {
    reference: holding.reference,
    bank: holding.bank,
    productName: holding.productName,
    principal: holding.principal,
    annualRate: holding.annualRate,
    isCumulative: holding.isCumulative,
    allocation: allocateInterestToPeriod(holding, {
      start: taxYear.startDate,
      end: taxYear.endDate,
    }),
  };
}

/**
 * One tax year's summary.
 *
 * Contributions are ordered by what an investor scans for: the largest
 * allocation first, then the deposits that could not be allocated, so an
 * unresolvable deposit is visible without pushing the figures down the page.
 */
export function buildTaxYearSummary(
  holdings: readonly PortfolioHolding[],
  taxYear: TaxYear,
  now: number = Date.now(),
): TaxYearSummary {
  const contributions = holdings
    .map((holding) => toContribution(holding, taxYear))
    /* A deposit whose term never touches the year is not this year's business. */
    .filter((entry) => entry.allocation.status !== 'outside-period')
    .sort((a, b) => {
      const interestOf = (entry: TaxDepositContribution) =>
        entry.allocation.status === 'allocated' ? entry.allocation.interest : -1;

      return interestOf(b) - interestOf(a);
    });

  const allocated = contributions.filter((entry) => entry.allocation.status === 'allocated');

  return {
    taxYear,
    contributions,
    contributingDeposits: allocated.length,
    totalInterest: allocated.reduce(
      (sum, entry) =>
        sum + (entry.allocation.status === 'allocated' ? entry.allocation.interest : 0),
      0,
    ),
    unavailableCount: contributions.filter((entry) => entry.allocation.status === 'unavailable')
      .length,
    generatedAt: now,
  };
}

/**
 * The tax years worth offering, newest first.
 *
 * Derived from the deposits themselves — a ten-year deposit produces ten
 * selectable years — plus the current one, so a portfolio holding nothing still
 * opens on a real year rather than an empty selector.
 */
export function selectableTaxYears(
  holdings: readonly PortfolioHolding[],
  now: number = Date.now(),
): TaxYear[] {
  return taxYearsSpanning(
    holdings.map((holding) => ({
      start: holding.startedAt,
      end: maturityDate(holding.startedAt, holding.tenureMonths)?.getTime() ?? null,
    })),
    now,
  );
}
