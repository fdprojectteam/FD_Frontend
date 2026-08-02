import type { ProductCategoryId } from '../types/product';

/**
 * Product categories — the fixed set from the approved "Recommended for
 * you" row. Not fetched: the approved UI shows exactly these five.
 */
export interface ProductCategoryOption {
  id: ProductCategoryId;
  label: string;
}

export const PRODUCT_CATEGORIES: readonly ProductCategoryOption[] = [
  { id: 'highest-rate', label: 'Highest Interest Rate' },
  { id: 'senior-citizen', label: 'Senior Citizen Special' },
  { id: 'tax-saving', label: 'Tax Saving FD' },
  { id: 'short-term', label: 'Short-Term Investment' },
  { id: 'high-returns', label: 'High Returns' },
] as const;
