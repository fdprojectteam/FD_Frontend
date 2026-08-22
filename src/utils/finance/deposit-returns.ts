import { calculateMaturity, calculateSimpleInterest } from '@/utils/maturity';

/**
 * What a fixed deposit pays, given a rate that has already been resolved.
 *
 * ## Why this sits in the platform tier
 *
 * Two surfaces need the same answer and neither may import the other: Booking
 * prices a deposit the customer is configuring, and Portfolio states what a
 * deposit they already hold will return. Left in Booking, Portfolio would have
 * had to restate the rule below — and a second implementation of "what does
 * this FD pay" is exactly the kind that agrees until someone edits one of them.
 *
 * So the rule lives here, once, and `calculateReturns` in Booking calls it for
 * the arithmetic while keeping what is genuinely its own: resolving a rate from
 * a product's rate card, instalment counts, and the tax seam.
 *
 * ## The rule
 *
 * > **Never show a compounded maturity for a payout deposit.**
 *
 * Interest that leaves the deposit as it accrues cannot compound, so the
 * balance earning interest stays at the principal and the customer receives
 * **the principal** at maturity — having already been paid the interest in
 * instalments. Showing them a compounded figure would tell them they will
 * receive money they have already had.
 *
 * Pure and React-free. The caller supplies the rate; this never resolves one.
 */
export interface DepositReturnsInput {
  principal: number;
  /** Already resolved for the term — this function never picks a rate. */
  annualRate: number;
  tenureMonths: number;
  /** True when interest is retained and compounds ("at maturity"). */
  isCumulative: boolean;
}

export interface DepositReturns {
  /** Total interest earned across the whole term. */
  totalInterest: number;
  /**
   * What the customer receives at maturity.
   *
   * Equals `principal` for every payout option that pays interest out — the
   * invariant this module exists to hold.
   */
  maturityValue: number;
}

export function calculateDepositReturns({
  principal,
  annualRate,
  tenureMonths,
  isCumulative,
}: DepositReturnsInput): DepositReturns {
  const totalInterest = isCumulative
    ? calculateMaturity({ principal, annualRate, tenureMonths }).interestEarned
    : calculateSimpleInterest({ principal, annualRate, tenureMonths });

  return {
    totalInterest,
    maturityValue: isCumulative ? principal + totalInterest : principal,
  };
}
