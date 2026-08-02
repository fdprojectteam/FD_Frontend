import { BankBadge } from '@/components/business/bank-badge';
import { InterestRateDisplay } from '@/components/business/interest-rate-display';

import type { ProductSummary } from '../types/product';

/**
 * ProductHeader — the approved product-details header card (M2.6, T2.6.4).
 *
 * Presentation-only (invariants I3, A3): it receives a product and renders it.
 *
 * Carries the page's single `h1` — the bank name is the most prominent text on
 * the approved screen and the only sensible candidate (plan §2.7.5, A1).
 *
 * **The two breakpoints differ in more than layout**, so each is rendered
 * explicitly rather than restyled with CSS (plan §2.7.2):
 *
 *   desktop (≥ md)  monogram 56px · identity left, rate right · caption
 *                   "per annum" stacked beneath the figure
 *   mobile  (< md)  monogram 40px · identity row, rate below it · caption
 *                   "p.a." inline beside the figure
 *
 * Size and caption text cannot both be expressed by one element with
 * responsive classes, so the monogram and the rate each appear twice with
 * `hidden` / `md:hidden`. `hidden` is `display: none`, which removes the
 * element from the accessibility tree — so exactly one of each pair is
 * announced at any viewport, and the rate is never read twice.
 */
export interface ProductHeaderProps {
  product: ProductSummary;
}

export function ProductHeader({ product }: ProductHeaderProps) {
  return (
    <header className="border-border-default bg-surface-card rounded-card flex flex-col gap-4 border p-6 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="flex items-center gap-4">
        <BankBadge bank={product.bank} size="md" className="md:hidden" />
        <BankBadge bank={product.bank} size="lg" className="hidden md:flex" />

        <div className="flex flex-col gap-1">
          <h1 className="text-h3 text-content">{product.bank.name}</h1>
          <p className="text-body text-content-muted font-medium">{product.name}</p>
        </div>
      </div>

      <InterestRateDisplay rate={product.interestRate} size="lg" className="hidden md:flex" />
      <InterestRateDisplay
        rate={product.interestRate}
        size="lg"
        layout="inline"
        caption="p.a."
        className="md:hidden"
      />
    </header>
  );
}
