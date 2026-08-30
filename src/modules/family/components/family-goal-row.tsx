'use client';

import { formatCurrency } from '@/utils';

import type { FamilyGoalProgress } from '../utils/family-overview';

/**
 * One family goal.
 *
 * ## A goal with nothing linked says so
 *
 * `percent` is `null` when no deposit is attributed to the goal, and this
 * renders that as a sentence rather than as an empty bar at zero. Zero looks
 * like a measurement — *you have saved nothing towards this* — when the truth
 * is that the platform cannot tell: Booking never records which goal a deposit
 * was opened for.
 *
 * That is stated once for the section rather than on every row, so the rows
 * stay readable.
 *
 * ## The bar is a proportion, not a decoration
 *
 * Two divs and a width. No chart library, no gradient, no animation — the
 * number beside it is the information, and the bar exists so the eye can
 * compare three goals without reading six figures.
 */
export interface FamilyGoalRowProps {
  progress: FamilyGoalProgress;
}

export function FamilyGoalRow({ progress }: FamilyGoalRowProps) {
  const { goal, contributed, targetAmount, percent, member } = progress;

  return (
    <li className="border-border-default/60 flex flex-col gap-2 border-b py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-body text-content font-medium">
          {goal.label}
          {member === null ? '' : ` · ${member.displayName}`}
        </span>

        <span className="text-caption text-content-muted tabular-nums">
          {percent === null
            ? `Target ${formatCurrency(targetAmount)}`
            : `${formatCurrency(contributed)} / ${formatCurrency(targetAmount)}`}
        </span>
      </div>

      {percent === null ? (
        <p className="text-caption text-content-muted">No deposits are linked to this goal yet.</p>
      ) : (
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.label} progress`}
          className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full"
        >
          <div className="bg-surface-brand h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
      )}
    </li>
  );
}
