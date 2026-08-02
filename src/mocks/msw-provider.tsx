'use client';

import { useState } from 'react';

import { featureFlags } from '@/config/featureFlags';

/**
 * MswProvider (T1.14, corrected in M2.6) — owns the mock worker's lifecycle.
 *
 * Three independent guards keep mocks out of production:
 *   1. `featureFlags.mocks` is false unless the env flag opts in;
 *   2. `ensureMockWorker` returns `null` when the flag is off, so nothing is
 *      started and no readiness promise exists to gate anything;
 *   3. the worker is loaded with a dynamic import, so MSW is code-split into
 *      a lazy chunk that is never fetched in production.
 *
 * ## Rendering is still never gated
 *
 * Blocking children would empty the server-rendered HTML and cause a
 * hydration mismatch (verified during T1.14). That has not changed. What is
 * gated is the **transport** — but this file does not do that gating, and
 * deliberately cannot: the boundary policy forbids `mocks → services`. This
 * module only exposes *when the worker is ready*; `app/providers.tsx`, the
 * approved cross-layer seat, connects that promise to the API client. See
 * `services/api/request-gate.ts`.
 *
 * ## Why the previous version was wrong
 *
 * This file used to start the worker in `useEffect` and claimed that "the
 * worker starts during the mount effect, which completes before feature
 * queries fire". That was false on two counts: React runs **child effects
 * before parent effects**, so React Query's mount subscriptions fired first;
 * and the effect then awaited a code-split chunk over the network. On any load
 * where the Service Worker was not already active, every query 404'd against
 * the real dev server and — because 4xx is correctly never retried — stayed
 * failed until a manual refetch.
 *
 * Starting now happens in a `useState` initialiser, which runs during render
 * rather than after mount.
 */

/**
 * Start-once state, keyed on `globalThis`.
 *
 * A module-level variable already survives re-renders, StrictMode's double
 * invocation, and provider remounts. It does **not** survive Fast Refresh
 * re-evaluating this module, which would start a second worker. A global
 * symbol survives that too, which is why the extra indirection is here.
 */
const START_KEY = Symbol.for('fd.msw.start');

type GlobalWithStart = typeof globalThis & { [START_KEY]?: Promise<void> };

/**
 * Starts the worker if it is not already starting, and returns the promise
 * that resolves once it can intercept.
 *
 * Returns `null` when mocks are disabled or when called on the server — the
 * two cases where there is nothing to wait for. Safe to call any number of
 * times: the first call owns the promise, every later call returns it.
 */
export function ensureMockWorker(): Promise<void> | null {
  // Never on the server: there is no Service Worker there, and importing
  // `msw/browser` during SSR would fail.
  if (typeof window === 'undefined') return null;
  if (!featureFlags.mocks) return null;

  const scope = globalThis as GlobalWithStart;
  if (scope[START_KEY]) return scope[START_KEY];

  const starting = import('./browser').then(({ startMockWorker }) => startMockWorker());
  scope[START_KEY] = starting;

  return starting;
}

export function MswProvider({ children }: { children: React.ReactNode }) {
  // A `useState` initialiser runs during render, not after mount. StrictMode
  // invokes it twice; `ensureMockWorker` is idempotent, so that is harmless.
  useState(() => {
    ensureMockWorker();
    return null;
  });

  return <>{children}</>;
}
