'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productService } from '../services';
import { marketplaceKeys } from './query-keys';

/**
 * useCompareProducts — the products currently selected for comparison
 * (M2.1). Selection itself is in-memory state owned by the compare
 * feature (M2.7); this hook only resolves ids to products.
 *
 * It resolves them to **`ProductDetails`**, not `ProductSummary` (T2.7.1a):
 * the approved comparison screen has an Eligibility row, and `eligibility`
 * exists only on the details payload. The type flows through inference from
 * `productService.getProductsByIds`, so nothing here declares it.
 *
 * **It does not cap** (T2.7.2, closing O1). It applied `MAX_COMPARE` itself
 * until now, inherited from M2.1 when no selection store existed — a second
 * enforcement point, and two places that must change together are two places
 * that will not. `useCompareSelection` owns the cap; this hook resolves
 * whatever ids it is given.
 *
 * **`keepPreviousData` (Comparison Experience Refinement, 2026-08-02).** The
 * deposit amount is part of the key, so applying a new one is a new query with
 * an empty cache — and without this the comparison collapsed to skeletons the
 * instant the user clicked Update Comparison. That is the flicker the
 * refinement exists to remove, moved rather than fixed: the user would have
 * traded a table that jumped while typing for one that emptied on apply.
 *
 * With it the previous figures hold until the new ones land, and `CompareScreen`
 * dims them through `isFetching` so nothing stale is presented as current. It is
 * the treatment `useProducts` has had since M2.4, and it removes the removal
 * skeletons noted in T2.7.3 as a side effect.
 *
 * The one consequence worth naming: an **errored** refetch now keeps its
 * previous data, so `products` alone no longer implies success.
 * `CompareScreen`'s content guard already carries `!isError` for exactly this
 * anticipated change (T2.7.8a), which is why this line could be added without
 * touching it.
 */
export function useCompareProducts(ids: string[], amount: number) {
  return useQuery({
    queryKey: marketplaceKeys.products.compare(ids, amount),
    queryFn: () => productService.getProductsByIds(ids, amount),
    placeholderData: keepPreviousData,
    enabled: ids.length > 0,
  });
}
