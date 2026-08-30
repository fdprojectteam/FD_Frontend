export { resolveApplicableRate, resolveProductRate } from './rates';
export {
  days,
  formatTenureExact,
  isMonthExpressible,
  isSameTenure,
  months,
  publishedTenure,
  toWholeMonths,
  years,
} from './tenure';
export {
  calculateDepositReturns,
  type DepositReturns,
  type DepositReturnsInput,
} from './deposit-returns';
export { formatMaturityDate, maturityDate, monthsUntil } from './maturity-date';
export { MATURING_SOON_MONTHS, MATURITY_DUE_DAYS } from './notice-window';
