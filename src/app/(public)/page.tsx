import { Suspense } from 'react';

import { HomeScreen } from '@/modules/marketplace/components/home-screen';
import { ProductGridSkeleton } from '@/modules/marketplace/components/product-grid-skeleton';

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
    /*
      **The fallback is a skeleton, not `null`.**

      `null` meant that any suspension of this subtree — and reading the URL
      suspends it — rendered Home as a blank page with nothing to say it was
      working. That is the shape of the reported defect: the listing appeared
      empty until a full reload, because a reload re-runs the whole tree while a
      client navigation leaves the boundary showing nothing.

      A real skeleton makes the state legible and, more importantly, makes the
      three states distinguishable: loading, empty, and error are now three
      different screens rather than two of them looking identical.
    */
    <Suspense
      fallback={
        <div className="container-page py-12">
          <ProductGridSkeleton />
        </div>
      }
    >
      <HomeScreen />
    </Suspense>
  );
}
