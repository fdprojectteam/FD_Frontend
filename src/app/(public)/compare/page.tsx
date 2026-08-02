import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CompareScreen } from '@/modules/marketplace/components/compare-screen';

/**
 * Comparison route (M2.7, T2.7.3) — served inside the approved public shell by
 * the `(public)` layout.
 *
 * A server component that owns metadata and composition only; all data access
 * lives in the screen, as on Home and Details.
 *
 * **A Suspense boundary IS required here**, unlike the product-details route.
 * `CompareScreen` reads `useSearchParams()`, which throws `BailoutToCSRError`
 * during prerendering (M2.4 defect C2). The difference between the two routes
 * is a property of what they read, not a house style: details carries no query
 * parameters and needs no boundary, this one carries `?ids=` and does.
 *
 * **Metadata is static**, for the same reason as the details route: MSW
 * intercepts in the browser only, so `generateMetadata` would have no data path
 * to reach on the server.
 */
export const metadata: Metadata = {
  title: 'Compare Fixed Deposits — FD Investment Platform',
  description:
    'Compare up to four Fixed Deposits side by side: interest rate, tenure, minimum investment, returns, benefits, and eligibility.',
};

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareScreen />
    </Suspense>
  );
}
