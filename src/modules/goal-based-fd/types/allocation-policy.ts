/**
 * How the platform decides to spread a goal's money across banks.
 *
 * ## Why this is configuration and not code
 *
 * The client source document demonstrates diversification — education's
 * ₹10,00,000 across two banks, UC3's ₹20,00,000 across four — but **states no
 * rule**. It never gives a limit, a basis, a scope, or a trigger. Encoding one
 * as a branch would make the platform's behaviour a guess that nobody could see
 * or change.
 *
 * So every decision the document leaves open becomes a **named, configurable
 * field with no default of its own**. Changing the policy changes the
 * recommendation; reading the policy tells you exactly what the platform
 * believes. Nothing about UC2 or UC3 is reproduced by a special case.
 *
 * ## Deposit insurance is a *consideration*, not a cap
 *
 * `insuredCoverageAmount` is the DICGC cover the platform already advertises on
 * every product card. Treating it as a safety threshold is the product's
 * reasoning: money above it is money outside deposit insurance, which is a fact
 * about risk worth acting on and worth telling the customer.
 *
 * **It is not an unconditional maximum.** Exceeding it is permitted and
 * disclosed — because refusing to place money when only one suitable deposit
 * exists would serve nobody, and because the client has not confirmed a
 * maximum-per-bank rule. `§11.diversification` therefore stays blocked: the
 * platform applies an insurance-aware consideration, not the client's limit.
 */

/** What the platform does about concentration. */
export type ConcentrationMode =
  /** Place the whole amount in the best-fitting deposit. No spreading. */
  | 'none'
  /**
   * Prefer to keep each bank's exposure within insured cover, spreading across
   * suitable banks to do so — but place the money regardless if it cannot.
   */
  | 'insurance-aware';

export interface AllocationPolicy {
  concentration: ConcentrationMode;
  /**
   * The deposit-insurance cover a single bank exposure is measured against.
   *
   * **Provenance: DICGC statutory cover**, already displayed platform-wide as
   * "₹5L DICGC Insured". It is *not* taken from the ₹5,00,000 that appears in
   * the client document's worked examples, and it is not a client-confirmed
   * maximum. It is configurable precisely so it is never mistaken for one.
   */
  insuredCoverageAmount: number;
  /**
   * The most banks one goal may be spread across.
   *
   * ⚠️ **Provisional.** The document demonstrates two legs in UC2 and four in
   * UC3 but states no maximum. This bounds the spread so a large amount cannot
   * fragment indefinitely; the client's answer replaces it.
   */
  maxLegsPerGoal: number;
  /**
   * Whether a second leg must be a different bank.
   *
   * Spreading across two deposits at the same bank changes nothing about
   * insured exposure, so this is `true` for any policy where concentration is
   * the point — but it is stated rather than assumed.
   */
  requireDistinctBanks: boolean;
  /**
   * Which deposits a goal's money may be spread across.
   *
   * `same-term-only` restricts spreading to deposits on the **same term** as the
   * best-fitting one. Diversifying should change *who holds the money*, not how
   * long it is held: placing half a ten-year goal in a five-year deposit is a
   * different recommendation, not an alternative bank for the same one.
   *
   * Every split the client document demonstrates is within a single term — UC2's
   * two education legs are both 3 years, UC3's four legs are all 5 years — so
   * this is consistent with the evidence without being read out of it as a rule.
   *
   * `any-suitable` allows the next-best deposit whatever its term, and exists so
   * the restriction is visibly a choice rather than an assumption.
   */
  spreadAcross: 'same-term-only' | 'any-suitable';
}
