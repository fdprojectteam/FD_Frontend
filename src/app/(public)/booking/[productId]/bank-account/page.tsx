import type { Metadata } from 'next';

import { BankAccountScreen } from '@/modules/booking/components/bank-account-screen';

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
  title: 'Bank account — FD Investment Platform',
  description:
    'Choose the bank account used to fund your Fixed Deposit and receive the maturity proceeds.',
};

export default async function BankAccountPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <BankAccountScreen productId={productId} />;
}
