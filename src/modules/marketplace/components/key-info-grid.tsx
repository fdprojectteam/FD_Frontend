import { formatCurrency, formatTenure } from '@/utils/format';

import { INTEREST_TYPE_LABELS, PAYOUT_LABELS } from '../constants/product-labels';
import type { ProductSummary } from '../types/product';

/**
 * KeyInfoGrid — the approved "Key information" cards (M2.6, T2.6.4):
 * Tenure · Interest Type · Minimum Investment · Interest Payout.
 *
 * Presentation-only. Four across from `md`, 2 × 2 below (plan §2.7.2).
 *
 * **`AmountDisplay` is deliberately not used here.** The approved screen draws
 * four visually identical cells, and only one of them holds money. Rendering
 * that one through `AmountDisplay` and the other three by hand would give the
 * money cell a different weight and spacing from its neighbours — the opposite
 * of what the design shows. The shared *formatting rule* is still honoured:
 * the value comes from `formatCurrency`, so Indian digit grouping cannot
 * diverge. `AmountDisplay` is used in T2.6.5's results row, where a labelled
 * money value is exactly what the design draws.
 */
export interface KeyInfoGridProps {
  product: ProductSummary;
}

function KeyInfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border-default bg-surface-card rounded-card flex flex-col gap-1 border p-4">
      <span className="text-caption text-content-muted">{label}</span>
      <span className="text-body-lg text-content font-semibold">{value}</span>
    </div>
  );
}

export function KeyInfoGrid({ product }: KeyInfoGridProps) {
  const cells = [
    { label: 'Tenure', value: formatTenure(product.tenureMonths) },
    { label: 'Interest Type', value: INTEREST_TYPE_LABELS[product.interestType] },
    { label: 'Minimum Investment', value: formatCurrency(product.minInvestment) },
    { label: 'Interest Payout', value: PAYOUT_LABELS[product.payout] },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cells.map((cell) => (
        <KeyInfoCell key={cell.label} label={cell.label} value={cell.value} />
      ))}
    </div>
  );
}
