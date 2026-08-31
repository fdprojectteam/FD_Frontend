import { Building2, Landmark, TrendingUp } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TrustIndicator, TrustIndicatorId } from '@/types/finance';

/**
 * A single attribute the catalogue records about a bank or deposit — RBI
 * Regulated, ₹5L DICGC Insured, AAA Rating.
 *
 * ## Why these no longer look verified
 *
 * They used to render as `success` badges — green text, a bordered pill, a
 * **shield with a tick** on two of them and a **star** on the third. That is
 * the visual language of *we checked this*, and this platform has checked none
 * of it: the ratings and the regulatory labels come from a static fixture, and
 * the whole set is attached to every product by `buildProductDetails` rather
 * than being a property of any particular bank.
 *
 * So the presentation was making a claim the data could not support, and it was
 * doing it in the strongest way available — colour and iconography, which are
 * read before the words are. They are now neutral outline badges with marks
 * that *classify* rather than certify: a bank building, a public institution,
 * a rating trend. `TrustBadgeRow` states where they came from.
 *
 * The labels themselves are unchanged. They are what the catalogue says, and
 * the fix for unverified data is to stop implying verification, not to hide the
 * data.
 *
 * Composed from the platform Badge; icons are decorative, so the label always
 * carries the meaning (Document 14 §11).
 */
const ICONS: Record<TrustIndicatorId, typeof Landmark> = {
  'rbi-regulated': Landmark,
  'dicgc-insured': Building2,
  'aaa-rating': TrendingUp,
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
        variant="outline"
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
