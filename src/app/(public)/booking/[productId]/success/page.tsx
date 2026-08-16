import type { Metadata } from 'next';

import { SuccessScreen } from '@/modules/booking/components/success-screen';

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
  title: 'Booking confirmed — FD Investment Platform',
  description:
    'Your Fixed Deposit has been created. Reference number, maturity date and investment summary.',
};

export default async function SuccessPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  return <SuccessScreen productId={productId} />;
}
