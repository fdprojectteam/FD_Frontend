import type { Metadata } from 'next';

import { AdminDashboardScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Operations overview — FD Platform',
  description: 'What needs operational attention across the platform.',
};

export default function AdminOverviewPage() {
  return <AdminDashboardScreen />;
}
