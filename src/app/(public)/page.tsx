import { Suspense } from 'react';

import { HomeScreen } from '@/modules/marketplace/components/home-screen';

/**
 * Marketplace Home (M2.3) — served at "/" through the (public) route
 * group, inside the approved public shell.
 *
 * The page is a server component: it owns metadata and composition only.
 * All data access lives in HomeScreen.
 *
 * The Suspense boundary is required, not decorative. As of M2.4 HomeScreen
 * reads URL state, and `useSearchParams()` throws BailoutToCSRError during
 * prerendering; without a boundary above it the static generation of "/"
 * fails outright. The boundary belongs at the route's client entry point —
 * it must sit above every component that reads the URL, and HomeScreen is
 * now the topmost such component (M2.4 audit, defect C2).
 *
 * The layout shell (navigation, footer, skip link) is server-rendered and
 * still prerenders normally; only this subtree defers to the client.
 */
export const metadata = {
  title: 'Fixed Deposits — FD Investment Platform',
  description:
    'Compare Fixed Deposits from 50+ RBI-regulated banks in one place — transparent rates, no hidden terms.',
};

export default function MarketplaceHomePage() {
  return (
    <Suspense fallback={null}>
      <HomeScreen />
    </Suspense>
  );
}
