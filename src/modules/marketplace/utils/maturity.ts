import type { MaturityInput, MaturityResult } from '../types/calculator';

/**
 * Maturity calculation (M2.1).
 *
 * Formula: quarterly compounding —
 *   maturity = principal × (1 + rate/4) ^ (4 × tenureYears)
 *
 * This is derived from the approved UI, not assumed. All six published
 * figures match it exactly (simple interest matches none):
 *   IDFC  7.75% / 12m → ₹1,07,978
 *   HDFC  7.25% / 12m → ₹1,07,450
 *   Kotak 7.40% / 24m → ₹1,15,795
 *   SBI   7.10% / 12m → ₹1,07,291
 *   ICICI 6.95% / 18m → ₹1,10,888
 *   Axis  6.80% /  9m → ₹1,05,187
 *
 * Values are rounded to the nearest rupee, matching the approved display.
 */
const MONTHS_PER_YEAR = 12;
const COMPOUNDS_PER_YEAR = { monthly: 12, quarterly: 4, annual: 1 } as const;

export function calculateMaturity({
  principal,
  annualRate,
  tenureMonths,
  compoundingFrequency = 'quarterly',
}: MaturityInput): MaturityResult {
  if (principal <= 0 || annualRate < 0 || tenureMonths <= 0) {
    return {
      principal: Math.max(principal, 0),
      interestEarned: 0,
      maturityValue: Math.max(principal, 0),
    };
  }

  const compoundsPerYear = COMPOUNDS_PER_YEAR[compoundingFrequency];
  const periods = compoundsPerYear * (tenureMonths / MONTHS_PER_YEAR);
  const growth = (1 + annualRate / 100 / compoundsPerYear) ** periods;
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
