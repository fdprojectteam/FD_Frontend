'use client';

import { ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { usePortfolio } from '@/hooks/use-portfolio';
import { buildMaturitySchedule } from '@/utils/portfolio';
import { summarisePortfolio } from '@/utils/portfolio';

import { DocumentSheet } from './document-sheet';
import { buildReportCatalogue, findDocument } from '../../utils/report-catalogue';
import { buildDocumentContent } from '../../utils/report-document';

/**
 * One document, with the only two actions this build can honestly offer.
 *
 * ## Saving is printing, and it is real
 *
 * There is no PDF library in this project and no document service to call, so
 * there is no "Download PDF" button — a button that produced nothing, or a
 * fabricated file dressed as a bank document, are both worse than the truth.
 * What every browser genuinely provides is print-to-PDF, and that is what the
 * action does. The suggested file name is set on `document.title` immediately
 * before printing and restored afterwards, so the saved file arrives named
 * `fd-statement-hdfc-bank-fd-2026-0001-2026-08-27.pdf` rather than the page
 * title. It is a small thing that makes the difference between a demo and a
 * document you would keep.
 *
 * ## An unknown id is a stated absence
 *
 * Holdings live on this device. A document id that names a deposit this
 * investor does not hold — a shared link, an edited URL, a cleared session — is
 * answered plainly rather than with an empty sheet that still looks official.
 *
 * ## It reads; it never writes
 *
 * Portfolio and identity are read through the platform's hooks and projected.
 * Nothing about opening a document changes anything the investor owns.
 */
export interface ReportDocumentScreenProps {
  reportId: string;
}

export function ReportDocumentScreen({ reportId }: ReportDocumentScreenProps) {
  const { holdings, isLoaded } = usePortfolio();
  const { identity, isPending } = useInvestorIdentity();
  const [now] = useState(() => Date.now());

  const content = useMemo(() => {
    const summary = summarisePortfolio(holdings, now);
    const schedule = buildMaturitySchedule(summary, now);
    const catalogue = buildReportCatalogue(summary, schedule, now);
    const descriptor = findDocument(catalogue, reportId);

    if (descriptor === undefined) return null;

    return buildDocumentContent({ descriptor, summary, schedule, identity });
  }, [holdings, identity, now, reportId]);

  const fileName =
    content !== null && content.descriptor.availability.status === 'available'
      ? content.descriptor.availability.fileName
      : null;

  const print = useCallback(() => {
    if (fileName === null) return;

    const previous = document.title;
    document.title = fileName;

    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };

    window.addEventListener('afterprint', restore);
    window.print();
  }, [fileName]);

  if (!isLoaded || isPending) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-detail flex flex-col gap-6 py-10 md:py-14"
      >
        <span className="sr-only">Loading this document…</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="container-detail flex flex-col gap-6 py-10 md:py-14">
        <div className="flex max-w-lg flex-col gap-3">
          <h1 className="text-h1 text-content">This document is not available</h1>
          <p className="text-body-lg text-content-muted">
            It may belong to a deposit that is not held on this device, or it may be a document only
            the bank can issue. Your available documents are listed under reports and statements.
          </p>
        </div>

        <Button asChild size="lg" className="w-fit">
          <Link href={ROUTES.reports}>
            Back to reports
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-detail flex flex-col gap-6 py-8 md:py-12">
      {/* Navigation and actions are screen furniture — never on the printed sheet. */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={ROUTES.reports}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Reports &amp; statements
        </Link>

        <Button variant="secondary" onClick={print}>
          <Printer aria-hidden="true" className="size-4" />
          Print or save as PDF
        </Button>
      </div>

      <DocumentSheet content={content} />

      <p className="text-caption text-content-muted print:hidden">
        Saving uses your browser’s print dialogue — choose “Save as PDF” as the destination. The
        file will be named{' '}
        <span className="text-content font-medium">
          {fileName === null ? '' : `${fileName}.pdf`}
        </span>
        .
      </p>
    </div>
  );
}
