import type { Metadata } from 'next';

import { AdminApplicationsScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Applications — FD Platform Operations',
  description: 'The application queue and its operational statuses.',
};

export default function AdminApplicationsPage() {
  return <AdminApplicationsScreen />;
}
