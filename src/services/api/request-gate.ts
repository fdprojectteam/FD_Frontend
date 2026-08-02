/**
 * Request gate — an optional readiness barrier for outgoing requests (M2.6).
 *
 * ## Why this exists
 *
 * MSW intercepts through a Service Worker that must be registered and
 * activated before it can see a request. The worker is started from a client
 * provider, and React runs **child effects before parent effects** — so React
 * Query's mount subscriptions fired, and requests left the transport, before
 * `MswProvider` had even begun starting the worker. On any load where the
 * worker was not already active those requests reached the real dev server,
 * `/api/v1/*` has no route handler by design, and the 404 was never retried
 * (correctly — `isClientError` suppresses 4xx retries). The screen showed
 * "Unable to load products" until a manual refetch.
 *
 * Gating *render* on the worker was rejected: it empties the server-rendered
 * HTML and causes a hydration mismatch. The right question is not "may this
 * component render" but "may this request leave" — which is a transport
 * question, so the barrier lives here.
 *
 * ## Contract
 *
 * The gate is **entirely optional**. With no gate registered the transport
 * behaves exactly as it did before: `hasRequestGate()` is false, and the
 * request interceptor returns its config synchronously without introducing so
 * much as a microtask. Production never registers one, so the mechanism is
 * inert there — and the transport has no knowledge of MSW at all. It knows
 * only that *something* may ask it to wait.
 *
 * This is the same seat pattern as `setAuthTokenProvider` in `api-client.ts`:
 * the API client owns a registration point, and the layer that holds the
 * knowledge registers into it. The dependency direction stays
 * `mocks → api-client`, never the reverse.
 */
export type RequestGate = () => Promise<void>;

let gate: RequestGate | null = null;

/**
 * Registers the barrier, or clears it with `null`.
 *
 * Passing `null` restores the transport's original behaviour exactly, which is
 * what makes the mechanism safe to leave in place permanently.
 */
export function setRequestGate(next: RequestGate | null): void {
  gate = next;
}

/**
 * Whether a gate is registered.
 *
 * Exposed so the interceptor can stay **synchronous** when there is none:
 * `await`ing an already-resolved promise still defers to a microtask, and the
 * contract is that an ungated transport is byte-for-byte the transport we had
 * before.
 */
export function hasRequestGate(): boolean {
  return gate !== null;
}

/** Resolves immediately when no gate is registered. */
export async function awaitRequestGate(): Promise<void> {
  if (!gate) return;
  await gate();
}
