'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { BankBadge } from '@/components/business/bank-badge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatMaturityDate } from '@/utils/finance';
import { formatCurrency, formatRate, formatTenure } from '@/utils/format';

import type { HoldingView } from '../utils/portfolio-summary';

/**
 * One deposit the investor owns.
 *
 * ## Read in the order the questions are asked
 *
 * Who holds it → how much, at what rate, for how long → where it is in its life
 * → what it will pay. The progress rail is the middle of that sequence because
 * "how far along is this" is the thing a static list of dates cannot answer.
 *
 * ## The rail is a real proportion
 *
 * Its width is elapsed term over total term, computed upstream. It is a `meter`
 * with its value exposed, so the same fact reaches assistive technology — and
 * for a deposit whose term the bank publishes in days there is no proportion to
 * draw, so the rail is absent rather than guessed at.
 *
 * Presentation only. Every figure arrives computed by `summarisePortfolio`;
 * nothing here calculates interest, a maturity date or a percentage.
 */
const STATUS_LABEL: Record<HoldingView['holding']['status'], string> = {
  active: 'Active',
  matured: 'Matured',
  closed: 'Closed',
};

export function FixedDepositHoldingCard({ view }: { view: HoldingView }) {
  const { holding, maturesOn, monthsRemaining, maturityValue, progressPercent } = view;

  const maturingSoon =
    holding.status === 'active' && monthsRemaining !== null && monthsRemaining <= 3;

  return (
    <Card
      variant="outlined"
      className="motion-safe:duration-base hover:shadow-elevation-1 flex h-full flex-col gap-5 p-5 transition-shadow md:p-6"
    >
      <div className="flex items-start gap-3">
        <BankBadge bank={holding.bank} size="lg" decorative={false} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-body-lg text-content font-semibold break-words">{holding.bank.name}</p>
          <p className="text-caption text-content-muted break-words">{holding.productName}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge size="sm">{STATUS_LABEL[holding.status]}</Badge>
          {maturingSoon ? (
            <span className="text-caption text-content-brand font-medium">Maturing soon</span>
          ) : null}
        </div>
      </div>

      {/* The three facts that define the contract. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">Invested</dt>
          <dd className="text-body-lg text-content font-semibold tabular-nums">
            {formatCurrency(holding.principal)}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">Interest rate</dt>
          <dd className="text-body-lg text-content-brand font-semibold tabular-nums">
            {formatRate(holding.annualRate)} p.a.
          </dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">Tenure</dt>
          <dd className="text-body-lg text-content font-semibold tabular-nums">
            {holding.tenureMonths > 0 ? formatTenure(holding.tenureMonths) : 'Not specified'}
          </dd>
        </div>
      </dl>

      {maturesOn === null ? null : (
        <div className="flex flex-col gap-2">
          <div
            role="meter"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress through this deposit's term"
            className="bg-surface-subtle h-1.5 w-full overflow-hidden rounded-full"
          >
            <div
              className="bg-surface-brand h-full rounded-full"
              style={{ width: `${String(progressPercent)}%` }}
            />
          </div>

          <div className="text-caption text-content-muted flex flex-wrap justify-between gap-2">
            <span className="tabular-nums">{formatMaturityDate(new Date(holding.startedAt))}</span>
            <span>
              {monthsRemaining === 0
                ? 'Matures this month'
                : `${String(monthsRemaining)} ${monthsRemaining === 1 ? 'month' : 'months'} to go`}
            </span>
            <span className="tabular-nums">{formatMaturityDate(maturesOn)}</span>
          </div>
        </div>
      )}

      <div className="border-border-default mt-auto flex flex-wrap items-end justify-between gap-3 border-t pt-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-caption text-content-muted">
            {holding.isCumulative ? 'Expected at maturity' : 'Returned at maturity'}
          </span>
          <span className="text-h3 text-content font-semibold tabular-nums">
            {formatCurrency(maturityValue)}
          </span>
        </div>

        <Link
          href={ROUTES.product(holding.productId)}
          className="focus-ring text-body text-content-brand group inline-flex items-center gap-1 rounded-md font-medium"
        >
          View deposit
          <ArrowRight
            aria-hidden="true"
            className="motion-safe:duration-base size-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <p className="text-caption text-content-placeholder tabular-nums">Ref {holding.reference}</p>
    </Card>
  );
}
