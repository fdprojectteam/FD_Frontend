'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productService } from '../services';
import { marketplaceKeys } from './query-keys';
import type { ProductListParams } from '../types/filters';

/**
 * useProducts — paginated product list (M2.1).
 *
 * Binds the service to React Query; contains no transport and no calculation.
 *
 * `keepPreviousData` (M2.4): while a new page or sort loads, the previous page
 * stays on screen instead of collapsing to skeletons. Consumers signal the
 * in-flight state with `isFetching`, so the grid never jumps.
 *
 * **No cache priming (M2.6, decision D1 = A′).** This hook used to write each
 * `ProductSummary` into the detail cache so a product page could render
 * instantly. That stored a summary under a key typed `ProductDetails`, leaving
 * five fields undefined for one paint while the type said otherwise (M2.4
 * audit M6 and risk R3), and it needed an `updatedAt: 0` seed to force
 * immediate revalidation — a workaround for a write that should not have
 * existed.
 *
 * The instant render is unchanged; it is now achieved by *reading* this
 * query's own cached pages (`selectProductPreview` / `useProductPreview`)
 * rather than by writing a second, partial copy elsewhere. This hook writes
 * nothing.
 */
/**
 * `enabled` (T2.7.6) — additive, defaulting to the previous behaviour.
 *
 * The comparison's "Add another FD" picker needs a catalogue page only once the
 * dialog opens, and fetching it on every visit to `/compare` would compete with
 * the comparison's own batch for a page the user may never see. The screen owns
 * the dialog's open state (I3), so it must be able to gate the query it also
 * owns.
 */
export interface UseProductsOptions {
  enabled?: boolean;
}

export function useProducts(params?: ProductListParams, options?: UseProductsOptions) {
  return useQuery({
    queryKey: marketplaceKeys.products.list(params),
    queryFn: () => productService.getProducts(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}
