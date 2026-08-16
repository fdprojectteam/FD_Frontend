/**
 * Unit entry — re-exports the pure modules under test so the suite runs the
 * shipped source, never a copy of it.
 */
import type { ProductDetails, ProductSummary } from '@/modules/marketplace/types';

export {
  RATE_BANDS,
  SORT_OPTIONS,
  TENURE_OPTIONS,
  DEFAULT_SORT,
} from '@/modules/marketplace/constants/filters';
export {
  describeActiveFilters,
  facetLabel,
  facetValueLabel,
  facetValueLongLabel,
} from '@/modules/marketplace/utils/filter-labels';
export { awaitRequestGate, hasRequestGate, setRequestGate } from '@/services/api/request-gate';
/**
 * Error classification (2026-08-02). Pure functions over a thrown value, and
 * until now untested — which is how "any HTTP 404 means the product does not
 * exist" survived into a screen that navigates on it.
 */
export {
  ApiError,
  isApiError,
  isClientError,
  isNotFoundError,
  normalizeError,
} from '@/services/api/api-error';
export { parseCalculatorAmount } from '@/modules/marketplace/utils/calculator-input';
export { addLabel, removeLabel, selectLabel } from '@/modules/marketplace/utils/compare-labels';
export {
  buildCompareRows,
  isBestCell,
  STACKED_COMPARE_ROWS,
} from '@/modules/marketplace/utils/compare-rows';
export {
  IDS_PARAM,
  mergeCompareParams,
  parseCompareIds,
  serialiseCompareIds,
} from '@/modules/marketplace/utils/compare-url';
export { toProductListParams } from '@/modules/marketplace/utils/list-params';
export { calculateMaturity } from '@/modules/marketplace/utils/maturity';
/**
 * Canonical since R1 step 2. Imported from the platform layer rather than from
 * Marketplace's re-export, so the suite asserts the implementation that actually
 * runs — the same six figures, the same resolver, one address.
 */
export { resolveApplicableRate, resolveProductRate } from '@/utils/finance';
export { defaultDepositAmount } from '@/modules/marketplace/hooks/use-comparison-preferences';
export { selectProductPreview } from '@/modules/marketplace/utils/product-preview';
export {
  mergeMarketplaceParams,
  parseMarketplaceUrlValues,
} from '@/modules/marketplace/utils/url-values';

/* ---- Booking (T3.2) ---- */
export { BOOKING_STEPS } from '@/modules/booking/constants/steps';
export { BOOKING_PHASES, resolveBookingPhase } from '@/modules/booking/constants/phases';
/**
 * Draft persistence. Exported so the *rules* — versioning, expiry, failing
 * closed on a malformed payload — are asserted directly rather than inferred
 * from a screen. These are the rules that decide whether a user's progress
 * survives, so they are the ones worth testing without a DOM in the way.
 */
export {
  DRAFT_MAX_AGE_MS,
  clearDraft,
  draftStorageKey,
  readDraft,
  writeDraft,
} from '@/modules/booking/utils/draft-storage';

/**
 * The Booking domain layer (T3.2.4–T3.2.6).
 *
 * Exported before any UI exists, deliberately: these six modules decide what a
 * deposit is worth and whether a configuration may be booked. Every one of them
 * is pure, so every one is assertable without a DOM — and a wrong number here
 * is wrong on every screen that displays it.
 */
export {
  calculateInterestEarned,
  calculateMaturity as calculatePlatformMaturity,
  calculateSimpleInterest,
} from '@/utils/maturity';
export {
  defaultTenure,
  isSupportedTenure,
  resolveRate,
  selectableTenures,
  validateRateCard,
} from '@/modules/booking/utils/tenure-rates';
export { calculateReturns, isCumulativePayout } from '@/modules/booking/utils/returns';
export {
  validateAmount,
  validateInvestmentConfiguration,
  validatePayoutOption,
  validateTenure,
} from '@/modules/booking/utils/investment-schema';
export {
  BOOKING_OVERVIEWS_BY_PRODUCT_ID,
  BOOKING_OVERVIEW_FIXTURE,
} from '@/modules/booking/fixtures/booking-overview';
export {
  bookableProductIds,
  resolveBookingOverview,
} from '@/modules/booking/utils/deposit-catalogue';
export {
  buildConfiguredSummaryRows,
  buildInvestmentSummaryRows,
} from '@/modules/booking/utils/investment-summary';
export { PAYOUT_OPTION_LABELS } from '@/modules/booking/constants/payout-options';
export {
  DEFAULT_QUICK_AMOUNTS,
  MAX_QUICK_AMOUNTS,
  resolveQuickAmounts,
} from '@/modules/booking/utils/quick-amounts';
export { formatCompactCurrency } from '@/utils/format';

