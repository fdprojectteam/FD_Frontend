import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * Not-found boundary for the booking routes.
 *
 * Rendered when `booking/[productId]/layout.tsx` calls `notFound()` because
 * `resolveBookingOverview` could not resolve the `productId` in the path.
 *
 * Sited **above** `[productId]` on purpose: the throw happens in that segment's
 * layout, and a layout's throw is caught by the parent segment's boundary
 * rather than its own. Resolving here also guarantees the failing layout is
 * never re-entered.
 *
 * **This is the point of the change.** Until now every booking URL rendered the
 * same hardcoded deposit, so a wrong or stale product id silently produced a
 * bookable screen for a product nobody had chosen. Saying the deposit is
 * unavailable is the only safe answer — the alternative is a user completing a
 * booking against the wrong product.
 *
 * Sited at `[productId]` rather than inside `overview/` so every booking step
 * under the same product segment shares one boundary.
 *
 * Copy follows the Marketplace not-found pattern; the approved screens show no
 * 404 state, so the wording is new and worth confirming with design.
 */
export default function BookingNotFound() {
  return (
    <div className="container-page flex flex-col items-start gap-6 py-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-content">This deposit isn’t available</h1>
        <p className="text-body text-content-muted max-w-prose">
          We couldn’t find the Fixed Deposit you were trying to book. The link may be out of date,
          or the product may no longer be offered. Nothing has been booked.
        </p>
      </div>

      <Button asChild>
        <Link href={ROUTES.home}>Browse Fixed Deposits</Link>
      </Button>
    </div>
  );
}
