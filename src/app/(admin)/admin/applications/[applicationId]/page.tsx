import type { Metadata } from 'next';

import { AdminApplicationDetailScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'Application — FD Platform Operations',
  description: 'One application, its status and the actions recorded against it.',
};

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  return <AdminApplicationDetailScreen applicationId={applicationId} />;
}
