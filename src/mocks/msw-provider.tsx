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

/**
 * The start attempt, and whether it has finished.
 *
 * `settled` is what makes re-verification safe. Without it, a second call made
 * while the first start is still in flight would see no controller yet and
 * start a second worker — the exact duplication this cache exists to prevent.
 */
interface WorkerStart {
  promise: Promise<void>;
  settled: boolean;
}

type GlobalWithStart = typeof globalThis & { [START_KEY]?: WorkerStart };

/**
 * Is the Service Worker currently controlling this page?
 *
 * Registration is not the same as control. A page can be loaded before the
 * worker activates, a dev-server restart can drop it, and an updated worker
 * takes over only after a navigation — in each case `controller` is `null` and
 * **MSW cannot intercept anything**. Requests then reach the Next dev server,
 * which has no `/api/v1` route handlers by design.
 */
function isWorkerControlling(): boolean {
  return typeof navigator !== 'undefined' && navigator.serviceWorker?.controller != null;
}

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
  const existing = scope[START_KEY];

  /*
    Reuse the cached attempt while it is still in flight, or once it has
    finished **and the worker is actually controlling the page**.

    The second half is the fix for Home's intermittently empty product list.
    The gate used to hold a promise captured once at startup: after it resolved,
    every later request was waved through whether or not the worker was still
    there. When control was lost, the calls bypassed MSW, reached the dev
    server, and the screen showed its empty or error state — and no amount of
    client-side navigation recovered it, because the gate had nothing left to
    wait for. Re-verifying costs one property read per request and restarts only
    when control has genuinely gone.
  */
  if (existing && (!existing.settled || isWorkerControlling())) return existing.promise;

  const start: WorkerStart = {
    promise: import('./browser')
      .then(({ startMockWorker }) => startMockWorker())
      .finally(() => {
        start.settled = true;
      }),
    settled: false,
  };
  scope[START_KEY] = start;

  return start.promise;
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
