import type { Route } from 'next';

/**
 * Typed route builders — the single source for <Link> targets and
 * router navigation (Document 04 §13, deep linking).
 * Never write route strings inline in components.
 *
 * `typedRoutes` is enabled, so `Route` is a union of the routes that exist.
 * A builder returns a template literal, which widens to `string` and is not
 * assignable to `Route`; the assertion below is the **one** place that gap is
 * bridged, exactly as `useMarketplaceUrlState` does for composed query
 * strings. Casting at each call site instead would put an unchecked assertion
 * next to every <Link> (M2.6, E4).
 *
 * `marketplace` has no page. It is a phantom: the approved UI renders the
 * listing inline on Home, so the navigation item labelled "Marketplace" already
 * points at `home`. Nothing links to it, and it is left as a plain string
 * rather than asserted into `Route`, so a component that tries to use it fails
 * to typecheck instead of shipping a 404.
 *
 * `compare` became real in T2.7.3 and is asserted. Note that a bare
 * `/compare` renders the empty state by design: on that route the URL *is* the
 * selection (contract C4), so any affordance navigating there must compose
 * `?ids=` from the store via `serialiseCompareIds`.
 *
 * `bookingOverview` is Booking's entry point (T3.1). The product id is carried
 * **in the path**, not in a session id: step one has no session yet — it is the
 * screen on which the user decides whether to start one — and a path that names
 * the product is resumable, shareable, and answerable without server state.
 * Later steps become siblings of `/overview` under the same product segment.
 */
export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  product: (productId: string) => `/marketplace/${productId}` as Route,
  compare: '/compare' as Route,
  bookingOverview: (productId: string) => `/booking/${productId}/overview` as Route,
  /**
   * Investment Details — step two, a sibling of `/overview` under the same
   * product segment (T3.2.7), exactly as `bookingOverview` anticipated.
   *
   * The segment is `investment-details` while the *step id* is `investment`.
   * They are allowed to differ and deliberately do: the step id is the
   * platform's internal vocabulary (`BOOKING_STEPS`, guards, resume), the
   * segment is the user-facing URL, and coupling them would mean a copy change
   * to a URL forced an edit to the state machine.
   */
  bookingInvestmentDetails: (productId: string) =>
    `/booking/${productId}/investment-details` as Route,
  /** Nominee — step three, a sibling of the two before it (T3.3.2). */
  bookingNominee: (productId: string) => `/booking/${productId}/nominee` as Route,
  /**
   * Goal-Based FD planner — the goal-led entry into the same booking journey.
   *
   * A **second entry point, not a second flow**: it ends at
   * `bookingOverview(productId)`, the route Marketplace already leads to
   * (`06-architecture.md` §2). Nothing about Booking changes because the user
   * arrived here instead of from a product card.
   */
  goalPlanner: '/goal-planner' as Route,
  /** Multi-goal planning (client source document, Use Case 2). */
  goalPlannerPlan: '/goal-planner/plan' as Route,
} as const;
