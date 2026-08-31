'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { usePortfolio } from '@/hooks/use-portfolio';
import { HOLDING_SOURCE_LABEL } from '@/services/portfolio';
import { formatCurrency } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';
import { buildMaturitySchedule } from '@/utils/portfolio';
import { summarisePortfolio } from '@/utils/portfolio';

import { DocumentListItem } from './document-list-item';
import { buildReportCatalogue } from '../../utils/report-catalogue';

/**
 * Reports & statements — where the recorded information about a deposit lives.
 *
 * ## What this screen is for
 *
 * One question: *where can I see the official record of my FD?* The answer has
 * two halves, and both are on this page — what the platform can produce from
 * its own records, and what only the bank can issue. Showing only the first
 * would answer the question misleadingly; hiding the second would leave the
 * investor looking for something that is not here.
 *
 * ## Grouped by deposit, not by document type
 *
 * An investor comes here holding a deposit in mind, not a document type. Each
 * deposit is a section headed by its bank, product and reference, so the
 * question "which FD does this belong to" is answered by position rather than
 * by reading four similar titles.
 *
 * ## It owns no data
 *
 * The holdings come from the platform's portfolio hook; the figures come from
 * `summarisePortfolio`; the schedule from `buildMaturitySchedule`; the document
 * list from `buildReportCatalogue`. Every one of those is the same derivation
 * the dashboard and the maturity screen use — a report is a projection, and
 * this screen adds no source of truth of its own.
 *
 * ## Three states, kept distinct
 *
 * Loading is not emptiness. `isLoaded` is what the screen branches on, so an
 * investor with deposits never sees the empty state flash.
 */
export function ReportsScreen() {
  const { holdings, isLoaded } = usePortfolio();

  /* One clock for the page, so every document is stamped with the same instant. */
  const [now] = useState(() => Date.now());

  const catalogue = useMemo(() => {
    const summary = summarisePortfolio(holdings, now);
    return buildReportCatalogue(summary, buildMaturitySchedule(summary, now), now);
  }, [holdings, now]);

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-detail flex flex-col gap-6 py-10 md:py-14"
      >
        <span className="sr-only">Loading your documents…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (catalogue.byHolding.length === 0) {
    return (
      <div className="container-detail py-10 md:py-14">
        <section className="flex flex-col items-center gap-6 py-10 text-center md:py-16">
          <Image
            src="/goal-based-icon.png"
            alt=""
            aria-hidden="true"
            width={160}
            height={160}
            className="h-auto w-32 object-contain md:w-40"
          />

          <div className="flex max-w-lg flex-col gap-3">
            <h1 className="text-h1 text-content">No documents yet</h1>
            <p className="text-body-lg text-content-muted">
              Statements are generated from deposits you hold. Once your first fixed deposit is
              confirmed, its statement, booking record and maturity advice will appear here.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href={ROUTES.home}>
              Explore FDs
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href={ROUTES.portfolio}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Portfolio
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-content">Reports &amp; statements</h1>
          <p className="text-body-lg text-content-muted">
            Documents generated from your own booking and portfolio records. Documents issued by the
            bank are listed too, so you know which is which.
          </p>
        </div>
      </header>

      {catalogue.portfolioStatement === null ? null : (
        <section aria-labelledby="reports-portfolio-title" className="flex flex-col gap-3">
          <h2 id="reports-portfolio-title" className="text-h3 text-content">
            Your portfolio
          </h2>

          <Card variant="outlined" className="px-5 md:px-6">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              <DocumentListItem descriptor={catalogue.portfolioStatement} />
            </ul>
          </Card>
        </section>
      )}

      <section aria-labelledby="reports-deposits-title" className="flex flex-col gap-4">
        <h2 id="reports-deposits-title" className="text-h3 text-content">
          Your deposits
        </h2>

        {catalogue.byHolding.map(({ entry, documents }) => {
          const { holding } = entry.view;

          return (
            <Card key={holding.reference} variant="outlined" className="flex flex-col px-5 md:px-6">
              {/*
                The deposit's own header. Enough to identify which FD these
                documents belong to without opening one: who it is with, what it
                is, its reference, and when it matures.
              */}
              <div className="border-border-default/60 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b py-4">
                <div className="flex min-w-0 flex-col">
                  <span className="text-body text-content font-semibold">{holding.bank.name}</span>
                  <span className="text-caption text-content-muted break-words">
                    {holding.productName} · {holding.reference}
                  </span>
                  <Badge size="sm" variant="neutral">
                    {HOLDING_SOURCE_LABEL[holding.source]}
                  </Badge>
                </div>

                <span className="text-caption text-content-muted">
                  {formatCurrency(holding.principal)}
                  {entry.view.maturesOn === null
                    ? ''
                    : ` · matures ${formatMaturityDate(entry.view.maturesOn)}`}
                </span>
              </div>

              <ul className="divide-border-default/60 flex list-none flex-col divide-y">
                {documents.map((descriptor) => (
                  <DocumentListItem key={descriptor.id} descriptor={descriptor} />
                ))}
              </ul>
            </Card>
          );
        })}
      </section>

      {/*
        Said once, at the foot. No document system is connected in this build,
        and a page full of statements is exactly where that needs stating.
      */}
      <p className="text-caption text-content-muted">
        Platform-generated documents are produced from the records you created in this app. They are
        not bank certificates. No bank document system is connected in this build, and nothing here
        has been filed with or sent to a bank.
      </p>
    </div>
  );
}
