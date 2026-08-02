import { QueryClient } from '@tanstack/react-query';

import { isClientError } from '@/services/api';

/**
 * QueryClient factory (T1.14) — approved defaults.
 *
 * Always call this inside component state, never at module scope: a
 * module-scoped client would be shared across SSR requests and leak one
 * user's cache into another's response.
 *
 * Defaults (approved 2026-07-30):
 *   staleTime 60s            — product/bank data changes slowly (Doc 13 §9)
 *   gcTime 5min              — keep recently used pages warm
 *   refetchOnWindowFocus off — avoids surprise refetches mid-decision
 *   retry                    — never on 4xx; up to 2 on network/5xx
 */
const STALE_TIME_MS = 60_000;
const GC_TIME_MS = 5 * 60_000;
const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isClientError(error)) return false;
          return failureCount < MAX_RETRIES;
        },
      },
      mutations: {
        // Mutations are never retried automatically: repeating a financial
        // write without an idempotency key is unsafe (Document 10 §17).
        retry: false,
      },
    },
  });
}
