import type { DepositTerms } from '../types/booking';

/**
 * Quick amount resolution (T3.2.8, decisions C3a / C3b).
 *
 * ## What the decisions settled
 *
 * - **C3a — the chips are absolute, and the `+` is gone.** They *set* the
 *   investment amount; they do not add to it. The approved artwork labels them
 *   `+ ₹1L / + ₹5L / + ₹10L`, which reads as addition and was recorded as a UI
 *   inconsistency rather than implemented. A `+` on a control that replaces the
 *   value is not a styling detail on a money field.
 * - **C3b — no chip may be invalid.** Applying C3a surfaced a defect that
 *   additive semantics had hidden: ₹1,00,000 is **below** the demo product's
 *   ₹5,00,000 minimum, so an absolute ₹1L chip would exist only to produce a
 *   BR-INV-001 error. Every rendered chip must be a value the user may actually
 *   invest.
 *
 * ## How the list is decided
 *
 * Candidates come from the **product**, filtered against the **product's own
 * limits**. Nothing downstream renders a value it was handed without checking
 * it, which is the whole of C3b:
 *
 *     candidates → drop below min → drop above max → drop off-increment → cap
 *
 * `DepositTerms.quickAmounts` lets a product publish its own ladder. When it
 * does not, `DEFAULT_QUICK_AMOUNTS` stands in — the three amounts drawn on the
 * approved screen, which is transcription rather than invention. For the demo
 * product the filter removes ₹1L and leaves **₹5L and ₹10L**, which is exactly
 * the outcome C3a specifies.
 *
 * **The three-chip cap is the artwork's layout**, not the older specification's
 * five (decision 3). A product publishing six candidates renders the first three
 * that are valid; the row was designed for three and wrapping a fourth would
 * change a layout this task may not redesign.
 *
 * Pure and React-free — so "every chip is valid" is assertable without a DOM,
 * which is the only way that claim is worth making.
 */

/**
 * The approved screen's three amounts, used when a product publishes none.
 *
 * Transcribed from `FD_booking_investment_details_02.png`. ₹1L is kept here
 * deliberately: it is a legitimate candidate for a product whose minimum is low
 * enough, and it is the *filter*, not the list, that removes it from the demo
 * product. Deleting it from the ladder instead would hard-code one product's
 * limits into every product's chips.
 */
export const DEFAULT_QUICK_AMOUNTS: readonly number[] = [100_000, 500_000, 1_000_000];

/** The approved row holds three (decision 3). */
export const MAX_QUICK_AMOUNTS = 3;

/**
 * The quick amounts that may be shown for this product — every one of them a
 * value the user may actually invest.
 *
 * Off-increment candidates are dropped as well as out-of-range ones. A product
 * with a ₹1,000 increment and a ₹10,500 minimum would otherwise offer a ₹1L chip
 * that fails BR-INV-003 the moment it is pressed — the same class of defect as
 * the below-minimum chip, one rule further along.
 */
export function resolveQuickAmounts(terms: DepositTerms): number[] {
  const candidates = terms.quickAmounts ?? DEFAULT_QUICK_AMOUNTS;

  return candidates
    .filter((amount) => isOfferableAmount(amount, terms))
    .slice(0, MAX_QUICK_AMOUNTS);
}

/**
 * Whether a candidate is a value this product accepts.
 *
 * Mirrors BR-INV-001/002/003 without importing the validator: the validator
 * produces *messages* for a user, and a chip filter needs a *predicate*.
 * Coupling them would mean this function had to inspect prose to decide whether
 * to render a button.
 *
 * The two are asserted against each other in the unit suite — every offered
 * chip must pass `validateAmount`, and that assertion is what keeps this
 * predicate honest.
 */
function isOfferableAmount(amount: number, terms: DepositTerms): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  // Whole rupees only — the same rule `validateAmount` applies, so a chip can
  // never offer a value the validator would then reject.
  if (!Number.isInteger(amount)) return false;
  if (amount < terms.minInvestment) return false;
  if (amount > terms.maxInvestment) return false;

  const increment = terms.investmentIncrement;
  if (increment && increment > 0) {
    return (amount - terms.minInvestment) % increment === 0;
  }

  return true;
}
