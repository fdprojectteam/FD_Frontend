import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { formatRate } from '@/utils/format';

/**
 * InterestRateDisplay — the platform's rate presentation (M2.2).
 *
 * The prominent figure from the approved UI ("7.75%" with a "per annum"
 * caption). Presentation-only; the rate arrives as a number.
 *
 * `layout` and `caption` were added in M2.6: the approved product-details
 * screen renders the same figure two ways — stacked with "per annum" beneath
 * on desktop, inline with "p.a." beside it on mobile. Those are two variants
 * of one presentation, so they are configured here rather than duplicated at
 * the call site (Document 07 §9, §12). The defaults reproduce the M2.2
 * behaviour exactly, so no existing call site changes.
 */
export interface InterestRateDisplayProps extends HTMLAttributes<HTMLDivElement> {
  rate: number;
  size?: 'sm' | 'md' | 'lg';
  showCaption?: boolean;
  /** Caption text. The approved mobile header shortens it to "p.a.". */
  caption?: string;
  /** `stacked` puts the caption beneath the figure; `inline` beside it. */
  layout?: 'stacked' | 'inline';
}

const RATE_SIZE = {
  sm: 'text-body-lg',
  md: 'text-numeric',
  lg: 'text-h1',
} as const;

const LAYOUT = {
  stacked: 'flex-col items-end',
  inline: 'flex-row items-baseline gap-1',
} as const;

export const InterestRateDisplay = forwardRef<HTMLDivElement, InterestRateDisplayProps>(
  (
    {
      rate,
      size = 'md',
      showCaption = true,
      caption = 'per annum',
      layout = 'stacked',
      className,
      ...props
    },
    ref,
  ) => (
    <div ref={ref} className={cn('flex', LAYOUT[layout], className)} {...props}>
      <span className={cn('text-content-brand font-bold tabular-nums', RATE_SIZE[size])}>
        {formatRate(rate)}
      </span>
      {showCaption ? <span className="text-caption text-content-muted">{caption}</span> : null}
    </div>
  ),
);
InterestRateDisplay.displayName = 'InterestRateDisplay';
