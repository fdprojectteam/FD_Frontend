'use client';

import { CalendarClock } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import type { MaturityEntry } from '@/utils/portfolio';

/**
 * The deposits whose decision is now.
 *
 * ## One level of urgency, not three
 *
 * A single notice window — the same one the portfolio's attention area uses —
 * rather than a ladder of warning states. Multiple severities on a screen where
 * nothing is actually wrong is how an investor learns to skim past all of them.
 *
 * ## No action it cannot perform
 *
 * There is no route to change a maturity instruction: no bank integration
 * exists to send one to. So this states what is happening and when, and the
 * card below it carries the only real action — viewing the deposit. A "Change
 * instruction" button that opened nothing would be worse than its absence.
 *
 * Renders nothing when nothing is close.
 */
export function MaturingSoonBanner({ entries }: { entries: readonly MaturityEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <Card variant="outlined" className="border-border-primary flex flex-col gap-4 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className="bg-surface-brand-subtle text-content-brand flex size-9 shrink-0 items-center justify-center rounded-full">
          <CalendarClock aria-hidden="true" className="size-4" />
        </span>
        <h2 className="text-body-lg text-content font-semibold">
          {entries.length === 1
            ? 'A deposit is maturing soon'
            : `${entries.length} deposits are maturing soon`}
        </h2>
      </div>

      <ul className="flex list-none flex-col gap-3">
        {entries.map((entry) => (
          <li
            key={entry.view.holding.reference}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-body text-content font-medium break-words">
                {entry.view.holding.bank.name}
              </span>
              <span className="text-caption text-content-muted">
                {entry.daysRemaining === null
                  ? 'Maturity date not published'
                  : entry.daysRemaining <= 0
                    ? 'Matures today'
                    : `Matures in ${String(entry.daysRemaining)} ${entry.daysRemaining === 1 ? 'day' : 'days'}`}
              </span>
            </div>

            <span className="text-body text-content shrink-0 font-semibold tabular-nums">
              {formatCurrency(entry.view.maturityValue)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
