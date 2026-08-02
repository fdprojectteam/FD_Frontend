import axios from 'axios';

import type { ApiErrorCode, ApiErrorResponse } from '@/types/api';

/**
 * ApiError — the single failure shape for the platform (T1.14).
 *
 * Every transport, HTTP, and business failure is normalized into this
 * class so callers (services, hooks, UI) never branch on axios internals.
 * Error messages stay user-safe; technical detail lives in `details`
 * (Document 15 §13).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** HTTP status when the failure reached the server; undefined for transport failures. */
  readonly status?: number;
  readonly details: unknown[];

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    status?: number;
    details?: unknown[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? [];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** True for statuses that must never be retried (client-side faults). */
export function isClientError(error: unknown): boolean {
  return (
    isApiError(error) && error.status !== undefined && error.status >= 400 && error.status < 500
  );
}

/**
 * True when the resource genuinely does not exist.
 *
 * Sibling of `isClientError`, and separate from it for a reason: a screen must
 * be able to tell "this product does not exist" from "the server failed". The
 * first renders a not-found boundary; the second renders a retryable error.
 * Conflating them turns a transient outage into a false statement about the
 * product catalogue (M2.6, E1).
 *
 * Matches on status, with the documented business code as a fallback for
 * transports that report a business error without an HTTP status.
 */
export function isNotFoundError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.status === 404 || error.code === 'NOT_FOUND' || error.code === 'PRODUCT_NOT_FOUND';
}

/**
 * Normalizes any thrown value into an ApiError:
 * business envelope errors → their own code; HTTP failures → status-derived
 * codes; timeouts and network failures → transport codes.
 */
export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError({
        code: 'TIMEOUT',
        message: 'The request took too long. Please try again.',
      });
    }

    const status = error.response?.status;
    const payload = error.response?.data as Partial<ApiErrorResponse> | undefined;

    if (payload && payload.success === false) {
      return new ApiError({
        code: payload.error?.code ?? 'INTERNAL_ERROR',
        message: payload.message ?? 'Unable to complete your request. Please try again.',
        status,
        details: payload.error?.details ?? [],
      });
    }

    if (status === undefined) {
      return new ApiError({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Check your connection and try again.',
      });
    }

    return new ApiError({
      code: statusToCode(status),
      message: 'Unable to complete your request. Please try again.',
      status,
    });
  }

  return new ApiError({
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again.',
  });
}

function statusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  return 'INTERNAL_ERROR';
}
