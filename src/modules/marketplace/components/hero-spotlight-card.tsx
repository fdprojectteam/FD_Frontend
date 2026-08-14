import { formatCurrency, formatRate } from '@/utils/format';

import { REFERENCE_AMOUNT } from '../constants/filters';
import type { ProductSummary } from '../types/product';
import { formatProductTenure } from '../utils';

/**
 * HeroSpotlightCard — the brand panel from the approved Home hero (M2.3):
 * "Highest rate available today", the rate, the bank and tenure, and what
 * the reference amount grows to.
 *
 * Presentation-only: the product arrives already selected and its returns
 * already computed (see marketplace-home-query-strategy.md).
 *
 * Hidden below the md breakpoint — the approved mobile screen does not
 * show this panel (approved decision D1).
 */
export interface HeroSpotlightCardProps {
  product: ProductSummary;
}

export function HeroSpotlightCard({ product }: HeroSpotlightCardProps) {
  return (
    <div className="bg-surface-brand text-content-on-brand rounded-card hidden flex-col gap-6 p-8 md:flex">
      <div className="flex flex-col gap-2">
        <span className="text-caption opacity-70">Highest rate available today</span>
        <span className="text-h1 font-bold tabular-nums">{formatRate(product.interestRate)}</span>
        <span className="text-body">
          {product.bank.name} · {formatProductTenure(product)}
        </span>
      </div>

      <div className="flex flex-col gap-1 border-t border-current/20 pt-6">
        <span className="text-caption opacity-70">
          {`${formatCurrency(REFERENCE_AMOUNT)} grows to`}
        </span>
        <span className="text-h2 font-bold tabular-nums">
          {formatCurrency(product.estimatedReturns.maturityValue)}
        </span>
      </div>
    </div>
  );
}
