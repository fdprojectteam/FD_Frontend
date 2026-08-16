import type { Metadata } from 'next';

import { ProcessingScreen } from '@/modules/booking/components/processing-screen';

/**
 * Served inside the approved public shell and inside the booking session, like
 * every other step. A server component owning metadata and composition only —
 * the deposit is resolved once by the layout and the draft is seated there too,
 * so this page passes an id and nothing else.
 *
 * **Metadata is static**, for the reason it is on every Booking route: MSW
 * intercepts `/api/v1/*` in the browser only and `src/app/api/` holds no route
 * handlers, so `generateMetadata` would have nothing to fetch.
 */
export const metadata: Metadata = {
  title: 'Processing your investment — FD Investment Platform',
  description: 'Your Fixed Deposit is being created with the partner bank.',
};

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ProcessingScreen productId={productId} />;
}
