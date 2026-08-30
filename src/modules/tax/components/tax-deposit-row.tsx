'use client';

import { ArrowRight, CircleAlert } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/constants/routes';
import type { TaxDepositContribution } from '@/types/tax';
import { formatCurrency, formatPercentage } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

/**
 * One deposit's contribution to the selected tax year.
 *
 * ## Six facts, in the order they are asked for
 *
 * Which deposit, how much is in it, at what rate, over which part of the year,
 * and how much interest that comes to. The period is the **overlap** — a
 * deposit opened in August shows August to March, not its whole term — because
 * that is the number the figure beside it is derived from.
 *
 * ## A deposit that cannot be allocated says so
 *
 * Not "₹0", which reads as a measurement. The reason is printed in the row, and
 * the deposit still links to the portfolio, because it exists and the investor
 * should be able to see it.
 */
export interface TaxDepositRowProps {
  contribution: TaxDepositContribution;
}

export function TaxDepositRow({ contribution }: TaxDepositRowProps) {
  const { allocation } = contribution;

  return (
    <li className="border-border-default/60 flex flex-col gap-3 border-b py-5 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body text-content font-semibold">{contribution.bank.name}</span>
          <span className="text-caption text-content-muted break-words">
            {contribution.productName} · {contribution.reference}
          </span>
        </div>

        {allocation.status === 'allocated' ? (
          <div className="flex flex-col items-end">
            <span className="text-caption text-content-muted">Tax-Year interest</span>
            <span className="text-h3 text-content tabular-nums">
              {formatCurrency(allocation.interest)}
            </span>
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Principal</dt>
          <dd className="text-body text-content tabular-nums">
            {formatCurrency(contribution.principal)}
          </dd>
        </div>

        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Rate</dt>
          <dd className="text-body text-content tabular-nums">
            {formatPercentage(contribution.annualRate)}
          </dd>
        </div>

        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Applicable period</dt>
          <dd className="text-body text-content tabular-nums">
            {allocation.status === 'allocated'
              ? `${formatMaturityDate(allocation.periodStart)} – ${formatMaturityDate(allocation.periodEnd)}`
              : 'Not available'}
          </dd>
        </div>
      </dl>

      {allocation.status === 'unavailable' ? (
        <p className="text-caption text-content-muted flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="text-warning mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="text-content font-medium">Tax-year allocation unavailable.</span>{' '}
            {allocation.reason}
          </span>
        </p>
      ) : null}

      <Link
        href={ROUTES.portfolio}
        className="focus-ring text-caption text-content-brand group inline-flex w-fit items-center gap-1 rounded-md font-medium"
      >
        View deposit
        <ArrowRight
          aria-hidden="true"
          className="motion-safe:duration-base size-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}
