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
/**
 * Who decided this request failed.
 *
 * `'api'` — the response carried the Document 10 error envelope, so the failure
 * is a **verdict**: our API considered the request and rejected it.
 *
 * `'transport'` — something answered (or nothing did) without that envelope: a
 * dev server with no route handler, a proxy, a CDN, a captive portal, a timeout,
 * a dropped connection. The HTTP status may still be meaningful, but it is not
 * an opinion about the resource.
 *
 * The distinction exists because a status code alone cannot carry it, and
 * screens branch on it — see `isNotFoundError`.
 */
export type ApiErrorSource = 'api' | 'transport';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** HTTP status when the failure reached the server; undefined for transport failures. */
  readonly status?: number;
  readonly details: unknown[];
  /**
   * Whether the API issued this failure, or something short of it did.
   * Defaults to `'transport'`: only a parsed Document 10 envelope may claim to
   * speak for the API, so anything constructing an `ApiError` without saying so
   * is, by definition, not the API.
   */
  readonly source: ApiErrorSource;

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    status?: number;
    details?: unknown[];
    source?: ApiErrorSource;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? [];
    this.source = params.source ?? 'transport';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * True for statuses that must never be retried (client-side faults).
 *
 * **Only when the API issued them.** "Do not retry a 4xx" is a rule about
 * *client faults*: the request was malformed, unauthorised, or asked for
 * something that does not exist, and repeating it verbatim cannot succeed. That
 * reasoning requires the API to have looked at the request.
 *
 * A 4xx from anything else says only that the request never reached the API —
 * in this POC, most often the dev server answering `/api/v1/*` with its own 404
 * because the Service Worker was not intercepting yet. Retrying that is not
 * hammering a rejected request; it is trying again once the path exists.
 */
export function isClientError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.source === 'api' &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
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
 *
 * **It requires the API to have said so** (2026-08-02). "Not found" is a verdict
 * about the catalogue, and only the catalogue's API can issue one. A bare HTTP
 * 404 is not that verdict: `/api/v1/*` exists **only** inside the Service
 * Worker, so any request that escapes interception is answered by the Next dev
 * server — which has no route handler for it and replies with its own HTML 404.
 * Read as a verdict, that turned "nothing answered this request" into "this
 * product has been withdrawn", and `ProductDetailScreen` navigated to the
 * not-found boundary instead of showing its retryable error card.
 *
 * The same reasoning holds in production, where the responder would be a
 * gateway, a CDN, or a misconfigured base path rather than a dev server. The
 * failure direction is deliberate: mistaking a real 404 for an outage shows a
 * retry the user did not need, while mistaking an outage for a 404 tells them a
 * product they were reading no longer exists (M2.6, E1).
 */
export function isNotFoundError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.source !== 'api') return false;

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

    /*
      The **only** branch that may claim `source: 'api'`. The envelope is the
      API's signature (Document 10 §7): a response carrying `success: false` was
      produced by something that knows our contract, so its code and message are
      a verdict. Everything below this point is a body we did not recognise, and
      the status is all we know.

      Guarded on the object type as well as the field. An HTML error page parses
      as a *string*, and `'...'.success` is `undefined` rather than a type error,
      so the old check let a body that is plainly not ours fall through to the
      status-only branch — silently, and with the same shape as a real API
      failure.
    */
    const envelope =
      payload && typeof payload === 'object' && payload.success === false ? payload : null;

    if (envelope) {
      return new ApiError({
        code: envelope.error?.code ?? 'INTERNAL_ERROR',
        message: envelope.message ?? 'Unable to complete your request. Please try again.',
        status,
        details: envelope.error?.details ?? [],
        source: 'api',
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
