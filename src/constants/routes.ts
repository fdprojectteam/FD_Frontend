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
 */
export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  product: (productId: string) => `/marketplace/${productId}` as Route,
  compare: '/compare' as Route,
} as const;
