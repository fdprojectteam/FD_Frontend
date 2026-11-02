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
export { normaliseCurrencyDigits } from '@/modules/goal-based-fd/utils/currency-input';
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
export { UC2_DAY_BASED_PRODUCT, demoTenureProducts, productSummaries } from '@/mocks/data/products';
export {
  demoTenureCatalogue,
  validateDemoTenureCatalogue,
} from '@/mocks/data/demo-tenure-catalogue';
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
/* ---- Bank accounts: the canonical vault ---- */
export {
  BANK_ACCOUNTS_STORAGE_KEY,
  DEMO_BANK_ACCOUNTS,
  addAccount,
  clearAccounts,
  findAccount,
  markDemoVerified,
  readAccounts,
  removeAccount,
  setPrimaryAccount,
} from '@/services/bank-accounts';
export {
  SAMPLE_IFSC_CODES,
  isWellFormedIfsc,
  normaliseIfsc,
  resolveIfsc,
} from '@/services/bank-accounts';
export {
  ACCOUNT_TYPE_LABEL,
  DEMO_VERIFICATION_LABEL,
  defaultFundingAccount,
  describeAccount,
  isUsableForFunding,
  maskAccountNumber,
  primaryAccount,
  verificationDescription,
  verificationLabel,
} from '@/utils/bank-account';
export {
  EMPTY_ACCOUNT_ENTRY,
  isAccountEntryComplete,
  lastFourOf,
  toAccountDigits,
  toNewAccount,
  validateAccountEntry,
} from '@/modules/bank-accounts/utils/account-entry';
export {
  describeAccountUsage,
  nameMatchesIdentity,
} from '@/modules/bank-accounts/utils/account-usage';
/**
 * The entry-amount contract. Exported so the parser's refusals are assertable
 * directly — it is the one place an amount enters Booking from outside, and the
 * one place a fabricated amount could get in.
 */
export { ENTRY_AMOUNT_PARAM, parseEntryAmount } from '@/modules/booking/utils/entry-amount';

/* ---- Investor identity & KYC readiness (doc 07 Stage 3, doc 11 Domain 1) ---- */
/**
 * The readiness rules decide what an investor is asked for. Exported so every
 * outcome — already verified, confirm-only, needs refreshing, something genuinely
 * missing — is assertable without a service, a network or a React tree.
 */
export {
  IDENTITY_FIELD_LABELS,
  OPTIONAL_IDENTITY_FIELDS,
  REQUIRED_IDENTITY_FIELDS,
  deriveKycReadiness,
  isFieldKnown,
  isIdentityCleared,
} from '@/utils/kyc/readiness';
export { KYC_METHODS, findKycMethod, identityWithStatus } from '@/services/investor';

/* ---- FD Application Orchestrator ---- */
/**
 * The library, the mapping engine and the schema validator. Exported so the
 * contract that makes the client's real forms pluggable — resolve by
 * institution, prefill from canonical sources, ask only for what is missing —
 * is assertable without a React tree.
 */
export { createApplicationLibrary } from '@/modules/booking/services/application-library';
export {
  APPLICATION_TEMPLATES,
  AU_FD_TEMPLATE,
  DBS_FD_TEMPLATE,
  SBI_FD_TEMPLATE,
} from '@/modules/booking/fixtures/application-templates';
export {
  CHECKBOX_ACCEPTED,
  resolveApplication,
  resolveFieldValue,
  validateFieldValue,
} from '@/modules/booking/utils/application-mapping';

/* ---- Emergency-fund allocation policy (single source of the 10% rule) ---- */
export {
  EMERGENCY_FUND_BASIS,
  EMERGENCY_FUND_EXPLANATION,
  EMERGENCY_FUND_PERCENT,
  calculateEmergencyFundAmount,
  calculateEmergencyFundTarget,
} from '@/modules/goal-based-fd/utils/emergency-allocation';
export { verifiedPartnerFdProducts } from '@/mocks/data/partner-fd-catalogue';

/* ---- Portfolio: ownership, not intent ---- */
export { portfolioAttention, summarisePortfolio, toHoldingView } from '@/utils/portfolio';
export {
  clearHoldings,
  readHoldings,
  recordHolding,
  removeHolding,
  updateHolding,
  findPotentialDuplicate,
  normalizeExternalHolding,
  HOLDING_SOURCE_LABEL,
  HOLDING_SOURCE_PROVENANCE,
  CONNECTED_HOLDING_PROVIDER,
  IMPORTED_HOLDING_PROVIDER,
} from '@/services/portfolio';
export {
  calculateDepositReturns,
  maturityDate as platformMaturityDate,
  monthsUntil,
} from '@/utils/finance';
export {
  MATURITY_INSTRUCTION_LABEL,
  buildMaturitySchedule,
  toMaturityEntry,
} from '@/utils/portfolio';
export { toMaturityInstruction } from '@/modules/booking/utils/maturity-instruction';
export { deriveNotifications, unreadCount } from '@/utils/notifications/derive-notifications';
export { clearReadIds, markRead, readReadIds } from '@/services/notifications';

/* ---- Reports: a projection of canonical data, never a second source ---- */
export {
  BANK_DOCUMENT_REASON,
  buildReportCatalogue,
  documentId,
  documentsForHolding,
  findDocument,
  parseDocumentId,
} from '@/modules/portfolio/utils/report-catalogue';
export { buildDocumentContent } from '@/modules/portfolio/utils/report-document';
export { formatCurrency, formatPercentage } from '@/utils';

/* ---- Family: a read model over canonical domains ---- */
export { buildFamilyOverview, primaryPosition } from '@/modules/family/utils/family-overview';
export {
  DEMO_FAMILY_GOALS,
  DEMO_FAMILY_MEMBERS,
  demoHoldingsFor,
  readFamilyComposition,
} from '@/services/family';

/* ---- Support: the interaction, never the money ---- */
export {
  DEMO_ACKNOWLEDGEMENT,
  HELP_ARTICLES,
  HELP_CATEGORY_LABEL,
  clearRequests,
  createRequest,
  demoRequests,
  findRequest,
  readRequests,
  replyToRequest,
} from '@/services/support';
export { articlesInCategory, searchHelp, searchTerms } from '@/modules/support/utils/search-help';
export {
  STATUS_PRESENTATION,
  describeSubject,
  requestsNeedingCustomer,
  resolveSubject,
} from '@/modules/support/utils/request-context';

/* ---- Admin: an operations read model over one append-only journal ---- */
export {
  ADMIN_JOURNAL_KEY,
  DEMO_ADMINS,
  SESSION_CUSTOMER_ID,
  appendEvent,
  clearJournal,
  demoApplications,
  demoCustomers,
  readAdminRole,
  readJournal,
  writeAdminRole,
} from '@/services/admin';
export {
  buildApplicationRows,
  buildAttention,
  buildCustomerRows,
  buildProposals,
  filterApplications,
  filterCustomers,
  isDecidable,
  pendingProposals,
  proposalsForProduct,
} from '@/modules/admin/utils/admin-projection';
export {
  PERMISSION_LABEL,
  ROLE_LABEL,
  ROLE_PERMISSIONS,
  can,
  deniedReason,
} from '@/modules/admin/utils/permissions';
export { setRequestStatus } from '@/services/support';

/* ---- Tax: allocation of already-calculated interest, never a second engine ---- */
export {
  allocateInterestToPeriod,
  parseTaxYearId,
  taxYearFor,
  taxYearStarting,
  taxYearsSpanning,
  totalInterestForHolding,
} from '@/utils/tax';
export { buildTaxYearSummary, selectableTaxYears } from '@/modules/tax/utils/tax-summary';
