import type { Bank, Tenure } from './finance';

/**
 * Product Master — the platform's canonical view of a bank product.
 *
 * The Founder Vision Addendum asks for *"a reusable multi-bank, multi-product
 * integration platform, with FD as the first product module"* and warns against
 * *"hardcoded FD-only data structures"*. This is that boundary, at the smallest
 * size that is honest.
 *
 * ## What it is not
 *
 * - **Not a replacement for `ProductSummary`.** Marketplace keeps its own model
 *   and is untouched. Both are projections of the same wire payload — siblings,
 *   not parent and child. `ProductSummary` carries display concerns
 *   (`categories`, `flags`, `estimatedReturns`) that do not belong here.
 * - **Not a replacement for `SelectedDeposit`.** Booking keeps its view model
 *   and its approved UI.
 * - **Not a holder of resolved rates.** `terms.baseRate` and `terms.rateSlabs`
 *   are *published* product data — what the bank advertises. What a particular
 *   deposit earns is a different thing: it is the answer to a question, the
 *   question is `RateCriteria`, and the answer is a `RateQuote` produced by
 *   `resolveProductRate`. No effective rate is ever stored here.
 *
 * ## Why a discriminated union rather than an optional-field bag
 *
 * A savings account has no tenure and no payout schedule. Modelling future
 * products by making every FD field optional would produce a "super product"
 * where nothing is guaranteed and every consumer writes defensive checks.
 *
 * Instead `productType` discriminates, and each product type carries its own
 * `terms`. FD is the **first member**, not the only shape — which is precisely
 * what "build narrow, architect broad" asks for. A second product is a second
 * union member; no existing field becomes optional.
 *
 * ## Every field here can be sourced
 *
 * Nothing is defaulted or invented. Fields the Addendum names but the data does
 * not contain — product status, maximum investment, premature withdrawal,
 * supported payout list, tenure rate card, partner SLA — are **absent**, not
 * guessed. See `docs/development/current-task.md` for the open data gaps.
 */

/** The product types the platform can express. FD is the first and, today, only. */
export type ProductType = 'fixed-deposit';

/**
 * One band of a rate card that varies by **deposit amount**.
 *
 * Structurally identical to Marketplace's `RateSlab`, and deliberately declared
 * separately: `src/types` may not import from `src/modules` (the boundary is
 * ESLint-enforced), and Marketplace must not be modified. Both describe the same
 * published bands; converging them is refactor **R1**, already scheduled in
 * `docs/engineering/shared-finance-layer.md`.
 *
 * Recorded as a known duplication rather than hidden behind a different name.
 */
export interface ProductRateBand {
  /** Inclusive lower bound of the band, in rupees. */
  minAmount: number;
  /** Annual rate for deposits in this band, as a percentage number, e.g. 7.85. */
  annualRate: number;
}

/** How interest accrues. Mirrors the values the product API already serves. */
export type ProductInterestType = 'cumulative' | 'non-cumulative';

/** When interest is paid. Mirrors the values the product API already serves. */
export type ProductPayoutType = 'at-maturity' | 'monthly' | 'quarterly';

/**
 * The commercial terms specific to a Fixed Deposit.
 *
 * **This is where FD-specific fields live**, so that adding a savings account
 * later adds a sibling terms type rather than loosening this one.
 *
 * Note `tenureMonths` is singular: the product API publishes **one tenure per
 * product**. Booking's `tenureRates[]` (a rate card by tenure) has no equivalent
 * in the catalogue and is therefore not represented — see the data gaps.
 */
export interface FixedDepositTerms {
  tenureMonths: number;
  /**
   * The product's **published base rate** at `tenureMonths`, as a percentage
   * number, e.g. 7.75. Sourced from the payload's `interestRate`.
   *
   * ## Why a stored rate belongs here, when a resolved one does not
   *
   * `@/types/finance` states the composition law on `TenureRate`:
   *
   * > *"the tenure sets the base rate, the amount slab may then override it"*
   *
   * `rateSlabs` is the second half of that rule. Without this field the master
   * carried the overrides and omitted the thing being overridden — and since the
   * catalogue's bands begin at ₹5,00,000, no rate at all was obtainable for the
   * amounts most deposits are made at.
   *
   * This is **published product data**, exactly like `minInvestment`: the figure
   * the bank advertises and the one that applies when no band does. It is not an
   * *effective* rate. What a specific deposit earns is `RateQuote`, produced by
   * `resolveProductRate` in `@/utils/finance`, and that is still never stored.
   *
   * Named `baseRate` rather than `interestRate` because the wire name reads as
   * "the rate this product pays", which is wrong the moment bands exist. The
   * mapper renames it, as it already renames `id` to `productId`.
   */
  /**
   * The term **as the bank publishes it**, in its own unit.
   *
   * Additive and authoritative for display and comparison. `tenureMonths` stays
   * exactly as it was — every month-based product carries both, they agree, and
   * no existing consumer changes.
   *
   * It exists because the client source document prices a **91-day** deposit,
   * and 91 days is not a whole number of months. Such a product carries
   * `tenureMonths: 0`, which the existing filters already treat as unpriceable —
   * so it is **excluded from the month-based engine rather than approximated
   * into it**. That exclusion is the honest outcome until the ranking rules are
   * defined for mixed units; a `tenureMonths: 3` would have been the platform
   * rewriting a published term.
   */
  tenure: Tenure;
  baseRate: number;
  /**
   * Rate bands by **amount**, overriding `baseRate` where one applies.
   *
   * Empty is legitimate — the product publishes no bands and earns `baseRate` at
   * every amount. Band rates are absolute, not deltas.
   */
  rateSlabs: ProductRateBand[];
  /**
   * The senior-citizen uplift this product publishes, in percentage points.
   *
   * **A delta, not an absolute rate** — it is added to whatever rate the amount
   * bands resolve to, so it composes with `rateSlabs` instead of replacing them.
   * That is what the client document describes: base 7.00% + benefit 0.50% =
   * effective 7.50%.
   *
   * **Optional, and absent means the product publishes no benefit.** It is not
   * defaulted to zero anywhere: a product without the field simply has no uplift
   * to apply, which is a different statement from "an uplift of nothing".
   */
  seniorCitizenDelta?: number;
  interestType: ProductInterestType;
  payout: ProductPayoutType;
}

/** Fields every product carries, whatever its type. */
export interface ProductMasterBase {
  productId: string;
  name: string;
  bank: Bank;
  minInvestment: number;
}

/**
 * A product, discriminated by type.
 *
 * Today the union has one member. Written as a union rather than a plain
 * interface so the second member is an addition rather than a redesign — and so
 * a consumer that narrows on `productType` compiles unchanged when it arrives.
 */
export type ProductMaster = ProductMasterBase & {
  productType: 'fixed-deposit';
  terms: FixedDepositTerms;
};
