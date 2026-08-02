/**
 * API response envelope — the exact contract of Document 10 §7.
 * Every repository/service response types against these; MSW handlers
 * (Phase 2) produce them; the production backend must match them.
 */

import type { PaginationMeta } from './pagination';

/**
 * Documented business error codes (Document 10 §10, Document 11 §12–14).
 * `(string & {})` keeps the union open for module-specific codes while
 * preserving autocomplete for the documented ones.
 */
export type ApiErrorCode =
  | 'PRODUCT_FETCH_FAILED'
  | 'PRODUCT_NOT_FOUND'
  | 'INVALID_DEPOSIT_AMOUNT'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  // Transport-level codes produced by the API client (T1.14).
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | (string & {});

export interface ApiError {
  code: ApiErrorCode;
  details: unknown[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: ApiError;
}

/** Discriminated on `success` — narrow with `if (response.success)`. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
