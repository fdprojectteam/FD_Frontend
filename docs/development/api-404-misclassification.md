# The 404 Misclassification — incident and fix

Project: FD Investment Platform
Date: 2026-08-02
Reported as: "intermittently seeing a Next.js 404 page instead of our normal
error state"
Companion: `msw-readiness-gate.md` (M2.6) — same underlying environment, the
half of the problem that was fixed then

## Symptom

A product details page occasionally rendered a 404 page instead of the
retryable "Unable to load this product" card. Reloading usually fixed it. The
product existed the whole time.

## Root cause

**A 404 that the API never issued was being read as the API's verdict.**

The chain, in the order it happens:

1. `NEXT_PUBLIC_API_URL` is `/api/v1` — a **relative** base, so every API call
   resolves against the page's own origin: the Next dev server.
2. `src/app/api/` holds **no route handlers**, by design (Document 11): in this
   POC the versioned API exists *only* inside the MSW Service Worker.
3. Therefore any API request that is **not intercepted** is answered by the Next
   dev server, which has nothing at that path and replies with its own
   **HTML 404 page**.
4. `normalizeError` looked for the Document 10 envelope, did not find one in an
   HTML body, and fell through to its status-only branch: `404 → NOT_FOUND`.
5. `isNotFoundError` accepted any 404.
6. `ProductDetailScreen` calls `notFound()` on `isNotFoundError(error)` — a
   **navigation**, not a render. Next replaced the screen with the not-found
   boundary.

So "nothing answered this request" became "this product has been withdrawn".

The intermittency is step 3: interception is intermittent. A first load after a
fresh install, a cleared site data, a new port, a hard reload (which leaves the
document uncontrolled by the Service Worker), or a request whose path no handler
matches under `onUnhandledRequest: 'bypass'` — each produces one or more
unintercepted requests, and each looked to the user like a product that had
vanished.

### What the M2.6 gate did and did not fix

The readiness gate closed the **timing** window: requests now wait for
`worker.start()` before leaving. It made escapes rarer. It could not make them
impossible — a gate cannot help a document the Service Worker is not
controlling — and, more importantly, it left the **interpretation** untouched.
An escaped request was still indistinguishable from a withdrawn product.

The screen's own docstring recorded the intent all along — _"Rendered when the
screen calls `notFound()` because **the API reported** `PRODUCT_NOT_FOUND`"_ —
and the code said "because someone reported 404".

### Why no test caught it

`normalizeError`, `isNotFoundError` and `isClientError` are pure functions over
a thrown value and had **never been unit-tested**. They are now.

## Checks requested, and what they found

| # | Check | Finding |
|---|---|---|
| 1 | Anything navigating to `/api/v1/products` via `Link` / `router.push` / `router.replace` / `redirect` | **None.** `env.apiUrl` has exactly three consumers: the axios client's `baseURL` and the two MSW handler files. No route builder, `Link`, or router call references it |
| 2 | All product requests use fetch/Axios only | **Confirmed.** No `fetch(` anywhere in `src/`; every request goes repository → `services/api/request` → the single axios instance |
| 3 | API base URL correct in development | **Correct, and load-bearing.** `/api/v1` is right for a same-origin API and is the same value the handlers register, so app and mocks cannot drift. Its consequence — an unintercepted call lands on the dev server rather than failing to connect — is the trap above, and is now handled where the failure is *classified* rather than by moving the URL |
| 4 | Query keys / stale requests on page and filter change | **Sound.** `list(params)` carries the whole params object, `detail(id)` the id, `compare(ids, amount)` the sorted ids **and** the deposit amount. No key omits an input that changes the response, so no page or filter change can be served, or attributed, to another |
| 5 | MSW intercepting correctly | **Bootstrapping is correct** (M2.6 gate: start during render, transport waits). Two gaps remained: a missing handler under the API base was silently passed through, and an uncontrolled document cannot be gated at all — MSW itself mitigates the second by reloading the page when it finds a registration but no controller |
| 6 | Does a failed request cause navigation to the not-found boundary | **Yes — one site.** `product-detail-screen.tsx:127`. It is the only `notFound()` in the application outside the dev-only gallery |
| 7 | Root cause and fix | Below |

