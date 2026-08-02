import { forwardRef, type HTMLAttributes } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Benefit } from '@/types/finance';

/**
 * BenefitChipList — the benefit tags on product cards and details (M2.2).
 *
 * Display-only, so these are Badges, not Chips: nothing toggles. When more
 * benefits exist than `max`, the remainder is summarised ("+2 more") so a
 * card never grows unpredictably.
 */
export interface BenefitChipListProps extends HTMLAttributes<HTMLUListElement> {
  benefits: Benefit[];
  max?: number;
}

export const BenefitChipList = forwardRef<HTMLUListElement, BenefitChipListProps>(
  ({ benefits, max, className, ...props }, ref) => {
    const visible = max ? benefits.slice(0, max) : benefits;
    const hiddenCount = benefits.length - visible.length;

    return (
      <ul
        ref={ref}
        className={cn('flex list-none flex-wrap items-center gap-2', className)}
        {...props}
      >
        {visible.map((benefit) => (
          <li key={benefit.id}>
            <Badge variant="outline">{benefit.label}</Badge>
          </li>
        ))}
        {hiddenCount > 0 ? (
          <li>
            <Badge variant="neutral">{`+${hiddenCount} more`}</Badge>
          </li>
        ) : null}
      </ul>
    );
  },
);
BenefitChipList.displayName = 'BenefitChipList';
