import { Check, Plus } from 'lucide-react';
import Link from 'next/link';
import { forwardRef } from 'react';

import { BankBadge } from '@/components/business/bank-badge';
import { InterestRateDisplay } from '@/components/business/interest-rate-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

import { BenefitChipList } from './benefit-chip-list';
import { REFERENCE_AMOUNT } from '../constants/filters';
import type { ProductFlagId, ProductSummary } from '../types/product';
import { formatProductTenure } from '../utils';

/**
 * FDProductCard — the approved Marketplace product card (M2.2).
 *
 * Presentation-only: every value arrives through props (estimated returns
 * are computed by ProductService in M2.1). It performs no fetching and no
 * calculation, and it never calls the router.
 *
 * The card is deliberately not a link: the actions carry the affordance, so
 * there is no nested-interactive trap and no ambiguous click target.
 *
 * **"View details" is a real `<Link>`** (M2.6, T2.6.8), not a callback into
 * `router.push`. Opening a product is a navigation, so it should behave like
 * one: middle-click, ⌘/Ctrl-click, "open in new tab", and Next's prefetch all
 * work, and the destination is visible in the status bar before clicking.
 * Routing it through a handler would also have put a `router.push` in
 * HomeScreen, breaking the single-URL-writer invariant (I1) for a navigation
 * that is not URL *state* at all. Compare stays a callback because it mutates
 * selection rather than navigating.
 */
const FLAG_LABEL: Record<ProductFlagId, string> = {
  'highest-rate': 'Highest Rate',
  'high-returns': 'High Returns',
  'short-term': 'Short-Term',
  'limited-time': 'Limited Time',
};

const BENEFITS_ON_CARD = 2;

export interface FDProductCardProps {
  product: ProductSummary;
  onCompare?: (productId: string) => void;
  /** Whether this product is currently in the comparison selection. */
  isComparing?: boolean;
  /** True when the comparison limit is reached and this card is not selected. */
  compareDisabled?: boolean;
  className?: string;
}

export const FDProductCard = forwardRef<HTMLElement, FDProductCardProps>(
  ({ product, onCompare, isComparing = false, compareDisabled = false, className }, ref) => {
    const flag = product.flags[0];
    const headingId = `product-${product.id}-title`;

    return (
      <article ref={ref} aria-labelledby={headingId} className={cn('h-full', className)}>
        {/*
          The *card* carries the selection, not only the button in its corner.
          The first selection previously changed one button's variant —
          `secondary` to `outline`, two bordered controls of the same size in
          the same place — and nothing else on the page, because the entry bar
          appears at two. The ring is what makes the first selection legible
          without changing the product rule.
        */}
        <Card
          className={cn(
            'flex h-full flex-col',
            isComparing && 'border-border-primary ring-border-primary ring-1',
          )}
        >
          <CardHeader className="gap-4">
            {flag ? <Badge className="w-fit">{FLAG_LABEL[flag]}</Badge> : null}

            <div className="flex items-start justify-between gap-4">
              <BankBadge bank={product.bank} />
              <InterestRateDisplay rate={product.interestRate} />
            </div>

            <h3 id={headingId} className="text-h3 text-content">
              {product.bank.name}
            </h3>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4">
            <dl className="flex gap-8">
              <div className="flex flex-col gap-1">
                <dt className="text-caption text-content-muted">Tenure</dt>
                <dd className="text-body text-content font-medium">
                  {formatProductTenure(product)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-caption text-content-muted">Min. investment</dt>
                <dd className="text-body text-content font-medium tabular-nums">
                  {formatCurrency(product.minInvestment)}
                </dd>
              </div>
            </dl>

            <div className="bg-surface-muted flex flex-col gap-1 rounded-md p-4">
              <span className="text-caption text-content-muted">
                {`Estimated returns on ${formatCurrency(REFERENCE_AMOUNT)}`}
              </span>
              <span className="text-body-lg text-content font-medium tabular-nums">
                {formatCurrency(product.estimatedReturns.maturityValue)}
              </span>
            </div>

            {product.benefits.length > 0 ? (
              <BenefitChipList benefits={product.benefits} max={BENEFITS_ON_CARD} />
            ) : null}
          </CardContent>

          <CardFooter className="gap-3">
            <Button asChild variant="secondary" className="flex-1">
              {/*
                The accessible name carries the product, because a page of
                cards otherwise offers a dozen links all called "View details"
                (WCAG 2.4.4). It contains the visible text verbatim, so voice
                control still works (WCAG 2.5.3) — the same treatment the
                Compare action already uses.
              */}
              <Link
                href={ROUTES.product(product.id)}
                aria-label={`View details for ${product.bank.name}`}
              >
                View details
              </Link>
            </Button>
            <Button
              variant={isComparing ? 'outline' : 'secondary'}
              className="flex-1"
              aria-pressed={isComparing}
              aria-label={`Compare ${product.bank.name}`}
              disabled={compareDisabled && !isComparing}
              /*
                The icon carries the state; the label does not. The accessible
                name and the visible text stay "Compare {bank}" — `aria-pressed`
                already announces the state, and renaming the control would buy
                nothing while breaking every journey that locates a card by it.
              */
              leftIcon={isComparing ? <Check className="size-4" /> : <Plus className="size-4" />}
              onClick={() => onCompare?.(product.id)}
            >
              Compare
            </Button>
          </CardFooter>
        </Card>
      </article>
    );
  },
);
FDProductCard.displayName = 'FDProductCard';
