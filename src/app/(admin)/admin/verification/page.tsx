import type { Metadata } from 'next';

import { AdminKycScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Verification — FD Platform Operations',
  description: 'Verification cases needing a decision. No identity documents are shown.',
};

export default function AdminKycPage() {
  return <AdminKycScreen />;
}
