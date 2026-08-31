'use client';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { type MouseEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { usePortfolio } from '@/hooks/use-portfolio';
import {
  findPotentialDuplicate,
  HOLDING_SOURCE_LABEL,
  HOLDING_SOURCE_PROVENANCE,
  normalizeExternalHolding,
  type ExternalFDInput,
} from '@/services/portfolio';
import { formatMaturityDate, maturityDate } from '@/utils/finance';
import { formatCurrency, formatRate, formatTenure } from '@/utils/format';

export interface ExternalHoldingReviewProps {
  input: ExternalFDInput;
  backHref: Route;
  onBack?: () => void;
}

/** Shared final gate for manual, connected-demo, and imported-demo sources. */
export function ExternalHoldingReview({ input, backHref, onBack }: ExternalHoldingReviewProps) {
  const { holdings, record } = usePortfolio();
  const [duplicateReference, setDuplicateReference] = useState<string | null>(null);
  const holding = useMemo(() => normalizeExternalHolding(input), [input]);
  const maturesOn = useMemo(
    () => maturityDate(holding.startedAt, holding.tenureMonths),
    [holding.startedAt, holding.tenureMonths],
  );
  const duplicate = holdings.find((entry) => entry.reference === duplicateReference) ?? null;

  const add = (event: MouseEvent<HTMLAnchorElement>) => {
    const possibleDuplicate = findPotentialDuplicate(holding, holdings);
    if (possibleDuplicate) {
      event.preventDefault();
      setDuplicateReference(possibleDuplicate.reference);
      return;
    }
    record(holding);
  };

  if (duplicate) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8 md:py-12">
        <Link
          href={backHref}
          onClick={onBack}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to review
        </Link>
        <Card variant="outlined" className="flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2 text-content">This FD may already be in your portfolio</h1>
            <p className="text-body text-content-muted">
              We found a record with the same bank and matching details. We will not merge it or
              change it automatically.
            </p>
          </div>
          <div className="bg-surface-subtle flex flex-col gap-1 rounded-lg p-4">
            <span className="text-body text-content font-semibold">{duplicate.bank.name}</span>
            <span className="text-caption text-content-muted">
              {duplicate.productName} · {formatCurrency(duplicate.principal)}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="secondary">
              <Link href={ROUTES.portfolio}>It&apos;s the same FD</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.portfolio} onClick={() => record(holding)}>
                Keep both records
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8 md:py-12">
      <Link
        href={backHref}
        onClick={onBack}
        className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-content">Review your FD</h1>
        <p className="text-body-lg text-content-muted">
          Check the details before adding this record.
        </p>
      </div>
      <Card variant="outlined" className="flex flex-col gap-6 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-h3 text-content">{holding.bank.name}</p>
            <p className="text-body text-content-muted">{holding.productName}</p>
          </div>
          <span className="bg-surface-brand-subtle text-content-brand text-caption rounded-full px-3 py-1 font-medium">
            {HOLDING_SOURCE_LABEL[holding.source]}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-caption text-content-muted">Principal</dt>
            <dd className="text-h3 text-content tabular-nums">
              {formatCurrency(holding.principal)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-muted">Interest rate</dt>
            <dd className="text-h3 text-content tabular-nums">
              {formatRate(holding.annualRate)} p.a.
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-muted">Started</dt>
            <dd className="text-body text-content">
              {formatMaturityDate(new Date(holding.startedAt))}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-muted">Matures</dt>
            <dd className="text-body text-content">
              {maturesOn ? formatMaturityDate(maturesOn) : 'Not provided'}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-muted">Tenure</dt>
            <dd className="text-body text-content">
              {holding.tenureMonths > 0 ? formatTenure(holding.tenureMonths) : 'Not provided'}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-muted">Interest option</dt>
            <dd className="text-body text-content">{holding.payoutLabel}</dd>
          </div>
        </dl>
        {holding.externalReference ? (
          <p className="text-caption text-content-muted">
            Your reference · {holding.externalReference}
          </p>
        ) : null}
        <div className="bg-surface-subtle text-body text-content-muted rounded-lg p-4">
          <span className="text-content font-medium">
            Source · {HOLDING_SOURCE_LABEL[holding.source]}
          </span>
          <br />
          {HOLDING_SOURCE_PROVENANCE[holding.source]}. This deposit wasn&apos;t booked through our
          platform; we use the information available to organize your portfolio.
        </div>
        <Button asChild size="lg">
          <Link href={ROUTES.portfolio} onClick={add}>
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Add to portfolio
          </Link>
        </Button>
      </Card>
    </section>
  );
}