/* ---- Product Master (Steps 1–3) ---- */
export {
  parseProductMaster,
  parseProductMasters,
  toProductMaster,
} from '@/services/product-master';

/* ---- Goal-Based FD (rule engine) ---- */
export {
  BLOCKED_RULES,
  GOAL_TENURE_PREFERENCE,
  GOAL_TYPES,
  assessTarget,
  blockedRuleWarnings,
  compareCandidates,
  exceedsHorizon,
  isExactTenureMatch,
  GOAL_DESCRIPTIONS,
  GOAL_ICONS,
  HORIZON_PRESETS,
  PLANNER_STEPS,
  RULE_LABELS,
  acknowledgementFor,
  STEP_HINTS,
  bookingHandoffHref,
  parseGoalParam,
  recommendForGoal,
  recommendForPlan,
  allocateForGoal,
  DEFAULT_ALLOCATION_POLICY,
  NO_CONCENTRATION_POLICY,
  PLAN_HORIZON_PRESETS,
  planHorizonLabel,
  compareTenure,
  supportsMaturity,
  DEPOSIT_INSURANCE_COVERAGE,
  selectCandidates,
  toBookingHandoff,
  TARGET_ADJUSTMENTS,
} from '@/modules/goal-based-fd';
/* Tenure model (UC2) — exact conversions only, day terms never rounded. */
export {
  days,
  formatTenureExact,
  isMonthExpressible,
  isSameTenure,
  months,
  toWholeMonths,
  years,
} from '@/utils/finance';
export { UC2_DAY_BASED_PRODUCT, productSummaries } from '@/mocks/data/products';
export { formatProductTenure } from '@/modules/marketplace/utils';
/* Booking resolution for any catalogue product (documented UC1/UC2/UC3 deposits). */
export {
  createBookingOverviewService,
  toBookingOverview,
} from '@/modules/booking/services/booking-overview-service';
export { GOAL_ENTRIES } from '@/modules/marketplace/constants/goal-entry';

/* ---- Nominee (T3.3.1) ---- */
export {
  DEFAULT_NOMINATION_TYPE,
  NOMINATION_TYPES,
  SUPPORTED_RELATIONSHIPS,
  TOTAL_SHARE_PERCENT,
} from '@/modules/booking/constants/nominee';
export { emptyNominee, emptyNomineeConfiguration } from '@/modules/booking/constants/booking-draft';
export {
  parseSharePercent,
  totalSharePercent,
  validateNominee,
  validateNomineeConfiguration,
} from '@/modules/booking/utils/nominee-schema';
export {
  DEFAULT_PAYOUT_OPTION,
  PAYOUT_OPTION_DESCRIPTIONS,
  PAYOUT_OPTION_ORDER,
} from '@/modules/booking/constants/payout-options';
export {
  defaultPayoutOption,
  isSupportedPayout,
  reconcilePayoutOption,
  resolvePayoutOptions,
} from '@/modules/booking/utils/payout-options';

/**
 * Compile-time guard for decision D1 = A′.
 *
 * The details screen reads `details ?? preview` and relies on the result
 * being a usable `ProductSummary` either way. If the two types are ever
 * split, this stops being `true`, the assignment fails under `tsc`, and the
 * unit suite reports it — instead of the screen silently losing its header
 * fields at runtime.
 */
type DetailsExtendSummary = ProductDetails extends ProductSummary ? true : never;

export const productDetailsExtendsSummary: DetailsExtendSummary = true;

/* ---- The completed booking journey (steps 4–8) ---- */
/**
 * The step machine, the reference minter and the shared post-payment
 * derivation — exported so the *rules* are assertable without a router or a
 * DOM. These decide whether a customer may be on a payment screen and what
 * figures they are shown there, which makes them the ones worth testing
 * directly.
 */
export { BOOKING_STEP_ROUTES, bookingStepRoute } from '@/modules/booking/constants/steps';
export { nextStep, resolveStepAccess, stepIndex } from '@/modules/booking/utils/step-access';
export { buildBookingReference } from '@/modules/booking/utils/booking-reference';
export { formatMaturityDate, maturityDate } from '@/modules/booking/utils/maturity-date';
export { deriveBookingFigures } from '@/modules/booking/utils/booking-figures';
export {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
} from '@/modules/booking/constants/payment-methods';
export { SAVED_BANK_ACCOUNTS } from '@/modules/booking/fixtures/bank-accounts';
/**
 * The entry-amount contract. Exported so the parser's refusals are assertable
 * directly — it is the one place an amount enters Booking from outside, and the
 * one place a fabricated amount could get in.
 */
export { ENTRY_AMOUNT_PARAM, parseEntryAmount } from '@/modules/booking/utils/entry-amount';
