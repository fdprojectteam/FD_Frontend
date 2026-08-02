'use client';

import { useQueryClient } from '@tanstack/react-query';

import type { Paginated } from '@/services/repository';

import { marketplaceKeys } from './query-keys';
import type { ProductSummary } from '../types/product';
import { selectProductPreview } from '../utils/product-preview';

/**
 * useProductPreview — the summary already in cache for `id`, if any (M2.6).
 *
 * Reads every cached product *list* — the paginated listing and the hero
 * sample both live under `marketplaceKeys.products.lists()` — and finds the
 * product. It **never writes**: see `selectProductPreview` for why that
 * matters.
 *
 * Deliberately not memoised. The value must be re-read as the cache fills;
 * memoising on `id` would pin the first (usually `undefined`) result for the
 * life of the screen. Re-reading is cheap — a scan of the cached pages — and
 * the returned object is the cached instance, so its identity is stable.
 */
export function useProductPreview(id: string): ProductSummary | undefined {
  const queryClient = useQueryClient();

  const pages = queryClient
    .getQueriesData<Paginated<ProductSummary>>({ queryKey: marketplaceKeys.products.lists() })
    .map(([, data]) => data);

  return selectProductPreview(pages, id);
}
