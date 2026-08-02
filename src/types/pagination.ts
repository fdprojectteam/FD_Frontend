/**
 * Pagination contracts — Document 10 §7–8.
 * Shared by API responses (meta) and collection requests (params).
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  /**
   * @deprecated Unused by the Marketplace products endpoint, which filters on
   * `q` (see `ProductFilters`). Sending `search` produces `?search=…`, which
   * the API ignores — a filter that silently does nothing (M2.5 gap G1).
   *
   * Retained for this milestone by approved decision: `PaginationParams` is
   * platform-shared, so removing the field is not a Marketplace-local change.
   * Scheduled for removal once no other module is confirmed to depend on it.
   */
  search?: string;
}
