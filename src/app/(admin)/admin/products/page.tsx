import type { Metadata } from 'next';

import { AdminProductsScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'FD products — FD Platform Operations',
  description: 'The product catalogue as operations sees it, with pending changes.',
};

export default function AdminProductsPage() {
  return <AdminProductsScreen />;
}
