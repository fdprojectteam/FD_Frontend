import type { Metadata } from 'next';

import { BookingOverviewScreen } from '@/modules/booking/components/booking-overview-screen';
import { ENTRY_AMOUNT_PARAM, parseEntryAmount } from '@/modules/booking/utils/entry-amount';

/**
 * Booking Overview route — step 1 of the booking journey (T3.1), served inside
 * the approved public shell by the `(public)` layout.
 *
 * A server component that owns metadata and composition only; all data access
 * lives in the screen component, exactly as on Home and Product Details.
 *
 * **Why `(public)` and not `(dashboard)`.** The approved screen is drawn inside
 * the authenticated sidebar shell, which does not exist — `(dashboard)/layout.tsx`
 * is still an empty passthrough with no navigation, no auth and no routes.
 * Building that shell is a navigation-architecture task in its own right, and
 * inventing it here would be the redesign this task forbids. The public shell
 * gives the screen the same header, footer, mobile tab bar and skip link that
 * the Marketplace entry points already use, and moving the route between groups
 * later is a file move.
 *
 * **The product id is a path segment**, so the screen is resumable and
 * shareable and the deposit under review is answerable from the URL alone —
 * the same choice `/marketplace/[productId]` makes. No booking session id
 * appears here because none exists yet: this is the screen on which the user
 * decides whether to start one.
 *
 * **Metadata is static** for the same reason it is on Product Details: MSW
 * intercepts `/api/v1/*` in the browser only and `src/app/api/` holds no route
 * handlers, so `generateMetadata` would have nothing to fetch. Per-product
 * titles arrive with a real API.
 *
 * **No Suspense boundary** — the entry amount is read from this page's own
 * `searchParams`, on the server, rather than through `useSearchParams` in a
 * client component. So there is still no prerender bailout to contain, and the
 * screen receives a plain number instead of having to parse a URL.
 */
export const metadata: Metadata = {
  title: 'Booking overview — FD Investment Platform',
  description:
    'Review the Fixed Deposit you selected — interest rate, tenure, investment limits, payout options and partner bank details — before starting your investment.',
};

export default async function BookingOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);

  /*
    The amount Goal-Based FD or Comparison already established, parsed at the
    boundary. `null` for anything missing or unusable, and `null` means the
    draft is left exactly as it is — Investment Details then asks for the amount
    in its own words. Nothing is defaulted here; see `entry-amount.ts`.
  */
  const entryAmount = parseEntryAmount(query[ENTRY_AMOUNT_PARAM]);

  /*
    No resolution here. The deposit is resolved **once** by the booking layout
    and read from the session by every screen, so the three steps cannot
    disagree about which product is being booked. An unresolvable id has already
    taken the not-found boundary before this page renders.
  */
  return <BookingOverviewScreen productId={productId} entryAmount={entryAmount} />;
}
