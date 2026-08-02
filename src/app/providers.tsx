'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { ensureMockWorker, MswProvider } from '@/mocks/msw-provider';
import { setRequestGate } from '@/services/api';
import { createQueryClient } from '@/services/query';

/**
 * Single composition point for platform providers (Phase 0 Blueprint §T0.10).
 * Seats, outermost to innermost:
 *
 *   1. MSW           — mock transport, dev only (T1.14) ✔
 *   2. React Query   — server-state cache (T1.14) ✔
 *   3. Theme         — appearance provider (if/when dark mode is approved)
 *   4. Authentication — session provider (Phase 3+)
 *   5. Toast         — toast viewport/provider
 *   6. Analytics     — analytics context (future)
 *
 * MSW wraps Query so the worker is running before any query can fire.
 * The QueryClient is created in state (never at module scope) so it is
 * per-browser-session and cannot leak cache across SSR requests.
 *
 * ## The MSW readiness gate (M2.6)
 *
 * Wrapping is not enough on its own: React runs child effects before parent
 * effects, so queries used to fire before the worker had started, 404 against
 * the real dev server, and stay failed because 4xx is never retried. The fix
 * is a readiness barrier in the **transport**, not in render.
 *
 * This file is the only place that may wire the two together. The boundary
 * policy forbids `mocks → services`, and rightly: the mock layer must not know
 * the transport exists, and the transport must not know MSW exists. So the
 * mock layer exposes *when it is ready*, the API client exposes *a seat for
 * something to wait on*, and this composition point — already the approved MSW
 * bootstrap exception — connects them.
 *
 * The wiring runs in a `useState` initialiser so it happens during this
 * component's render, before any descendant renders or mounts, and therefore
 * before the first query can fire. Both calls are idempotent, so StrictMode's
 * double invocation and Fast Refresh are harmless.
 *
 * Feature-scoped providers do NOT belong here. This file is platform-wide;
 * a provider that serves one module belongs at that module's route-group
 * layout, where its lifetime matches the routes that need it.
 *
 * Registered feature seats (M2.6, decision D6):
 *
 *   • CompareSelectionProvider — Marketplace compare selection (ids only),
 *     feature state per Document 09 §3, mounted in app/(public)/layout.tsx.
 *     It is mounted there rather than here because the selection must
 *     survive navigation between Marketplace routes, and nowhere else in
 *     the app needs it. Added in T2.6.7 — not yet present.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useState(() => {
    const ready = ensureMockWorker();
    // `null` in production and during SSR — the transport is then never gated
    // and behaves exactly as it did before this mechanism existed.
    if (ready) setRequestGate(() => ready);
    return null;
  });

  return (
    <MswProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MswProvider>
  );
}
