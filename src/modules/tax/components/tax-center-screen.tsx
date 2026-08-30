'use client';

import { ArrowRight, FileText, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { usePortfolio } from '@/hooks/use-portfolio';
import type { TaxDocumentEntry } from '@/types/tax';
import { formatCurrency } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

import { TaxDepositRow } from './tax-deposit-row';
import { buildTaxYearSummary, selectableTaxYears } from '../utils/tax-summary';

/**
 * The Tax Center.
 *
 * ## The one question it answers
 *
 * *How much FD interest is attributable to this tax year, and which deposits
 * produced it?* It does not answer what the investor owes. Taxable income needs
 * their other income; a liability needs a regime, a slab and deductions; TDS
 * needs what the bank actually deducted. This platform has none of the three,
 * and the page says so in the places somebody would otherwise assume.
 *
 * ## Every figure is derived, none is stored
 *
 * Holdings come from the canonical portfolio hook. Each deposit's share comes
 * from `allocateInterestToPeriod`, which divides the total
 * `calculateDepositReturns` already produced. Nothing is written, nothing is
 * cached, and the selected year is ordinary component state.
 *
 * ## Said where it is read, not in a footnote
 *
 * "Platform-derived" and "straight-line approximation" sit directly under the
 * figure they describe. A disclaimer at the bottom of a financial page is a
 * disclaimer nobody reads.
 */
export function TaxCenterScreen() {
  const { holdings, isLoaded } = usePortfolio();

  /* One clock for the page, so the year list and every period agree. */
  const [now] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const years = useMemo(() => selectableTaxYears(holdings, now), [holdings, now]);
  const taxYear = years.find((year) => year.id === selectedId) ?? years[0];

  const summary = useMemo(
    () => (taxYear === undefined ? null : buildTaxYearSummary(holdings, taxYear, now)),
    [holdings, taxYear, now],
  );

  if (!isLoaded || summary === null || taxYear === undefined) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-page flex flex-col gap-8 py-10 md:py-14"
      >
        <span className="sr-only">Loading your tax summary…</span>
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  /*
    Documents are the existing Reports engine's, linked rather than rebuilt.
    A tax-year interest statement is not one of the documents that engine
    produces, so it is listed as unavailable with the reason — inventing one
    here would be a second document engine in everything but name.
  */
  const documents: TaxDocumentEntry[] = [
    {
      id: 'portfolio-statement',
      title: 'Portfolio statement',
      description: 'Every deposit you hold, with its terms and expected interest.',
      issuer: 'platform',
      availability: { status: 'available' },
      href: ROUTES.reports,
    },
    {
      id: 'tax-year-statement',
      title: `FD interest statement for ${taxYear.label}`,
      description: 'A statement of interest attributed to one tax year.',
      issuer: 'platform',
      availability: {
        status: 'not-connected',
        reason:
          'Reports & statements produces per-deposit and portfolio statements. A tax-year statement is not one of them in this build, so none is generated here.',
      },
      href: null,
    },
    {
      id: 'form-16a',
      title: 'TDS certificate (Form 16A)',
      description: 'Issued by the bank that holds your deposit.',
      issuer: 'bank',
      availability: {
        status: 'not-connected',
        reason:
          'Issued by the bank. This platform has no connection to bank document systems, so the certificate cannot be shown here — ask the bank for a copy.',
      },
      href: null,
    },
  ];

  const availableDocuments = documents.filter(
    (entry) => entry.availability.status === 'available',
  ).length;

  const hasHoldings = holdings.length > 0;

  return (
    <div className="container-page flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-h1 text-content">Tax Center</h1>
          <p className="text-body-lg text-content-muted">
            Understand your FD interest and tax-related information.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tax-year" className="text-caption text-content-muted">
            Tax Year
          </label>
          <select
            id="tax-year"
            value={taxYear.id}
            onChange={(event) => {
              setSelectedId(event.target.value);
            }}
            className="focus-ring border-border-default bg-surface-card text-body text-content h-11 rounded-md border px-3"
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!hasHoldings ? (
        <section className="flex flex-col items-center gap-6 py-10 text-center md:py-16">
          <span className="bg-surface-subtle text-content-muted flex size-16 items-center justify-center rounded-full">
            <Landmark aria-hidden="true" className="size-7" />
          </span>

          <div className="flex max-w-lg flex-col gap-3">
            <h2 className="text-h2 text-content">No FD interest to report yet</h2>
            <p className="text-body-lg text-content-muted">
              Once you invest in a fixed deposit, your Tax Center will show interest attributable to
              each Tax Year.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href={ROUTES.home}>
              Explore fixed deposits
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      ) : (
        <>
          {/* ---- The four figures ---- */}
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card variant="outlined" className="flex flex-col gap-1 p-4 md:p-5">
              <dt className="text-caption text-content-muted">FD interest</dt>
              <dd className="text-h3 text-content tabular-nums">
                {formatCurrency(summary.totalInterest)}
              </dd>
            </Card>

            <Card variant="outlined" className="flex flex-col gap-1 p-4 md:p-5">
              <dt className="text-caption text-content-muted">Deposits</dt>
              <dd className="text-h3 text-content tabular-nums">
                {String(summary.contributingDeposits)}
              </dd>
            </Card>

            <Card variant="outlined" className="flex flex-col gap-1 p-4 md:p-5">
              <dt className="text-caption text-content-muted">TDS</dt>
              <dd className="text-body-lg text-content-muted">Not connected</dd>
            </Card>

            <Card variant="outlined" className="flex flex-col gap-1 p-4 md:p-5">
              <dt className="text-caption text-content-muted">Tax documents</dt>
              <dd className="text-body-lg text-content tabular-nums">
                {availableDocuments === 0
                  ? 'None available'
                  : `${String(availableDocuments)} available`}
              </dd>
            </Card>
          </dl>

          {/* ---- The headline figure, and what it is ---- */}
          <section aria-labelledby="tax-total-title" className="flex flex-col gap-3">
            <h2 id="tax-total-title" className="text-h3 text-content">
              Interest attributable to {taxYear.label}
            </h2>

            <Card variant="outlined" className="flex flex-col gap-2 p-5 md:p-6">
              <span className="text-caption text-content-muted">
                {formatMaturityDate(taxYear.startDate)} –{' '}
                {formatMaturityDate(new Date(taxYear.endDate.getTime() - 86_400_000))}
              </span>

              <span className="text-h1 text-content tabular-nums">
                {formatCurrency(summary.totalInterest)}
              </span>

              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral" size="sm">
                  Platform-derived
                </Badge>
                <Badge variant="neutral" size="sm">
                  Straight-line approximation
                </Badge>
              </div>

              <p className="text-caption text-content-muted">
                Derived from the deposits recorded on this platform and attributed across the days
                of each deposit&apos;s term. It is not your complete taxable income, and it is not a
                tax liability.
              </p>

              {summary.unavailableCount > 0 ? (
                <p className="text-caption text-content-muted">
                  {summary.unavailableCount === 1
                    ? 'One deposit could not be allocated to a tax year and is not included in this total.'
                    : `${String(summary.unavailableCount)} deposits could not be allocated to a tax year and are not included in this total.`}
                </p>
              ) : null}
            </Card>
          </section>

          {/* ---- Per deposit ---- */}
          <section aria-labelledby="tax-deposits-title" className="flex flex-col gap-3">
            <h2 id="tax-deposits-title" className="text-h3 text-content">
              Interest by deposit
            </h2>

            {summary.contributions.length === 0 ? (
              <Card variant="outlined" className="flex flex-col gap-1 p-5 md:p-6">
                <p className="text-body text-content font-medium">
                  No deposit was running during {taxYear.label}
                </p>
                <p className="text-caption text-content-muted">
                  Your deposits fall outside this tax year. Choose another year to see the interest
                  attributed to it.
                </p>
              </Card>
            ) : (
              <Card variant="outlined" className="px-5 md:px-6">
                <ul className="flex list-none flex-col">
                  {summary.contributions.map((contribution) => (
                    <TaxDepositRow key={contribution.reference} contribution={contribution} />
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </>
      )}

      {/* ---- TDS ---- */}
      <section aria-labelledby="tax-tds-title" className="flex flex-col gap-3">
        <h2 id="tax-tds-title" className="text-h3 text-content">
          TDS
        </h2>

        <Card variant="outlined" className="flex flex-col gap-1 p-5 md:p-6">
          <span className="text-body text-content font-medium">Not connected</span>
          <p className="text-caption text-content-muted">
            Bank-reported TDS information isn&apos;t connected to this demo. Tax deducted at source
            is determined and reported by the bank that holds your deposit, and no figure is
            estimated here.
          </p>
        </Card>
      </section>

      {/* ---- Documents ---- */}
      <section aria-labelledby="tax-documents-title" className="flex flex-col gap-3">
        <h2 id="tax-documents-title" className="text-h3 text-content">
          Tax documents
        </h2>

        <Card variant="outlined" className="px-5 md:px-6">
          <ul className="divide-border-default/60 flex list-none flex-col divide-y">
            {documents.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1.5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText aria-hidden="true" className="text-content-muted size-4 shrink-0" />
                  <span className="text-body text-content font-medium">{entry.title}</span>
                  <Badge variant={entry.issuer === 'bank' ? 'neutral' : 'brand'} size="sm">
                    {entry.issuer === 'bank' ? 'Bank-issued' : 'Platform-derived'}
                  </Badge>
                </div>

                <p className="text-caption text-content-muted">
                  {entry.availability.status === 'available'
                    ? entry.description
                    : entry.availability.reason}
                </p>

                {entry.availability.status === 'available' && entry.href !== null ? (
                  <Link
                    href={entry.href as never}
                    className="focus-ring text-caption text-content-brand group inline-flex w-fit items-center gap-1 rounded-md font-medium"
                  >
                    Open in reports &amp; statements
                    <ArrowRight
                      aria-hidden="true"
                      className="motion-safe:duration-base size-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                ) : (
                  <span className="text-caption text-content-placeholder">Not available</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ---- The statement that makes the rest safe to read ---- */}
      <section aria-labelledby="tax-information-title" className="flex flex-col gap-3">
        <h2 id="tax-information-title" className="text-h3 text-content">
          Tax information
        </h2>

        <Card variant="outlined" className="flex flex-col gap-2 p-5 md:p-6">
          <p className="text-body text-content-muted">
            This summary shows FD interest attributable to the selected Tax Year, derived from the
            deposit information recorded on this platform. It is not your complete taxable income,
            not your final tax liability, and not an official tax certificate.
          </p>
          <p className="text-caption text-content-muted">
            Interest is attributed evenly across the days of each deposit&apos;s term. Actual
            accrual and the dates a bank credits interest may differ, and this platform has no
            connection to any bank, tax authority or reporting system. For your tax position, use
            the documents your bank issues and your own tax adviser.
          </p>
        </Card>
      </section>
    </div>
  );
}
