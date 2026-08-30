import type { Metadata } from 'next';

import { AdminCustomerDetailScreen } from '@/modules/admin';

/**
 * One customer.
 *
 * **Metadata is static.** A per-customer title would put a customer's name in
 * the browser tab and in history, which an operations console has no reason to
 * do.
 */
export const metadata: Metadata = {
  title: 'Customer — FD Platform Operations',
  description: 'Operational detail for one customer.',
};

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  return <AdminCustomerDetailScreen customerId={customerId} />;
}
