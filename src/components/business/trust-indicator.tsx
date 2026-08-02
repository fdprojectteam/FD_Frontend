import { ShieldCheck, Star } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TrustIndicator, TrustIndicatorId } from '@/types/finance';

/**
 * TrustIndicator — a single trust signal (M2.2).
 *
 * The approved UI shows RBI Regulated, ₹5L DICGC Insured, and AAA Rating.
 * Composed from the platform Badge; icons are decorative, so the label
 * always carries the meaning (Document 14 §11).
 */
const ICONS: Record<TrustIndicatorId, typeof ShieldCheck> = {
  'rbi-regulated': ShieldCheck,
  'dicgc-insured': ShieldCheck,
  'aaa-rating': Star,
};

export interface TrustIndicatorItemProps extends HTMLAttributes<HTMLSpanElement> {
  indicator: TrustIndicator;
}

export const TrustIndicatorItem = forwardRef<HTMLSpanElement, TrustIndicatorItemProps>(
  ({ indicator, className, ...props }, ref) => {
    const Icon = ICONS[indicator.id];

    return (
      <Badge
        ref={ref}
        variant="success"
        leftIcon={<Icon className="size-3" />}
        className={className}
        {...props}
      >
        {indicator.label}
      </Badge>
    );
  },
);
TrustIndicatorItem.displayName = 'TrustIndicatorItem';

export interface TrustIndicatorListProps extends HTMLAttributes<HTMLUListElement> {
  indicators: TrustIndicator[];
}

export const TrustIndicatorList = forwardRef<HTMLUListElement, TrustIndicatorListProps>(
  ({ indicators, className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('flex list-none flex-wrap items-center gap-2', className)}
      {...props}
    >
      {indicators.map((indicator) => (
        <li key={indicator.id}>
          <TrustIndicatorItem indicator={indicator} />
        </li>
      ))}
    </ul>
  ),
);
TrustIndicatorList.displayName = 'TrustIndicatorList';
