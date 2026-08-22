'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

import type { HoldingView } from '../utils/portfolio-summary';

/**
 * When money comes back, soonest first.
 *
 * ## A date block, not a drawn axis
 *
 * FD maturities sit months or years apart, so a horizontal timeline compresses
 * them into a cluster and says less than the dates themselves. A stacked date
 * block reads instantly at any width, works for one deposit or twenty, and
 * survives a 360px screen — which a drawn axis does not.
 *
 * Presentation only.
 */
const MONTH = new Intl.DateTimeFormat('en-IN', { month: 'short' });

export function UpcomingMaturities({ views }: { views: readonly HoldingView[] }) {
  if (views.length === 0) return null;

  return (
    <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
      <h2 className="text-body-lg text-content font-semibold">Upcoming maturities</h2>

      <ol className="flex list-none flex-col">
        {views.slice(0, 4).map((view) => {
          const date = view.maturesOn;
          if (date === null) return null;

          return (
            <li
              key={view.holding.reference}
              className="border-border-default/60 flex items-start gap-4 border-b py-4 first:pt-0 last:border-b-0 last:pb-0"
            >
              {/* The date as a block — scannable without reading a sentence. */}
              <div className="bg-surface-subtle flex size-14 shrink-0 flex-col items-center justify-center rounded-lg">
                <span className="text-body text-content font-semibold tabular-nums">
                  {date.getDate()}
                </span>
                <span className="text-caption text-content-muted uppercase">
                  {MONTH.format(date)}
                </span>
                <span className="text-content-placeholder text-[10px] tabular-nums">
                  {date.getFullYear()}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-body text-content font-medium break-words">
                  {view.holding.bank.name}
                </p>
                <p className="text-caption text-content-muted">
                  {view.monthsRemaining === 0
                    ? 'Matures this month'
                    : `Matures in ${String(view.monthsRemaining)} ${view.monthsRemaining === 1 ? 'month' : 'months'}`}
                </p>
                <p className="text-body text-content font-semibold tabular-nums">
                  {formatCurrency(view.maturityValue)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {views.length > 4 ? (
        <p className="text-caption text-content-muted">and {views.length - 4} more further out.</p>
      ) : null}
    </Card>
  );
}
