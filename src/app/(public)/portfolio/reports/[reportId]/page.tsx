import type { Metadata } from 'next';

import { ReportDocumentScreen } from '@/modules/portfolio/components/reports';

/**
 * One document.
 *
 * A server component owning metadata and composition only. The id is read from
 * the path and handed to the screen, which resolves it against the documents
 * this investor actually has — an id naming a deposit they do not hold reaches
 * an honest "not available" state rather than a rendered sheet.
 *
 * **Metadata is static.** Naming the deposit in the title would require the
 * holdings, and those live in this device's session storage rather than on a
 * server — there is nothing for `generateMetadata` to read. Recorded here
 * rather than faked with a generic per-document title.
 */
export const metadata: Metadata = {
  title: 'Document — FD Investment Platform',
  description:
    'A statement, booking record or maturity advice generated from your own fixed deposit records.',
};

export default async function ReportDocumentPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return <ReportDocumentScreen reportId={reportId} />;
}
