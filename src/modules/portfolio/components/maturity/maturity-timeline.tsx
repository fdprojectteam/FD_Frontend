'use client';

import { Card } from '@/components/ui/card';
import { formatMaturityDate } from '@/utils/finance';
import { formatCurrency } from '@/utils/format';
import type { MaturitySchedule } from '@/utils/portfolio';

/**
 * How maturities are spread over the years ahead.
 *
 * ## A spine, not an axis
 *
 * FD maturities sit years apart, so a proportional horizontal axis would put
 * three deposits in one pixel cluster and a fourth off the edge. A vertical
 * spine with a node per maturity, grouped under its year, reads the same
 * information at any width and at any number of holdings — and it degrades
 * honestly to a single node when there is one deposit, which still looks
 * deliberate rather than broken.
 *
 * ## Years with nothing in them are not drawn
 *
 * Only years that actually contain a maturity appear. Padding the gaps with
 * empty years would be decoration standing in for data.
 *
 * Presentation only.
 */
export function MaturityTimeline({ schedule }: { schedule: MaturitySchedule }) {
  if (schedule.byYear.length === 0) return null;

  return (
    <section aria-labelledby="maturity-timeline-title" className="flex flex-col gap-4">
      <h2 id="maturity-timeline-title" className="text-h2 text-content">
        Maturity timeline
      </h2>

      <Card variant="outlined" className="p-5 md:p-6">
        <ol className="flex list-none flex-col">
          {schedule.byYear.map((group) => (
            <li key={group.year} className="flex gap-4">
              {/* The spine: a year marker and the line that connects it on. */}
              <div className="flex shrink-0 flex-col items-center">
                <span className="text-caption text-content font-semibold tabular-nums">
                  {group.year}
                </span>
                <span aria-hidden="true" className="bg-border-default mt-1 w-px flex-1" />
              </div>

              <ul className="flex min-w-0 flex-1 list-none flex-col gap-3 pb-6 last:pb-0">
                {group.entries.map((entry) => (
                  <li key={entry.view.holding.reference} className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={
                        entry.stage === 'maturing-soon'
                          ? 'bg-surface-brand mt-1.5 size-2.5 shrink-0 rounded-full'
                          : 'border-border-strong bg-surface-card mt-1.5 size-2.5 shrink-0 rounded-full border-2'
                      }
                    />

                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-body text-content font-medium break-words">
                          {entry.view.holding.bank.name}
                        </span>
                        <span className="text-caption text-content-muted tabular-nums">
                          {entry.view.maturesOn === null
                            ? 'Date not published'
                            : formatMaturityDate(entry.view.maturesOn)}
                        </span>
                      </div>

                      <span className="text-body text-content shrink-0 font-semibold tabular-nums">
                        {formatCurrency(entry.view.maturityValue)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
