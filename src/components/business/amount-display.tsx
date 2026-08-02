import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

/**
 * AmountDisplay — the platform's money presentation (M2.2).
 *
 * The only component that renders a rupee value, so Indian digit grouping
 * (₹1,07,978) is guaranteed consistent. Values arrive already computed —
 * this component never calculates.
 */
export interface AmountDisplayProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'brand';
}

const VALUE_SIZE = {
  sm: 'text-body',
  md: 'text-body-lg',
  lg: 'text-numeric',
} as const;

const VALUE_TONE = {
  default: 'text-content',
  brand: 'text-content-brand',
} as const;

export const AmountDisplay = forwardRef<HTMLDivElement, AmountDisplayProps>(
  ({ value, label, size = 'md', tone = 'default', className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props}>
      {label ? <span className="text-caption text-content-muted">{label}</span> : null}
      <span className={cn('font-medium tabular-nums', VALUE_SIZE[size], VALUE_TONE[tone])}>
        {formatCurrency(value)}
      </span>
    </div>
  ),
);
AmountDisplay.displayName = 'AmountDisplay';
