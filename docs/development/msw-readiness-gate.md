# The MSW Readiness Gate — incident and fix

Project: FD Investment Platform
Date: 2026-07-31
Milestone: M2.6 (discovered during T2.6.7 review; the defect predates it)
Amends: `docs/engineering/11_Mock API Strategy.md` (worker bootstrap)

## Symptom

Marketplace Home rendered "Unable to load products" with a Try again button.
The Bank filter chip was disabled and the Featured banks strip was absent —
so the products, banks, **and** hero-sample queries had all failed. Pressing
Try again fixed it, and so did a reload.

## Root cause

MSW intercepts through a Service Worker, which must be registered and active
before it can see a request. `MswProvider` started the worker in a `useEffect`
and its docstring claimed:

> "The worker starts during the mount effect, which completes before feature
> queries fire (queries also run post-mount)."

Both halves of that were wrong:

1. **React runs child effects before parent effects.** `MswProvider` is an
   ancestor of the screens, so React Query's mount subscriptions — and the
   requests they trigger — fired *before* the provider's effect ran at all.
2. Even once it ran, the effect `await`ed a **code-split chunk over the
   network** (`_app-pages-browser_src_mocks_browser_ts.js`) before
   `worker.start()` was even called.

On any load where the worker was not already active from a previous session,
every query reached the real dev server. `/api/v1/*` has no route handler by
design, so Next returned 404, and `isClientError` correctly suppressed retries.
Nothing invalidated the cache when the worker later became ready, so the
failure was permanent until a manual refetch.

The bug had been latent since T1.14. It surfaced now because anything that
unregisters the Service Worker — a fresh install, a new port, cleared site
data — makes the next load a "first load", which is the load this race loses.

## Options considered

| | Approach | Why not |
|---|---|---|
| Invalidate queries after `worker.start()` | Repair, not prevention: the failed requests still go out, still 404, still flash the error card. Also couples the mock layer to React Query. |
| `enabled: mswReady` on every query | Leaks mock awareness into every feature hook — violates Document 11 §2 and transport independence. |
| Gate render on readiness | Empties the server-rendered HTML and causes a hydration mismatch. Already rejected in T1.14. |
| Start MSW in `instrumentation-client.ts` | Narrows the window, does not close it: `worker.start()` is still async. |

## The fix — a transport-level readiness gate

The question is not "may this component render" but "may this request leave",
which is a transport question. So the barrier lives in the API client:

```
services/api/request-gate.ts     the seat: setRequestGate / hasRequestGate / awaitRequestGate
services/api/api-client.ts       the request interceptor consults it
mocks/msw-provider.tsx           exposes ensureMockWorker(): Promise<void> | null
app/providers.tsx                wires the two together, during render
```

This is the same shape as the existing `setAuthTokenProvider` seat: the API
client owns a registration point, and the layer holding the knowledge registers
into it.

### Properties

- **Optional.** With no gate registered the interceptor returns its config
  synchronously — not even a microtask. `setRequestGate(null)` restores the
  original transport exactly. Production never registers one.
- **The transport knows nothing about MSW.** It knows only that *something* may
  ask it to wait. A probe asserts the words "msw", "mock", and "worker" appear
  nowhere in `request-gate.ts`.
- **Idempotent.** `ensureMockWorker()` is keyed on a `globalThis` symbol, so
  re-renders, StrictMode's double invocation, provider remounts **and Fast
  Refresh module re-evaluation** all return the same promise rather than
  starting a second worker.
- **Render is still never gated.** SSR is untouched; `ensureMockWorker` returns
  `null` on the server.
- **Ordering is deterministic, not lucky.** The wiring runs in a `useState`
  initialiser in `Providers`, which executes during that component's render —
  before any descendant renders or mounts, and therefore before the first query
  can fire.

### Why the wiring lives in `app/providers.tsx`

The first implementation had `mocks/msw-provider.tsx` import `setRequestGate`
directly. **ESLint rejected it:** the boundary policy has no rule permitting
`mocks → services`, and that is correct — the mock layer must not know the
transport exists, and the transport must not know MSW exists. `providers.tsx`
is already the documented MSW bootstrap exception and the one place allowed to
see both, so composition belongs there. The dependency direction is preserved:

```
mocks ──┐
        ├──► app/providers.tsx ──► (wires) ──► services/api
services┘
```

## Verification

**Automated (in `npm run verify`):**

- 11 unit assertions on the gate: default-ungated, registration observable, a
  gated request genuinely blocks until released, the gate is consulted per
  request, `setRequestGate(null)` restores ungated behaviour, re-registration
  replaces rather than stacks, and a rejecting gate surfaces rather than hangs.
- 13 invariant probes: the transport contains no MSW vocabulary; the
  interceptor stays synchronous when ungated; start is idempotent via the
  global symbol; never starts during SSR; the flag guards the whole mechanism;
  registration happens during render; the mock layer does not import the
  transport; and **nothing outside those three files references the readiness
  primitives**, so `enabled: mswReady` cannot creep into feature code later.

**Not automated — and this needs stating plainly.** The browser race *cannot*
be reproduced by the existing harness. The journey suite serves handlers
through `msw/node`, which intercepts synchronously at setup, so there is no
Service Worker and no registration window. That is precisely why 347 assertions
stayed green through a real, user-visible defect. Passing suites are evidence
about the code paths they exercise, not about this one.

The end-to-end proof is manual:

1. DevTools → Application → Service Workers → **Unregister**.
2. Hard refresh.
3. Products render on the **first** load — no Try again button.
4. Network shows no `/api/v1/products` 404.
5. The request is served **from ServiceWorker**.

## Related finding

The root-cause analysis was slower than it should have been because the
repository still has **no commits**, so there was no T2.6.6 ↔ T2.6.7 diff to
read. That is M2.4 risk R4, now demonstrated rather than theoretical.
