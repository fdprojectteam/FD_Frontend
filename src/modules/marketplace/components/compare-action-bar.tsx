import { ArrowRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * CompareActionBar — the approved bottom action row (M2.7, T2.7.7).
 *
 * **It owns nothing** (D-A2). No state, no memo, no store, no router, no query:
 * Back is a `<Link>` and Proceed is inert, so there is nothing to decide. It
 * takes no props today because there is nothing to give it.
 *
 * The rule is *ownership*, not the signature. A prop is not forbidden — when
 * Booking arrives and needs an `onProceed` or a `disabled`, receiving one and
 * reporting upward is exactly what a presentation component does (I3). What
 * must not happen is this bar acquiring the **authority**: deciding whether
 * booking is available, reading the selection, or holding state about it.
 * `CompareScreen` will own enablement and navigation and pass the result down
 * (D-A5), so the boundary that is trivially held today is what keeps holding
 * then.
 *
 * **Back is a real link, never `router.back()`** (D-A4): a user arriving from a
 * shared `?ids=` link has no history, and `back()` would take them off the site.
 *
 * **Proceed to Booking is now real, and still owns nothing** (D-A5 as written).
 * It receives a `bookingHref` and renders a link, or receives none and stays
 * inert with `aria-disabled`. Which product that href names, and whether one has
 * been chosen at all, is `CompareScreen`'s judgement — this bar never reads the
 * selection. That is the boundary the component was built to hold, now being
 * held for the case it was written for.
 *
 * The destination is `ROUTES.bookingOverview(productId)` — **the same route
 * Goal-Based FD and Product Details lead to**. Comparison is an entry point into
 * the one booking flow, not a booking flow of its own, so no route, component or
 * state here is Comparison-specific.
 *
 * **Sticky below `md`, static from `md`** (D-A7). The technique is copied from
 * `DetailActionBar`, not the component — the two bars carry different buttons.
 * `sticky` rather than `fixed` is what satisfies checklist E5: a sticky element
 * keeps its place in the flow, so it cannot occlude the last card, and no
 * reserved padding has to be guessed.
 *
 * `data-compare-actions` gives the journeys a scope (D-A8). The bar sits
 * outside both `data-compare-view` containers, so neither view scope reaches
 * it, and a document-wide selector would also match the *top* back link — both
 * lead to `ROUTES.home`.
 */
export interface CompareActionBarProps {
  /** Booking Overview for the chosen product. Absent means nothing is chosen. */
  bookingHref?: Route;
}

export function CompareActionBar({ bookingHref }: CompareActionBarProps) {
  return (
    <div
      data-compare-actions=""
      className="border-border-default bg-surface-page sticky bottom-0 border-t md:static md:border-t-0"
    >
      <div className="container-page flex flex-wrap items-center justify-end gap-3 py-4 md:pt-8">
        {bookingHref ? null : (
          <p id="compare-booking-hint" className="text-caption text-content-muted mr-auto">
            Choose a Fixed Deposit above to continue.
          </p>
        )}
        <Button asChild variant="secondary" size="lg" className="flex-1 md:flex-none">
          {/*
            The label shortens inside one element (D-A6), matching the h1 and
            the picker trigger on this screen. `hidden md:inline` is
            `display: none`, so only one string is ever in the accessibility
            tree and the control is never announced twice.
          */}
          <Link href={ROUTES.home}>
            Back<span className="hidden md:inline"> to Marketplace</span>
          </Link>
        </Button>

        {bookingHref ? (
          <Button asChild variant="primary" size="lg" className="flex-1 md:flex-none">
            <Link href={bookingHref}>
              Proceed to Booking
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : (
          /*
            Nothing selected yet. Inert rather than absent so the approved
            layout is intact, and `aria-disabled` rather than `disabled` so the
            control stays reachable and its hint is announced.
          */
          <Button
            variant="primary"
            size="lg"
            aria-disabled="true"
            aria-describedby="compare-booking-hint"
            className="flex-1 md:flex-none"
          >
            Proceed to Booking
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
