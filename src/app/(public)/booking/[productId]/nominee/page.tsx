import type { Metadata } from 'next';

import { NomineeScreen } from '@/modules/booking/components/nominee-screen';

/**
 * Nominee route — step three of the booking journey (T3.3.2), served inside the
 * approved public shell and inside the booking draft provider, exactly as the
 * two steps before it.
 *
 * A server component owning metadata and composition only; all state access
 * lives in the screen component.
 *
 * **Metadata is static** for the reason it is on every other Booking route: MSW
 * intercepts `/api/v1/*` in the browser only and `src/app/api/` holds no route
 * handlers, so `generateMetadata` would have nothing to fetch.
 */
export const metadata: Metadata = {
  title: 'Nominee details — FD Investment Platform',
  description:
    'Add a nominee who will receive the proceeds of your Fixed Deposit, and choose how the proceeds are shared.',
};

export default async function NomineePage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  return <NomineeScreen productId={productId} />;
}
