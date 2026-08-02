'use client';

import { X } from 'lucide-react';

import { BankBadge } from '@/components/business/bank-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';

import type { ProductDetails } from '../types/product';
import { removeLabel } from '../utils/compare-labels';

/**
 * CompareColumnHeader — one product column's header (M2.7, T2.7.4).
 *
 * The approved screen shows the **bank**, not the product name: monogram or
 * logo, the bank's name, and a × to drop the column.
 *
 * **One layout, both presentations** (M2.8 design pass — supersedes the two
 * layouts of T2.7.5/F4). The approved design puts the badge, the name and the
 * remove control on a single line in the table *and* on the card, so the
 * `layout` prop had one live value and one dead branch. It is gone; what is
 * left is the arrangement both views actually use.
 *
 * *(Historic note, T2.7.5, decision F4.)* The desktop table
 * stacks — badge and × on the top line, name beneath; the mobile card puts all
 * three on one line. Same content, two arrangements, which is exactly what
 * `ProductHeader` and `InterestRateDisplay` already solve with a `layout`
 * variant, and what the standing "additive variants only" rule expects. A
 * second card-specific header would duplicate the badge/name composition and,
 * worse, the remove control's accessible name.
 *
 * Presentation-only (I3). Removal is reported upward; on this route intent
 * writes the URL and never the store (C4 rule 1), and this component knows
 * about neither.
 */
export interface CompareColumnHeaderProps {
  product: ProductDetails;
  onRemove: (productId: string) => void;
  /** The entered deposit amount does not reach this product's minimum. */
  belowMinimum?: boolean;
}

export function CompareColumnHeader({
  product,
  onRemove,
  belowMinimum = false,
}: CompareColumnHeaderProps) {
  /*
    M2.8 — a removable chip rather than a loose glyph. The 44px target is
    unchanged (`size="icon"`); what changes is that the control reads as a
    deliberate affordance: a muted circle that fills on hover, so it is
    discoverable without competing with the bank name beside it.
  */
  const removeButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={removeLabel(product.bank.name)}
      onClick={() => onRemove(product.id)}
      className="bg-surface-muted/60 text-content-muted hover:text-content shrink-0 rounded-full"
    >
      <X aria-hidden="true" className="size-4" />
    </Button>
  );

  return (
    <div className="flex items-center gap-3">
      <BankBadge bank={product.bank} decorative />
      <div className="flex flex-1 flex-col items-start gap-1">
        <p className="text-body-lg text-content leading-snug font-semibold text-balance">
          {product.bank.name}
        </p>
        {/*
          Stated where the product is named, not beside the figures: the returns
          below are correct arithmetic for the amount entered — what is wrong is
          that this deposit cannot be opened with it.
        */}
        {belowMinimum ? (
          <Badge variant="outline" size="sm">
            Below minimum
          </Badge>
        ) : null}
      </div>
      {removeButton}
    </div>
  );
}
