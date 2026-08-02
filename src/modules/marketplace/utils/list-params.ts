import type { MarketplaceUrlValues, ProductListParams } from '../types/filters';

/**
 * toProductListParams — the single URL → API translation layer (M2.5, A5).
 *
 * Two names differ between the URL and the products endpoint, and both
 * mismatches are silent: no type error, no lint error, the filter simply does
 * nothing. They are resolved here and nowhere else.
 *
 *   G1  URL `q`      → API `q`            (NOT PaginationParams.search, which
 *                                          this endpoint ignores — deprecated)
 *   G2  URL `tenure` → API `tenureMonths`
 *
 * Pure by design: no React, no router, no service. That makes every mapping
 * directly assertable, and it gives the invariant probe a single call site to
 * check. Building `ProductListParams` inline anywhere else is how a filter
 * stops reaching the API without anything failing.
 *
 * Empty values are **omitted, not sent empty**. Two reasons: the query string
 * stays canonical (I7), and `marketplaceKeys.products.list(params)` hashes the
 * object — `{ q: '' }` and `{}` would otherwise be two cache entries for one
 * screen state (I5).
 *
 * Values arrive already validated by `useMarketplaceUrlState`; this function
 * converts, it does not re-police.
 */
export function toProductListParams(
  values: MarketplaceUrlValues,
  limit: number,
): ProductListParams {
  const params: ProductListParams = {
    page: values.page,
    limit,
    sort: values.sort.field,
    order: values.sort.order,
  };

  if (values.q) params.q = values.q;
  if (values.bank) params.bank = values.bank;
  if (values.tenure) params.tenureMonths = Number(values.tenure);
  if (values.minRate) params.minRate = Number(values.minRate);
  if (values.amount) params.amount = Number(values.amount);

  return params;
}
