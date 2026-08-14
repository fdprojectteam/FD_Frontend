import { BOOKING_OVERVIEWS_BY_PRODUCT_ID } from '../fixtures/booking-overview';
import type { BookingOverview } from '../types/booking';

/**
 * Product → booking deposit resolution.
 *
 * The one function that turns the `productId` in the URL into the deposit the
 * booking screens render. Before this existed, `/booking/fd-001/overview` and
 * `/booking/fd-999/overview` rendered the same hardcoded Axis deposit, and the
 * id in the path was decoration.
 *
 * ## Why it lives in Booking
 *
 * The mapping is Booking's own: `BookingOverview` is a Booking type, and the
 * module boundary forbids importing from `modules/marketplace`. Resolving
 * against the Marketplace catalogue would need either an illegal import or a
 * copy of the catalogue — and, separately, would change every figure on the
 * approved Booking screens, because no Marketplace product matches them (see
 * `booking-overview.ts`).
 *
 * ## Fails safely
 *
 * An unknown id returns `null`, never a fallback. A fallback is exactly the
 * defect being fixed: silently rendering *some* deposit for a product nobody
 * asked for is worse than saying the deposit does not exist, because the user
 * would go on to book it.
 *
 * Pure and React-free, so "the id is actually used" is assertable without
 * rendering anything.
 */
export function resolveBookingOverview(productId: string): BookingOverview | null {
  /*
    `Object.hasOwn` rather than a truthiness check on the lookup: a productId of
    `"constructor"` or `"toString"` would otherwise resolve to something from
    `Object.prototype` and be returned as a deposit.
  */
  if (!Object.hasOwn(BOOKING_OVERVIEWS_BY_PRODUCT_ID, productId)) return null;

  return BOOKING_OVERVIEWS_BY_PRODUCT_ID[productId] ?? null;
}

/** The product ids Booking can currently resolve. */
export function bookableProductIds(): string[] {
  return Object.keys(BOOKING_OVERVIEWS_BY_PRODUCT_ID);
}
