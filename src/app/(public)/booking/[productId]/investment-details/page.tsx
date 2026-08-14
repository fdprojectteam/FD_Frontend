import type { Metadata } from 'next';

import { InvestmentDetailsScreen } from '@/modules/booking/components/investment-details-screen';

/**
 * Investment Details route — step two of the booking journey (T3.2.7), served
 * inside the approved public shell by the `(public)` layout and inside the
 * booking draft provider by `booking/[productId]/layout.tsx`.
 *
 * A server component that owns metadata and composition only; all state access
 * lives in the screen component, exactly as on Overview, Home and Product
 * Details.
 *
 * **The segment is `investment-details`, the step id is `investment`.** They are
 * allowed to differ: the id is internal vocabulary the state machine and the
 * guards speak, the segment is the URL the user sees. `ROUTES` holds the one
 * mapping between them.
 *
 * **`(public)`, not `(dashboard)`** — the same documented deviation Overview
 * recorded at T3.1. The approved artwork draws an authenticated sidebar shell
 * that does not exist; building it is a navigation-architecture task, and
 * inventing it here would be the redesign this task forbids. Moving the route
 * between groups later is a file move.
 *
 * **Metadata is static** for the reason it is on Overview and Product Details:
 * MSW intercepts `/api/v1/*` in the browser only and `src/app/api/` holds no
 * route handlers, so `generateMetadata` would have nothing to fetch. Per-product
 * titles arrive with a real API.
 *
 * **No Suspense boundary** — nothing on this route reads `useSearchParams`, so
 * there is no prerender bailout to contain.
 */
export const metadata: Metadata = {
  title: 'Investment details — FD Investment Platform',
  description:
    'Enter your investment amount, choose your tenure and interest payout option, and see your estimated returns before confirming your Fixed Deposit.',
};

export default async function InvestmentDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <InvestmentDetailsScreen productId={productId} />;
}
