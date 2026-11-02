/**
 * Calculator types (M2.1).
 * Shapes for the maturity calculation used by cards, comparison, and the
 * product-details calculator.
 */

export interface MaturityInput {
  principal: number;
  /** Annual rate as a percentage number, e.g. 7.75. */
  annualRate: number;
  tenureMonths: number;
  compoundingFrequency?: 'monthly' | 'quarterly' | 'annual';
}

export interface MaturityResult {
  principal: number;
  interestEarned: number;
  maturityValue: number;
}
