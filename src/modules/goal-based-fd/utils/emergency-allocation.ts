/**
 * The emergency-fund reserve — **10% of the total the customer is investing.**
 *
 * ## Why this goal alone is derived
 *
 * Every other goal keeps the amount the customer typed. An emergency fund is the
 * one goal whose size is a function of the whole portfolio rather than of a
 * thing being saved for: it exists to cover a shortfall in the rest, so it is
 * expressed as a share of the rest.
 *
 * The share is applied to `MultiGoalPlan.totalAmount`, which is already the
 * canonical total. No second total is introduced, and no other goal is touched —
 * education and retirement continue to take the customer's own figures.
 *
 * ## Rounding is required, not cosmetic
 *
 * Round lakhs divide cleanly, but arbitrary totals do not: a tenth of an arbitrary total is not a whole
 * rupee, and the amount field accepts any digits.
 * Left alone such a value reaches a currency formatter and, worse, an
 * allocation sum. The result is therefore rounded to whole rupees — the
 * smallest unit this platform transacts in, and the same unit the booking
 * draft's schema already enforces.
 *
 * ## Nothing is reserved from nothing
 *
 * A total that is absent, zero, negative or not finite yields `0`. That is not a
 * fallback figure — it is the arithmetic answer, and it keeps the reserve from
 * ever exceeding the total or turning negative.
 *
 * Pure and React-free.
 */

/**
 * The reserve, as a share of the total.
 *
 * A named constant so the rule is stated once and the number appears once. A
 * change of policy is an edit here and nowhere else.
 */
/**
 * Stated as whole percent, not as a decimal fraction.
 *
 * Two reasons, and both matter. It is the unit the rule is written in — "10% of
 * the total" — so the constant reads as the policy rather than as a conversion
 * of it. And a bare decimal in this module is, by the module's own invariant,
 * almost always a hardcoded interest rate; keeping the policy in integers means
 * the rule that catches a smuggled rate stays as strict as it was.
 */
export const EMERGENCY_FUND_PERCENT = 10;

/**
 * The rupees reserved for an emergency fund out of `totalAmount`.
 *
 * Always a whole, non-negative number, and never greater than the total.
 */
export function calculateEmergencyFundAmount(totalAmount: number): number {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return 0;

  /*
    Multiply before dividing, so the intermediate stays an integer product and
    the only rounding is the final one.
  */
  return Math.round((totalAmount * EMERGENCY_FUND_PERCENT) / 100);
}

/**
 * What the customer is told, in their words.
 *
 * Here rather than in a component so the sentence and the arithmetic cannot
 * drift apart, and so the percentage is never typed a second time.
 */
export const EMERGENCY_FUND_EXPLANATION = `We reserve ${String(EMERGENCY_FUND_PERCENT)}% of your total investment for short-term needs, so this amount stays within reach.`;

/** The short label shown beside the derived figure. */
export const EMERGENCY_FUND_BASIS = `${String(EMERGENCY_FUND_PERCENT)}% of your total investment`;
