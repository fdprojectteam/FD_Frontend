'use client';

import { useQuery } from '@tanstack/react-query';

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
 */
export function useCompareProducts(ids: string[]) {
  return useQuery({
    queryKey: marketplaceKeys.products.compare(ids),
    queryFn: () => productService.getProductsByIds(ids),
    enabled: ids.length > 0,
  });
}
