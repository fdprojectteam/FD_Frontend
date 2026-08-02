import type { PaginationParams } from '@/types/pagination';

import type { ProductCategoryId } from './product';

/**
 * Filter, sort, and list-parameter types (M2.1).
 * Mirrors the Document 10 §8–9 query conventions; combinable by design.
 */

export type SortField = 'interestRate' | 'tenureMonths' | 'minInvestment';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  id: string;
  label: string;
  field: SortField;
  order: SortOrder;
}

/**
 * The three search parameters as the user edits them — strings, because they
 * come from and return to the URL and from text inputs.
 *
 * Declared with the domain types rather than alongside a hook: presentation
 * components receive this shape through props and must not reach into the
 * hook layer even for a type (invariant I3).
 */
export interface MarketplaceSearchValues {
  q: string;
  amount: string;
  tenure: string;
}

/**
 * The four approved filter chips as they live in the URL — strings, for the
 * same reason as `MarketplaceSearchValues`: this is a projection of the query
 * string, not the API's parameter shape. Conversion to numbers and to the
 * API's names happens in exactly one place, `toProductListParams()`.
 *
 * `tenure` and `amount` appear here *and* in `MarketplaceSearchValues` on
 * purpose (approved decision D3): the search panel and the chip row edit the
 * same URL keys through the same writer, so they cannot drift.
 */
export interface MarketplaceFilterValues {
  bank: string;
  tenure: string;
  minRate: string;
  amount: string;
}

/**
 * The complete Marketplace Home URL state — the eight approved parameters,
 * parsed and validated.
 *
 * Composed from the two editing surfaces rather than re-declared, so decision
 * D3 is visible in the type system: the overlap between the search panel and
 * the filter chips *is* `tenure` and `amount`.
 *
 * Declared with the domain types, not beside the hook, for the same reason
 * `MarketplaceSearchValues` was moved here in M2.4 — presentation and utility
 * code must not reach into the hook layer even for a type (invariant I3).
 */
export interface MarketplaceUrlValues extends MarketplaceSearchValues, MarketplaceFilterValues {
  page: number;
  sort: SortOption;
}

export interface ProductFilters {
  /**
   * Free-text query. The API filters on `q`; `PaginationParams.search` is
   * inherited but ignored by this endpoint and is deprecated (M2.5 gap G1).
   */
  q?: string;
  /** Bank id; the approved UI filters by a single bank at a time. */
  bank?: string;
  tenureMonths?: number;
  minRate?: number;
  /** Investment amount used for filtering by minimum investment. */
  amount?: number;
  category?: ProductCategoryId;
}

/**
 * Everything the products endpoint accepts: pagination + search + filters.
 *
 * Build this only through `toProductListParams()` (invariant A5). Constructing
 * it inline is how a filter silently stops reaching the API.
 */
export interface ProductListParams extends PaginationParams, ProductFilters {}
