import { maturityDate } from './maturity-date';
import { calculateReturns, type ReturnsResult } from './returns';
import type { SelectedDeposit } from '../types/booking';
import type { BookingDraft } from '../types/draft';

/**
 * The figures Review, Processing and Success all state.
 *
 * ## Why a shared derivation and not three
 *
 * These three screens quote the same maturity amount, the same total interest
 * and the same maturity date. Derived separately they would agree until someone
 * edited one — and the customer reads all three within about a minute of each
 * other, so a disagreement would be immediately visible and completely
 * destroying of trust.
 *
 * ## Recomputed, never stored
 *
 * Document 09 §10 forbids storing a maturity amount, and BR-INV-004 requires
 * recalculation on change. So the confirmation in the draft carries a reference
 * and a timestamp, and every figure on the post-payment screens is derived from
 * amount, tenure, payout and the deposit's own rate card — the same inputs the
 * Investment Details screen priced.
 *
 * The consequence worth stating: if a product's rate card changed between
 * payment and the customer reopening Success, the figures would change with it.
 * That is spec 21f §8 Rule 2's concern (data freshness), and the honest
 * behaviour until a booking record exists that the bank has actually confirmed.
 *
 * ## `null` means unpriceable, not zero
 *
 * An incomplete configuration, or a tenure the product does not price, yields
 * `null` throughout. Screens render nothing rather than ₹0 — a zero maturity is
 * a claim, an absent one is the truth.
 *
 * Pure and React-free; the caller supplies the start date.
 */
export interface BookingFigures {
  returns: ReturnsResult | null;
  /** `null` for an unpriceable configuration or a term stated in days. */
  maturesOn: Date | null;
}

export function deriveBookingFigures(
  deposit: SelectedDeposit,
  amount: number | null,
  tenureMonths: number | null,
  payoutOption: BookingDraft['investment']['payoutOption'],
  startedAt: number,
): BookingFigures {
  if (amount === null || tenureMonths === null || payoutOption === null) {
    return { returns: null, maturesOn: null };
  }

  const returns = calculateReturns({
    principal: amount,
    tenureMonths,
    payoutOption,
    terms: deposit.terms,
  });

  return {
    returns,
    maturesOn: returns === null ? null : maturityDate(startedAt, tenureMonths),
  };
}
