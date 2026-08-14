'use client';

import { ArrowLeft, ArrowRight, Bookmark } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * BookingStepActions — the action row that closes every booking step (T3.1).
 *
 * One component for all eight screens: a way back, an optional Save for Later,
 * and the primary advance. Written generically now because the alternative is
 * eight footers that drift — the Review step's "Confirm" and the Payment step's
 * "Pay now" are this component with a different label, not a different layout.
 *
 * **Deliberately not sticky.** Every other bottom-anchored bar in this
 * application is `sticky bottom-0`, and on mobile they sit *underneath*
 * `MobileTabBar`, which is `fixed bottom-0` at the same z-index — the occlusion
 * defect raised in the pre-Booking review and still listed as an open manual
 * check. A static row at the end of the flow cannot occlude anything, needs no
 * safe-area inset, and is what the approved screen shows. When the layout gains
 * a coordinated bottom stack, this component is where a sticky variant belongs.
 *
 * **Back is a link, Continue is a button.** Back navigates to a place that
 * exists, so it is a real `<Link>` — middle-click, long-press and open-in-new-tab
 * all work, and the destination is visible in the status bar. Continue performs
 * an action (it will create a booking session), so it is a button even while
 * that action is still a callback the page supplies.
 *
 * Order in the DOM is Back → Save → Continue, which is both the reading order
 * and the tab order. `flex-col-reverse` below `md` puts the primary action at
 * the top of the stacked group where a thumb reaches it, without changing that
 * order — the same technique `DialogFooter` already uses.
 */
export interface BookingStepActionsProps {
  /** Where the secondary "back" affordance goes. */
  backHref: Route;
  backLabel?: string;
  continueLabel?: string;
  /** Disables the primary action, e.g. while the product is being validated. */
  continueDisabled?: boolean;
  onContinue: () => void;
  /** Omitted until draft persistence is approved; the control is hidden, not inert. */
  onSaveForLater?: () => void;
}

export function BookingStepActions({
  backHref,
  backLabel = 'Back',
  continueLabel = 'Continue',
  continueDisabled = false,
  onContinue,
  onSaveForLater,
}: BookingStepActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
      <Button asChild variant="secondary">
        <Link href={backHref}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      </Button>

      <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center">
        {onSaveForLater ? (
          <Button variant="secondary" onClick={onSaveForLater}>
            <Bookmark aria-hidden="true" className="size-4" />
            Save for Later
          </Button>
        ) : null}

        <Button variant="primary" disabled={continueDisabled} onClick={onContinue}>
          {continueLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
