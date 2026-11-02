import type { Route } from 'next';

import { isBookableProduct } from '@/constants/booking';
import { ROUTES } from '@/constants/routes';

import type { Recommendation } from '../types/recommendation';

/**
 * Goal-Based FD → Booking handoff (`06-architecture.md` §2, §4;
 * `09-api-contract.md` §1 — *"The API does NOT own the final booking
 * transaction"*).
 *
 * ## The contract is one field
 *
 * ```
 * Goal-Based FD  →  productId  →  /booking/{productId}/overview
 * ```
 *
 * `08-data-model.md` draws the arrow into Booking labelled `productId` and
 * nothing else, and this file is that arrow. The `BookingHandoff` type has two
 * fields, both derived from one — so there is no shape in which a rate or a
 * maturity *could* travel, which is a stronger guarantee than a rule saying they
 * must not.
 *
 * ## Why the recommendation's own figures stay behind
 *
 * A recommendation says *"at today's published rate, ₹1,00,000 in this product
 * would mature to ₹1,07,291"*. That is an **illustration produced by the rule
 * engine**. Booking's job is to state the terms the customer is actually
 * offered, and it resolves them itself — `resolveRate` against the deposit it
 * loads, at the moment of booking.
 *
 * Passing the engine's quote across would create a second authority for the same
 * number, and the two would agree right up until a rate changed between the
 * recommendation and the booking. At that point the customer would be shown a
 * figure the bank had stopped honouring, on the screen where they commit money.
 * The engine recommends; Booking prices. Neither does the other's job.
 *
 * ## Where a recommendation goes when Booking cannot resolve it
 *
 * Booking holds real data for one product. For every other recommendation the
 * old handoff produced a link to a screen that would take its not-found
 * boundary — safe, because Booking never substitutes a deposit, but a dead end
 * at the one CTA the whole planner exists to produce.
 *
 * So the destination is now chosen: **Booking when the deposit is bookable, the
 * product's Marketplace page when it is not.** Both are real screens serving the
 * same real product; nothing is invented and no figure changes. The product page
 * is where the customer reads the full terms and continues from — which is the
 * path a Marketplace user already takes.
 *
 * `isBookableProduct` reads a shared constant rather than Booking's fixture, so
 * this is not a copy of Booking's catalogue knowledge — it is the same fact, in
 * the one place both modules may see it.
 */

/**
 * Everything that crosses into Booking.
 *
 * Two fields, one of them derived from the other. Deliberately **not** built on
 * `Recommendation`, `RateQuote` or `MaturityResult`: a type that cannot express
 * a rate cannot leak one.
 */
export interface BookingHandoff {
  productId: string;
  /**
   * The amount this recommendation was evaluated for.
   *
   * The customer's own figure, not the engine's. It is what the planner asked
   * them for and what every candidate was filtered against, so Booking prefills
   * it rather than asking the same question a second time.
   *
   * This does **not** widen the rule above. A quote or a maturity would be a
   * platform-computed price crossing the boundary, and Booking must resolve
   * those itself. An amount is an input the customer supplied; Booking still
   * validates it against the product's minimum, maximum and increment, and
   * still refuses it if the product would.
   */
  amount: number;
  /** The destination, built through `ROUTES`. Never an inline string. */
  href: Route;
  /**
   * Whether `href` reaches Booking.
   *
   * Exposed so the CTA can say what it actually does. A button labelled
   * "Continue with this FD" that lands on a product page is a small lie, and the
   * whole module is built on not telling those.
   */
  bookable: boolean;
}

/**
 * The entry point for a recommended product.
 *
 * Takes a **`productId`, not a `Recommendation`** — the narrowest signature that
 * does the job, so no caller can hand this function a figure it might be tempted
 * to forward.
 */
export function bookingHandoffHref(productId: string, amount?: number): Route {
  /*
    The amount rides along only into Booking. The Marketplace product page has
    its own calculator with its own default, and seeding it from a plan would
    make the recommendation look like a decision the customer had made there.
  */
  return isBookableProduct(productId)
    ? ROUTES.bookingOverview(productId, amount)
    : ROUTES.product(productId);
}

/**
 * The handoff for one recommendation.
 *
 * Reads exactly one field off the recommendation. Everything else the engine
 * computed — quote, maturity, target, reasons — stays on the recommendation
 * screen, where it is an explanation rather than a term of business.
 */
export function toBookingHandoff(recommendation: Recommendation): BookingHandoff {
  /*
    Two fields read, both of them the customer's own answers: which product, and
    for how much. `quote`, `maturity`, `target` and `reasons` stay on the
    recommendation screen, where they are an explanation rather than a term of
    business.
  */
  const { productId, principal, product } = recommendation;
  /* Legacy test and integration callers may carry only id + principal. */
  const bookable = product?.dataStatus !== 'illustrative' && isBookableProduct(productId);

  return {
    productId,
    amount: principal,
    href: bookable ? ROUTES.bookingOverview(productId, principal) : ROUTES.product(productId),
    bookable,
  };
}
