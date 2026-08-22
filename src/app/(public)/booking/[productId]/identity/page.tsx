import type { Metadata } from 'next';

import { IdentityScreen } from '@/modules/booking/components/identity-screen';

/**
 * Investor Verification route — Stage 3 of the approved future-state journey
 * (doc 07), served inside the approved public shell and inside the booking
 * session like every other step.
 *
 * A server component owning metadata and composition only. The deposit is
 * resolved once by the layout and the identity is read from the platform-level
 * investor hook, so this page passes an id and nothing else.
 */
export const metadata: Metadata = {
  title: 'Verify your identity — FD Investment Platform',
  description:
    'Confirm the details we already hold so your Fixed Deposit can be opened. Nothing to type if your record is already verified.',
};

export default async function IdentityPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  return <IdentityScreen productId={productId} />;
}
