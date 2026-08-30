import type { Metadata } from 'next';

import { RequestDetailScreen } from '@/modules/support';

/**
 * One support request.
 *
 * The number in the path is the one the customer quotes and carries no personal
 * data. **Metadata is static**: naming the request would mean reading session
 * storage, which no server component can do, and a subject line in the tab
 * title would leak what the customer asked about.
 */
export const metadata: Metadata = {
  title: 'Support request — FD Investment Platform',
  description: 'The status of one support request, what it is about, and what happens next.',
};

export default async function SupportRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return <RequestDetailScreen requestId={requestId} />;
}
