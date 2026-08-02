import type { Metadata } from 'next';

import { ProductDetailScreen } from '@/modules/marketplace/components/product-detail-screen';

/**
 * Product details route (M2.6, T2.6.2) — served inside the approved public
 * shell by the `(public)` layout.
 *
 * A server component that owns metadata and composition only; all data access
 * lives in the screen component, as on Home.
 *
 * **No Suspense boundary.** Home needs one because `useSearchParams()` throws
 * `BailoutToCSRError` during prerendering (M2.4 defect C2). Under decision
 * D3 = A nothing on this route reads URL state, so no boundary is required —
 * and adding one "for symmetry" would be dead weight with a false rationale.
 *
 * **Metadata is static** (M2.6, E5). Per-product metadata would require
 * fetching the product on the server, and this POC has no server data path:
 * MSW intercepts `/api/v1/*` in the browser only, and `src/app/api/` holds no
 * route handlers. `generateMetadata` would reach nothing. Per-product titles
 * arrive with a real API — recorded, not silently skipped.
 */
export const metadata: Metadata = {
  title: 'Fixed Deposit details — FD Investment Platform',
  description:
    'Full details for a Fixed Deposit: interest rate, tenure, minimum investment, payout, eligibility, and an investment calculator.',
};

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ProductDetailScreen productId={productId} />;
}
