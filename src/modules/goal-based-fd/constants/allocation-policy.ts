import type { AllocationPolicy } from '../types/allocation-policy';

/**
 * The DICGC deposit-insurance cover, in rupees.
 *
 * **Provenance: the statutory cover the platform already advertises** — the
 * `dicgc-insured` trust indicator reads "₹5L DICGC Insured" on every product
 * card, and the product terms state *"Deposits are insured up to ₹5,00,000 by
 * DICGC."* This constant is that same published figure, named for what it is.
 *
 * It is **not** the ₹5,00,000 that appears in the client document's worked
 * examples, and it is **not** a client-confirmed maximum per bank. It is the
 * threshold above which a customer's money at one bank stops being insured —
 * which is a safety fact, and the reason the platform prefers to stay under it.
 */
export const DEPOSIT_INSURANCE_COVERAGE = 500_000;

/**
 * The platform's default allocation policy.
 *
 * Every field is a decision the client document leaves open, made explicit here
 * so it can be read, changed and argued with. **No allocation behaviour is
 * expressed anywhere else** — there is no scenario branch, and nothing in the
 * engine knows what UC2 or UC3 look like.
 *
 * `maxLegsPerGoal` is the one provisional figure: the document shows two legs in
 * one example and four in another, and states no maximum. Four bounds the spread
 * without contradicting either, and is replaced the moment the client answers.
 */
export const DEFAULT_ALLOCATION_POLICY: AllocationPolicy = {
  concentration: 'insurance-aware',
  insuredCoverageAmount: DEPOSIT_INSURANCE_COVERAGE,
  maxLegsPerGoal: 4,
  requireDistinctBanks: true,
  spreadAcross: 'same-term-only',
};

/**
 * A policy that spreads nothing — the whole goal in its best-fitting deposit.
 *
 * Exists so the concentration behaviour is demonstrably *policy*, not something
 * baked into the engine: the same goal and the same catalogue produce one leg
 * under this policy and several under the default.
 */
export const NO_CONCENTRATION_POLICY: AllocationPolicy = {
  concentration: 'none',
  insuredCoverageAmount: DEPOSIT_INSURANCE_COVERAGE,
  maxLegsPerGoal: 1,
  requireDistinctBanks: false,
  spreadAcross: 'same-term-only',
};
