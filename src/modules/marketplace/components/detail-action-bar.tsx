import { ArrowRight, Check, Plus } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * DetailActionBar — the approved product-details action bar (M2.6, T2.6.7).
 *
 * Presentation-only: selection state arrives as props and the toggle is
 * reported upward.
 *
 * **Width and position** (plan §2.6). The bar spans the full page container —
 * the only element on the screen wider than the 920 px reading column — with a
 * divider above it. Desktop right-aligns the pair; mobile lays them side by
 * side across the full width and pins the bar to the viewport (D7).
 *
 * **The label shortens on mobile**, exactly as drawn: "Add to Compare" becomes
 * "Compare". Both spans are rendered and swapped with `hidden` / `md:inline`,
 * which is `display: none` — so only one is in the accessibility tree and the
 * button is never announced twice.
 *
 * **The selected state is visible, not only announced.** Until now the only
 * thing that changed on press was `aria-pressed`: same variant, same icon, same
 * label. The toggle *worked* — the store updated and Home reflected it — but on
 * this screen nothing moved, so the control read as broken. It now swaps icon
 * and label the way the product card does, which is the whole difference
 * between "no feedback" and "no effect".
 *
 * **Continue to Booking is inert.** Booking is Phase 3 and has no route, so the
 * button follows the established pattern for an unbuilt destination: visually
 * identical, `aria-disabled`, no href (the same treatment as "How it works" on
 * Home). It carries **no state** — the calculator's amount stays local
 * (decision D3), and what crosses into booking is a Phase 3 decision, not
 * something to smuggle through now.
 */
export interface DetailActionBarProps {
  /** True when this product is already selected for comparison. */
  isComparing: boolean;
  /** True when the comparison is full and this product is not in it. */
  compareDisabled: boolean;
  /** The Booking Overview route when Booking has data for this product. */
  bookingHref?: Route;
  onCompare: () => void;
}

export function DetailActionBar({
  isComparing,
  compareDisabled,
  bookingHref,
  onCompare,
}: DetailActionBarProps) {
  return (
    <div className="border-border-default bg-surface-page sticky bottom-0 border-t md:static md:border-t-0">
      <div className="container-page flex items-center justify-end gap-3 py-4 md:pt-8">
        <Button
          variant={isComparing ? 'outline' : 'secondary'}
          size="lg"
          aria-pressed={isComparing}
          disabled={compareDisabled}
          onClick={onCompare}
          className="flex-1 md:flex-none"
        >
          {isComparing ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Added to Compare</span>
              <span className="md:hidden">Added</span>
            </>
          ) : (
            <>
              <Plus aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Add to Compare</span>
              <span className="md:hidden">Compare</span>
            </>
          )}
        </Button>

        {bookingHref ? (
          <Button asChild variant="primary" size="lg" className="flex-1 md:flex-none">
            <Link href={bookingHref}>
              Continue to Booking
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled
            aria-label="Booking unavailable for this product"
            title="Booking is not available for this product yet"
            className="flex-1 md:flex-none"
          >
            Booking unavailable
          </Button>
        )}
      </div>
    </div>
  );
}
