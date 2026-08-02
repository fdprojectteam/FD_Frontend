import axios, { type AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginationMeta } from '@/types/pagination';

import { ApiError, normalizeError } from './api-error';
import { awaitRequestGate, hasRequestGate } from './request-gate';

/**
 * API client — the platform's single HTTP transport (T1.14).
 *
 * The only module permitted to import axios (ESLint-enforced). Everything
 * above it (repositories → services → hooks → UI) speaks in domain terms
 * and normalized errors, never in axios types.
 *
 * Responsibilities: base URL and timeout from validated env, optional auth
 * header injection, Document 10 envelope unwrapping, and error
 * normalization. It performs no caching, retries, or business logic.
 */
const REQUEST_TIMEOUT_MS = 15_000;

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  // Cookie-based auth is a future decision; tokens use the provider below.
  withCredentials: false,
});

/* ------------------------------------------------------------------ */
/* Authentication-ready seat (no auth implemented in this task)        */
/* ------------------------------------------------------------------ */

type AuthTokenProvider = () => string | null;

let authTokenProvider: AuthTokenProvider | null = null;

/**
 * Registers (or clears) the function that supplies the bearer token.
 * Until an approved authentication task calls this, no Authorization
 * header is ever sent — the pipeline exists, the credential does not.
 */
export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider;
}

apiClient.interceptors.request.use((config) => {
  const token = authTokenProvider?.();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  // Optional readiness barrier (see request-gate.ts). Checked synchronously so
  // that with no gate registered — which is always the case in production —
  // this returns `config` without even a microtask, exactly as before.
  return hasRequestGate() ? awaitRequestGate().then(() => config) : config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
);

/* ------------------------------------------------------------------ */
/* Request helpers — envelope in, domain data out                      */
/* ------------------------------------------------------------------ */

function unwrap<T>(payload: ApiSuccessResponse<T> | T): { data: T; meta?: PaginationMeta } {
  // Production and MSW both return the Document 10 envelope; the guard
  // keeps the client resilient if an endpoint ever returns a bare body.
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiSuccessResponse<T>;
    if (envelope.success) {
      return { data: envelope.data, meta: envelope.meta };
    }
    throw new ApiError({ code: 'INTERNAL_ERROR', message: 'Unexpected error envelope.' });
  }
  return { data: payload as T };
}

/** Performs a request and returns the unwrapped payload. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiSuccessResponse<T> | T>(config);
  return unwrap<T>(response.data).data;
}

/** Performs a request and preserves pagination metadata alongside the payload. */
export async function requestWithMeta<T>(
  config: AxiosRequestConfig,
): Promise<{ data: T; meta?: PaginationMeta }> {
  const response = await apiClient.request<ApiSuccessResponse<T> | T>(config);
  return unwrap<T>(response.data);
}
