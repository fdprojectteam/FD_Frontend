/**
 * Portfolio derivations, promoted to the platform tier (Module 12).
 *
 * ## Why they moved
 *
 * `summarisePortfolio` and `buildMaturitySchedule` were owned by the portfolio
 * module while the portfolio was their only consumer. The Family Dashboard is a
 * second one, and a module may not import a sibling — so the choice was between
 * promoting the derivation or copying it. **Two answers to "what is this
 * deposit worth at maturity" is one too many**, which is the same reasoning
 * that promoted `calculateDepositReturns` and `maturityDate` before them.
 *
 * Nothing about the calculations changed. They are still pure, still take
 * `now` from the caller, and the portfolio screens still read the same
 * functions — through this path rather than a relative one.
 */
export {
  MATURING_SOON_MONTHS,
  portfolioAttention,
  summarisePortfolio,
  toHoldingView,
  type BankAllocation,
  type HoldingView,
  type MaturityBucket,
  type PortfolioAttention,
  type PortfolioSummary,
} from './portfolio-summary';
export {
  MATURITY_INSTRUCTION_LABEL,
  buildMaturitySchedule,
  toMaturityEntry,
  type MaturityEntry,
  type MaturitySchedule,
  type MaturityStage,
} from './maturity-schedule';
