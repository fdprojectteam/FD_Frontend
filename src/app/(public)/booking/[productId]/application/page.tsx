import type { Metadata } from 'next';

import { ApplicationScreen } from '@/modules/booking/components/application-screen';

/**
 * The partner bank's FD application — between Bank Account and Review.
 *
 * A server component owning metadata and composition only. Which bank's form is
 * shown comes from the deposit resolved by the layout, not from the URL, so one
 * route serves every institution the library supports.
 */
export const metadata: Metadata = {
  title: 'Your application — FD Investment Platform',
  description:
    'Your Fixed Deposit application, prepared from the details you have already given. Check it over and add anything still needed.',
};

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ApplicationScreen productId={productId} />;
}
