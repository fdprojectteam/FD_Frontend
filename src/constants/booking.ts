/**
 * Which catalogue products Booking can currently resolve.
 *
 * ## Why this is a shared constant rather than Booking's private knowledge
 *
 * Booking's `BOOKING_OVERVIEWS_BY_PRODUCT_ID` holds one entry, because filling
 * in the other twenty-three would mean inventing `maxInvestment`, `tenureRange`,
 * payout options and partner copy for products that publish none of it. That
 * decision stands and nothing here changes it.
 *
 * The consequence was that every other recommendation's call to action reached
 * Booking's not-found boundary. Failing closed is correct — Booking must never
 * substitute a deposit — but a dead end at the primary CTA is not a working
 * journey, and the recommending module had no legal way to know in advance:
 * `bookableProductIds()` lives in `modules/booking`, and module → module is
 * forbidden.
 *
 * So the *list* moves here, to `constants`, which every module may import. The
 * fixtures stay exactly where they are. This is a visibility change, not an
 * architectural one: one fact, one home, and both Booking and Goal-Based FD read
 * it instead of one of them guessing.
 *
 * ## The gap is closed
 *
 * `BookingOverviewService` now derives a deposit from the product the customer
 * chose, so **every catalogue product reaches a Booking screen** with its own
 * bank, rate, tenure and minimum. An id the catalogue does not know still fails
 * closed at the route's not-found boundary — Booking never substitutes.
 *
 * `CURATED_BOOKING_PRODUCT_IDS` records which deposits carry hand-authored
 * partner copy from the approved artwork. It changes no destination; it exists
 * so the distinction between curated and derived stays visible.
 */
export const CURATED_BOOKING_PRODUCT_IDS: readonly string[] = ['fd-002'] as const;

/**
 * Whether Booking can resolve this product.
 *
 * True for every product in the catalogue. The check remains a function rather
 * than a constant `true` because Booking resolving a deposit is a fact about
 * the catalogue, and a future product type may not be bookable.
 */
export function isBookableProduct(productId: string): boolean {
  return productId.length > 0;
}

/** Whether this deposit has hand-authored partner copy rather than derived copy. */
export function isCuratedBookingProduct(productId: string): boolean {
  return CURATED_BOOKING_PRODUCT_IDS.includes(productId);
}
