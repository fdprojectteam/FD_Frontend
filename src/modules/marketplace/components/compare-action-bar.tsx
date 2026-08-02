import { ArrowRight } from 'lucide-react';
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
 * **Proceed to Booking is inert** (D3, D-A5) — `aria-disabled`, no `href`, no
 * state — the established treatment for an unbuilt destination ("How it works"
 * on Home, "Continue to Booking" on Details). What crosses into booking is a
 * Phase 3 decision, not something to smuggle through now.
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
export function CompareActionBar() {
  return (
    <div
      data-compare-actions=""
      className="border-border-default bg-surface-page sticky bottom-0 border-t md:static md:border-t-0"
    >
      <div className="container-page flex items-center justify-end gap-3 py-4 md:pt-8">
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

        <Button variant="primary" size="lg" aria-disabled="true" className="flex-1 md:flex-none">
          Proceed to Booking
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
