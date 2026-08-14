import type { MaturityInput, MaturityResult } from '@/types/finance';

/**
 * The platform maturity engine (T3.2.4).
 *
 * **This is the same formula Marketplace has used since M2.1**, moved to
 * platform level so Booking can reach it without importing across a module
 * boundary. It is not a new calculation, and the figures it produces are
 * unchanged.
 *
 * Formula — quarterly compounding:
 *
 *     maturity = principal × (1 + rate/4) ^ (4 × tenureYears)
 *
 * **Derived from the approved UI, not assumed.** All six published Marketplace
 * figures match it exactly; simple interest matches none of them:
 *
 *     IDFC  7.75% / 12m → ₹1,07,978
 *     HDFC  7.25% / 12m → ₹1,07,450
 *     Kotak 7.40% / 24m → ₹1,15,795
 *     SBI   7.10% / 12m → ₹1,07,291
 *     ICICI 6.95% / 18m → ₹1,10,888
 *     Axis  6.80% /  9m → ₹1,05,187
 *
 * Those six are the regression test, and they are asserted against **both** this
 * implementation and Marketplace's in the unit suite.
 *
 * ## Known divergence from the Booking artwork
 *
 * The approved Investment Details mockup states ₹5,00,000 at 7.25% for 24 months
 * as ₹5,66,478. This engine returns **₹5,77,270** — a difference of ₹10,792. No
 * rate or compounding basis on that screen reproduces the artwork's figure; it
 * implies roughly 6.29% compounded, against the 7.25% printed beside it.
 *
 * Per the decision of 2026-08-06: **do not reverse-engineer artwork values;
 * continue using the platform calculation engine.** The artwork is an open
 * Product/Design clarification (conflict C2), not a code dependency. Recorded
 * here because this file is where someone will come looking when the two
 * numbers are compared.
 *
 * ## Ownership
 *
 * Pure, React-free, and the **single** place this rule is expressed at platform
 * level. Callers pass figures in and get figures back; nothing here formats,
 * fetches, or knows what a screen is. Composition with rate resolution belongs
 * to the caller — this function is told the rate, it does not choose one.
 */
const COMPOUNDS_PER_YEAR = 4;
const MONTHS_PER_YEAR = 12;

/**
 * Maturity value and interest earned for a compounding (cumulative) deposit.
 *
 * Degenerate inputs return the principal rather than throwing or producing
 * `NaN`. A calculator is asked for a figure while the user is still typing, and
 * a partially-entered form is a normal state, not an error: a zero amount is
 * worth zero, and a zero tenure earns nothing. Negative principals are clamped
 * to zero because no caller should be able to display a negative deposit.
 */
export function calculateMaturity({
  principal,
  annualRate,
  tenureMonths,
}: MaturityInput): MaturityResult {
  if (principal <= 0 || annualRate < 0 || tenureMonths <= 0) {
    return {
      principal: Math.max(principal, 0),
      interestEarned: 0,
      maturityValue: Math.max(principal, 0),
    };
  }

  const periods = COMPOUNDS_PER_YEAR * (tenureMonths / MONTHS_PER_YEAR);
  const growth = (1 + annualRate / 100 / COMPOUNDS_PER_YEAR) ** periods;
  const maturityValue = Math.round(principal * growth);

  return {
    principal,
    interestEarned: maturityValue - principal,
    maturityValue,
  };
}

/** Interest component only — same rule, exposed for readability at call sites. */
export function calculateInterestEarned(input: MaturityInput): number {
  return calculateMaturity(input).interestEarned;
}

/**
 * Simple (non-compounding) interest over the full term.
 *
 * Used for deposits that **pay interest out** rather than reinvesting it: once
 * an instalment leaves the deposit it cannot compound, so the balance earning
 * interest stays at the principal for the whole term.
 *
 * New at T3.2.4 — Marketplace never needed it, because every Marketplace figure
 * is quoted cumulatively. It lives here rather than in Booking because it is the
 * other half of the same question, and Portfolio will need both.
 */
export function calculateSimpleInterest({
  principal,
  annualRate,
  tenureMonths,
}: MaturityInput): number {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;

  return Math.round((principal * (annualRate / 100) * tenureMonths) / MONTHS_PER_YEAR);
}
