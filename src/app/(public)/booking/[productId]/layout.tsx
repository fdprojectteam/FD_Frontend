import { BookingDraftProvider } from '@/modules/booking/hooks/use-booking-draft';
import { BookingProductProvider } from '@/modules/booking/hooks/use-booking-product';

/**
 * Booking layout — the booking session's seat.
 *
 * Holds the two things every step of one booking shares: **the deposit being
 * booked** and **the draft being filled in**.
 *
 * ## One resolution per booking session
 *
 * The deposit is resolved here, **once**, and provided to every screen. It used
 * to be resolved on the Overview route while Investment Details and Nominee
 * each fell back to a hardcoded fixture — so a booking for one product could
 * have rendered another product's terms two screens later. There is now one
 * resolution and no prop to override it.
 *
 * An unresolvable `productId` takes the not-found boundary **before** any screen
 * renders, so no step of the journey can be reached for a deposit that does not
 * exist.
 *
 * The boundary lives at `booking/not-found.tsx`, one segment up, deliberately:
 * `notFound()` thrown inside a layout whose own segment holds the boundary can
 * re-enter that layout. Resolving to the parent segment cannot.
 *
 * ## Why both providers are here and not in `app/providers.tsx`
 *
 * They hold one module's state, and the platform composition point would give
 * them a lifetime far wider than the routes that need them (Document 09 §5).
 * Here the lifetime is exactly right — it spans every step of one product's
 * booking and ends when the user leaves it, which is what FR-CONF-002 requires:
 * configuration entered on Details is still there after a trip to Nominee and
 * back.
 *
 * **Keyed by `productId`.** Navigating from one product's booking to another
 * remounts both providers, so neither a draft nor a resolved deposit can leak
 * across products. Doing this with an effect instead would leave one render in
 * which the previous product's amount is on screen under the new product's name.
 */
export default async function BookingLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}>) {
  const { productId } = await params;

  /*
    The deposit is resolved by `BookingProductProvider`, on the client.

    It used to be resolved here. That worked only for the deposit backed by a
    local fixture: every other id resolves from the catalogue over HTTP, and the
    catalogue is served by MSW in the browser — a server component has no origin
    for the relative base URL and no worker to answer it, so the request failed
    with `ApiError`.

    This layout still owns the *session*: one provider per `productId`, keyed so
    a different product remounts it. Fail-closed moved with the resolution, not
    away from it.
  */
  /*
    **The draft sits outside the deposit's provider, and that ordering matters.**

    `BookingProductProvider` renders a skeleton *instead of* its children while
    the deposit is resolving. Nested inside it, the draft provider therefore
    unmounted on every cache miss — a refresh, or a return after the query's
    cache had been collected — taking the whole in-memory booking with it: the
    nominee's details, the application's typed answers, and any change not yet
    written to storage. The customer saw their work reset for no reason they
    could see.

    The draft depends on `productId` alone; it has never needed the deposit. So
    it is seated above, where a loading deposit cannot disturb it, and both
    remain keyed so a different product still starts a clean booking.
  */
  return (
    <BookingDraftProvider key={productId} productId={productId}>
      <BookingProductProvider productId={productId}>{children}</BookingProductProvider>
    </BookingDraftProvider>
  );
}
