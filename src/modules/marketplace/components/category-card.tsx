import { forwardRef } from 'react';

import { cn } from '@/lib/utils';
import { formatRate } from '@/utils/format';

import type { ProductCategoryOption } from '../constants/categories';

/**
 * CategoryCard — a "Recommended for you" tile (M2.2).
 *
 * The approved UI shows the category label, a bank name, and its rate on
 * the subtle surface. When `onSelect` is supplied the tile becomes a real
 * button (never a div with a click handler); otherwise it renders as a
 * static panel.
 */
export interface CategoryCardProps {
  category: ProductCategoryOption;
  bankName: string;
  rate: number;
  onSelect?: () => void;
  className?: string;
}

export const CategoryCard = forwardRef<HTMLDivElement | HTMLButtonElement, CategoryCardProps>(
  ({ category, bankName, rate, onSelect, className }, ref) => {
    const content = (
      <>
        <span className="text-caption text-content-brand font-medium">{category.label}</span>
        <span className="text-body text-content font-medium">{bankName}</span>
        <span className="text-numeric text-content-brand tabular-nums">{formatRate(rate)}</span>
      </>
    );

    const base =
      'bg-surface-subtle rounded-card flex w-full flex-col gap-1 p-4 text-left transition duration-fast ease-out';

    if (onSelect) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={onSelect}
          className={cn(base, 'focus-ring hover:bg-surface-muted', className)}
        >
          {content}
        </button>
      );
    }

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={cn(base, className)}>
        {content}
      </div>
    );
  },
);
CategoryCard.displayName = 'CategoryCard';
