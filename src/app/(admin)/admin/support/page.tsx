import type { Metadata } from 'next';

import { AdminSupportScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Support — FD Platform Operations',
  description: 'The customer support queue, operated from the same canonical records.',
};

export default function AdminSupportPage() {
  return <AdminSupportScreen />;
}
