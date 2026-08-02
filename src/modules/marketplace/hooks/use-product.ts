'use client';

import { useQuery } from '@tanstack/react-query';

import { productService } from '../services';
import { marketplaceKeys } from './query-keys';
import { useProductPreview } from './use-product-preview';
import type { ProductDetails, ProductSummary } from '../types/product';

/**
 * useProduct — a single product for the details screen (M2.1, reshaped in
 * M2.6 by decision D1 = A′).
 *
 * Returns two values rather than one, because a product page genuinely has
 * two states and pretending otherwise is what produced M2.4 risk R3:
 *
 *   preview  — the `ProductSummary` already in cache, available immediately
 *              when the user arrived from a listing and `undefined` on a cold
 *              load. Enough for the header, rate, and key-information grid.
 *   details  — the full payload, once fetched.
 *
 * `ProductDetails extends ProductSummary`, so a consumer writes
 * `details ?? preview` for anything a summary can satisfy and waits on
 * `details` only for the sections that need it. Nothing is ever typed as
 * complete while it is not.
 *
 * The query surface is narrowed on purpose: the screen receives prepared
 * values and flags, not a React Query result object (Document 07 §15).
 */
export interface UseProductResult {
  /** Cached summary, if the user arrived from a listing. */
  preview: ProductSummary | undefined;
  /** Full payload, once loaded. */
  details: ProductDetails | undefined;
  /** True until the first response, whether or not a preview exists. */
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProduct(id: string, enabled = true): UseProductResult {
  const preview = useProductPreview(id);

  const query = useQuery({
    queryKey: marketplaceKeys.products.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: enabled && id.length > 0,
  });

  return {
    preview,
    details: query.data,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
