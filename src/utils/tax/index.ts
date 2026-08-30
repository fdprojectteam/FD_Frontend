/**
 * Tax vocabulary and allocation, at the platform tier.
 *
 * Platform-level because it is a projection over `PortfolioHolding` — the same
 * reasoning that put the portfolio derivations here. It computes no interest of
 * its own: `allocateInterestToPeriod` divides what `calculateDepositReturns`
 * already returned.
 */
export {
  allocateInterestToPeriod,
  totalInterestForHolding,
  type AllocationPeriod,
} from './interest-allocation';
export { parseTaxYearId, taxYearFor, taxYearStarting, taxYearsSpanning } from './tax-year';
