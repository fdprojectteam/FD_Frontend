'use client';

import { formatCurrency } from '@/utils/format';

/**
 * A share-of-total ring, drawn in SVG.
 *
 * ## Why a hand-drawn ring and not a chart library
 *
 * One ring on one screen does not justify a charting dependency — its bundle,
 * its own theming layer and its animation loop would all be carried by every
 * page. This is two circles and a `stroke-dasharray`, themed from the same
 * tokens as everything else, and it costs nothing.
 *
 * ## The ring is not the information
 *
 * The figures are listed beside it in full. The ring shows *shape* — whether
 * the portfolio leans on one thing — while the list carries the values, so
 * nobody has to read an arc to learn an amount. That is also what keeps it
 * honest at one segment, where a chart would otherwise draw a full circle and
 * imply a comparison that does not exist.
 *
 * Presentation only; shares arrive computed.
 */
export interface AllocationSegment {
  id: string;
  label: string;
  principal: number;
  sharePercent: number;
}

/* Brand-family tones, darkest first, so the largest segment reads strongest. */
const TONES = [
  'var(--ds-surface-brand)',
  'color-mix(in oklab, var(--ds-surface-brand) 70%, white)',
  'color-mix(in oklab, var(--ds-surface-brand) 45%, white)',
  'color-mix(in oklab, var(--ds-surface-brand) 25%, white)',
  'color-mix(in oklab, var(--ds-surface-brand) 12%, white)',
] as const;

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AllocationRing({
  segments,
  total,
  caption,
}: {
  segments: readonly AllocationSegment[];
  total: number;
  caption: string;
}) {
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="size-28" role="img" aria-label={caption}>
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            stroke="var(--ds-surface-subtle)"
          />
          {segments.map((segment, index) => {
            const length = (segment.sharePercent / 100) * CIRCUMFERENCE;
            const dash = `${String(length)} ${String(CIRCUMFERENCE - length)}`;
            const rotation = (offset / 100) * 360 - 90;
            offset += segment.sharePercent;

            return (
              <circle
                key={segment.id}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth="12"
                stroke={TONES[index % TONES.length]}
                strokeDasharray={dash}
                transform={`rotate(${String(rotation)} 50 50)`}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-body text-content font-semibold tabular-nums">
            {segments.length}
          </span>
          <span className="text-caption text-content-muted">{caption}</span>
        </div>
      </div>

      <dl className="flex min-w-0 flex-1 flex-col gap-3">
        {segments.map((segment, index) => (
          <div key={segment.id} className="flex min-w-0 items-baseline gap-2.5">
            <span
              aria-hidden="true"
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: TONES[index % TONES.length] }}
            />
            <dt className="text-body text-content min-w-0 flex-1 break-words">{segment.label}</dt>
            <dd className="text-caption text-content-muted shrink-0 tabular-nums">
              {formatCurrency(segment.principal)} · {segment.sharePercent}%
            </dd>
          </div>
        ))}
        <p className="text-caption text-content-placeholder tabular-nums">
          Total {formatCurrency(total)}
        </p>
      </dl>
    </div>
  );
}
