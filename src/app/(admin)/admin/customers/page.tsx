import type { Metadata } from 'next';

import { AdminCustomersScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Customers — FD Platform Operations',
  description: 'The customer register, with verification state and deposits held.',
};

export default function AdminCustomersPage() {
  return <AdminCustomersScreen />;
}
