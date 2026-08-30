import type { Metadata } from 'next';

import { AdminAuditScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Audit log — FD Platform Operations',
  description: 'Every operational action recorded in this session.',
};

export default function AdminAuditPage() {
  return <AdminAuditScreen />;
}
