import {
  DEFAULT_PAYOUT_OPTION,
  PAYOUT_OPTION_DESCRIPTIONS,
  PAYOUT_OPTION_LABELS,
  PAYOUT_OPTION_ORDER,
} from '../constants/payout-options';
import type { DepositTerms } from '../types/booking';
import type { PayoutOptionId } from '../types/draft';

/**
 * Which payout options this product offers (T3.2.9).
 *
 * Spec 21b §D: *"Unavailable options should not be displayed."* So the platform
 * publishes five, the product declares which of them it supports, and this
 * module is the one place the two meet.
 *
 * The demo product supports three — At Maturity, Monthly, Quarterly — which is
 * exactly what the approved artwork draws. That the artwork shows three while
 * the platform vocabulary holds five is not a conflict: five is what the
 * platform can express, three is what this deposit sells.
 *
 * Pure and React-free, so "the group offers only what the product supports" is
 * assertable without rendering anything.
 */

export interface PayoutOption {
  id: PayoutOptionId;
  label: string;
  description: string;
}

/**
 * The options to render, in the platform's order.
 *
 * Ordered by `PAYOUT_OPTION_ORDER` rather than by the product's own array, so
 * two products supporting the same three options present them the same way. A
 * control whose options reshuffle between products is a control users stop
 * reading.
 *
 * Unknown ids in `supportedPayouts` are dropped rather than rendered: the list
 * will eventually arrive from an API, and an option the platform cannot price
 * or label must not become a card with `undefined` on it.
 */
export function resolvePayoutOptions(terms: DepositTerms): PayoutOption[] {
  const supported = new Set(terms.supportedPayouts);

  return PAYOUT_OPTION_ORDER.filter((id) => supported.has(id)).map((id) => ({
    id,
    label: PAYOUT_OPTION_LABELS[id],
    description: PAYOUT_OPTION_DESCRIPTIONS[id],
  }));
}

export function isSupportedPayout(terms: DepositTerms, payoutOption: PayoutOptionId): boolean {
  return terms.supportedPayouts.includes(payoutOption);
}

/**
 * The option to select when a booking has not chosen one.
 *
 * `at-maturity` when the product offers it, otherwise the first option it does
 * offer. **Never `null` for a product with options**, because a payout mode that
 * has not been chosen still has to be priced — `calculateReturns` cannot answer
 * "what is this worth" without one, and leaving it unset would mean the returns
 * strip stayed empty for a user who never opened the control.
 *
 * Returns `null` only for a product offering nothing, which is a product that
 * cannot be booked. Callers must handle it rather than assume a default exists.
 */
export function defaultPayoutOption(terms: DepositTerms): PayoutOptionId | null {
  if (isSupportedPayout(terms, DEFAULT_PAYOUT_OPTION)) return DEFAULT_PAYOUT_OPTION;

  return resolvePayoutOptions(terms)[0]?.id ?? null;
}

/**
 * The payout that should be selected after the configuration changes.
 *
 * **Keeps a still-valid choice; replaces one that is no longer offered.** A user
 * who picked Monthly and then changed tenure must not silently end up on At
 * Maturity while the screen still shows Monthly — and must not be left holding a
 * payout the product does not sell.
 *
 * ## This is a mechanism, not a business rule
 *
 * Today `supportedPayouts` is a property of the **product**, with no tenure
 * dimension anywhere in the model — so payout availability cannot vary with
 * tenure, and this function returns its input unchanged on every path the
 * current data can reach. That is deliberate:
 *
 * - Inventing a rule such as "no monthly payout under six months" would be
 *   fabricating a business rule nobody has stated.
 * - Leaving the reconciliation out entirely would mean that the day a partner
 *   *does* restrict payouts by tenure, the fix is a new code path threaded
 *   through the screen rather than one function that already exists.
 *
 * So the shape is real and the variation is not — and if `supportedPayouts`
 * later becomes a function of tenure, this is the single place that changes.
 *
 * Returns `null` only for a product offering no payout at all.
 */
export function reconcilePayoutOption(
  terms: DepositTerms,
  current: PayoutOptionId | null,
): PayoutOptionId | null {
  if (current !== null && isSupportedPayout(terms, current)) return current;

  return defaultPayoutOption(terms);
}
