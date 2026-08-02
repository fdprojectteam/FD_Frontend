import type { ProductListParams } from '../types/filters';

/**
 * marketplaceKeys — the single source of React Query keys for this module
 * (M2.1, approved adjustment 6).
 *
 * Hierarchical so invalidation can be surgical or broad:
 *   marketplaceKeys.all              → everything marketplace
 *   marketplaceKeys.products.all     → every product query
 *   marketplaceKeys.products.list(p) → one filtered page
 *
 * Compare ids are sorted so ['a','b'] and ['b','a'] share one cache entry.
 */
export const marketplaceKeys = {
  all: ['marketplace'] as const,

  products: {
    all: ['marketplace', 'products'] as const,
    lists: () => [...marketplaceKeys.products.all, 'list'] as const,
    list: (params?: ProductListParams) =>
      [...marketplaceKeys.products.lists(), params ?? {}] as const,
    details: () => [...marketplaceKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...marketplaceKeys.products.details(), id] as const,
    compare: (ids: string[]) =>
      [...marketplaceKeys.products.all, 'compare', [...ids].sort()] as const,
  },

  banks: {
    all: ['marketplace', 'banks'] as const,
    list: () => [...marketplaceKeys.banks.all, 'list'] as const,
  },
} as const;
