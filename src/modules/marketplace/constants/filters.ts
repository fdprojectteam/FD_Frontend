import type { SortOption } from '../types/filters';

/**
 * Filter and sort option sets (M2.1) — the values behind the approved
 * filter chips (Bank · Tenure · Interest Rate · Amount) and the
 * "Sort: Highest rate" control. Components never hardcode these.
 */

/** Reference amount used for the "Estimated returns on ₹1,00,000" line. */
export const REFERENCE_AMOUNT = 100_000;

export const TENURE_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 6, label: '6 months' },
  { value: 9, label: '9 months' },
  { value: 12, label: '12 months' },
  { value: 18, label: '18 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
] as const;

export const RATE_BANDS: readonly { value: number; label: string }[] = [
  { value: 6.5, label: '6.5% and above' },
  { value: 7, label: '7% and above' },
  { value: 7.25, label: '7.25% and above' },
  { value: 7.5, label: '7.5% and above' },
] as const;

export const AMOUNT_PRESETS: readonly { value: number; label: string }[] = [
  { value: 25_000, label: '₹25,000' },
  { value: 50_000, label: '₹50,000' },
  { value: 100_000, label: '₹1,00,000' },
  { value: 500_000, label: '₹5,00,000' },
] as const;

/**
 * The approved default ("Sort: Highest rate"). Declared separately so
 * DEFAULT_SORT is a definite SortOption: under noUncheckedIndexedAccess,
 * indexing the readonly array would widen it to `SortOption | undefined`.
 */
const SORT_RATE_DESC: SortOption = {
  id: 'rate-desc',
  label: 'Highest rate',
  field: 'interestRate',
  order: 'desc',
};

export const SORT_OPTIONS: readonly SortOption[] = [
  SORT_RATE_DESC,
  { id: 'rate-asc', label: 'Lowest rate', field: 'interestRate', order: 'asc' },
  { id: 'tenure-asc', label: 'Shortest tenure', field: 'tenureMonths', order: 'asc' },
  { id: 'tenure-desc', label: 'Longest tenure', field: 'tenureMonths', order: 'desc' },
  { id: 'min-asc', label: 'Lowest minimum', field: 'minInvestment', order: 'asc' },
] as const;

export const DEFAULT_SORT: SortOption = SORT_RATE_DESC;