## The fix

### 1. Failures carry their provenance (`services/api/api-error.ts`)

`ApiError` gains `source: 'api' | 'transport'`.

- `'api'` — the response carried the Document 10 envelope (`success: false`).
  That is the API's signature: something that knows our contract considered this
  request and rejected it. Its code and message are a **verdict**.
- `'transport'` — anything else. A dev server, a proxy, a CDN, a timeout, a
  dropped connection. The HTTP status may be informative; it is not an opinion
  about the resource.

The default is `'transport'`. Only the envelope parser may claim `'api'`, so a
`new ApiError({ status: 404 })` written anywhere in the future cannot resurrect
this bug by accident.

The envelope check is now guarded on the object type as well as the field: an
HTML page parses as a **string**, and `'…'.success` is `undefined` rather than a
type error, which is precisely how a body that is plainly not ours used to fall
through wearing the shape of a real API failure.

### 2. `isNotFoundError` requires the API to have said so

```ts
if (error.source !== 'api') return false;
```

"Not found" is a statement about the catalogue, and only the catalogue's API can
make it. This is the same argument M2.6 used to separate 404 from 500 (E1),
carried one step further: a transient outage must not tell a user that a product
they were reading no longer exists — and neither must a Service Worker that had
not woken up yet.

The failure direction is deliberate. Mistaking a real 404 for an outage shows a
retry the user did not need; mistaking an outage for a 404 makes the product
disappear. The first is recoverable by clicking; the second is a lie.

### 3. `isClientError` follows the same reasoning

"Never retry a 4xx" is a rule about **client faults** — a request the API
considered and rejected, which cannot succeed if repeated verbatim. A 4xx the API
never issued is an infrastructure failure, so it is now retryable. React Query's
two retries therefore recover the escaped-request case on their own, without any
screen knowing why.

### 4. An unhandled API request is no longer silent (`src/mocks/browser.ts`)

`onUnhandledRequest` was `'bypass'` — every request MSW did not recognise went
quietly to the network. It is now a callback: everything outside the API base
still passes through untouched, and anything **under** it calls `print.error()`,
which logs the offending method and URL and makes MSW answer with a 500 rather
than letting the dev server answer with a 404.

A 500 is honest — "the mock API failed" — and the app already renders that as its
retryable error state.

Note the limit of this half: it only runs for requests the worker actually
intercepted. A document the Service Worker is not controlling never reaches it,
which is exactly why the classification fix carries the weight.

## Verification

**15 new unit assertions** (`Unit · error classification`), the first this module
has ever had:

- an enveloped 404 is `source: 'api'` and keeps `PRODUCT_NOT_FOUND`;
- the dev server's HTML 404 is `source: 'transport'`, with its status still
  reported honestly;
- **the API can say a product does not exist; a 404 from anything else cannot**;
- an API 4xx is not retried, a transport 404 is;
- network failures and timeouts are unchanged, and neither is mistaken for a
  missing product;
- a hand-built `ApiError` defaults to `'transport'`.

**9 new invariant probes** hold the structure behind that behaviour, including an
**exact file list** of everything permitted to claim `source: 'api'` — the two
envelope parsers, and nothing else.

Totals: **179 unit · 325 invariants · 15 boundaries**, all green. Journeys,
`typecheck` and `lint` remain unrunnable in the agent environment (see
`verification/README.md`); run them locally.

## Not changed, and why

- **No UI was touched.** The retryable error card and the not-found page are
  unchanged; what changed is which one a given failure reaches.
- **The base URL stays relative.** An absolute one would fail to connect instead
  of 404ing, which is a louder failure — but it would also move the mock handlers
  with it, and the classification fix already removes the ambiguity at the point
  where it matters.
- **The readiness gate is untouched.** It was never wrong, only incomplete.

## Recommendation for design (not implemented — it is UI)

There is no root `app/not-found.tsx`. The only not-found boundary lives under
`marketplace/[productId]`, so a genuine 404 anywhere else — a mistyped URL, the
phantom `/marketplace` — renders **Next's default 404 page**, which carries none
of the product's shell or branding. Worth an approved design before launch.
