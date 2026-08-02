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
export { selectProductPreview } from '@/modules/marketplace/utils/product-preview';
export {
  mergeMarketplaceParams,
  parseMarketplaceUrlValues,
} from '@/modules/marketplace/utils/url-values';

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
