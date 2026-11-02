/**
 * Shared financial domain types (promoted in M2.2).
 *
 * These describe concepts the whole platform speaks — banks, trust
 * signals, and product benefits — not marketplace-specific ones. They live
 * here so cross-module components (`components/business`) can consume them
 * without importing from a feature module, and so Portfolio, Booking, and
 * Reports inherit the same vocabulary.
 *
 * Transport shapes (DTOs) stay inside the module that owns the endpoint.
 */

export type TrustIndicatorId = 'rbi-regulated' | 'dicgc-insured' | 'aaa-rating';

export interface TrustIndicator {
  id: TrustIndicatorId;
  label: string;
}

export interface Bank {
  id: string;
  name: string;
  shortCode: string;
  /** Two-letter monogram shown in the circular badge (approved UI). */
  initials: string;
  /**
   * Path to the bank's logo, or `null` when none is licensed/available.
   *
   * Nullable rather than optional on purpose: every `Bank` must state whether
   * it has a logo, so the monogram fallback is a modelled case rather than an
   * accident of a missing field. Components never build this path themselves.
   */
  logoUrl: string | null;
  rating: string | null;
  /**
   * What kind of bank this is.
   *
   * The minimum metadata needed to satisfy the client document's disclosure
   * requirement: *"Although Equitas and AU are Small Finance Banks, the
   * recommendation should clearly show the applicable deposit-insurance note and
   * concentration logic."* Identifying an SFB is a prerequisite for that note.
   *
   * **It carries no rule.** Nothing limits, caps or ranks by this field — the
   * document defines no such rule, and inventing one is exactly what
   * §11.diversification stays blocked to prevent. It exists so the platform can
   * *say* what a bank is, not decide what it may hold.
   *
   * Optional: a bank that has not been classified is unclassified, not
   * universal.
   */
  category?: BankCategory;
}

/**
 * Bank classification, for disclosure only.
 *
 * Two values because the client document distinguishes exactly two: Small
 * Finance Banks, which it names and requires a note for, and everything else,
 * which it calls "large-bank" and "large established bank".
 */
export type BankCategory = 'universal' | 'small-finance';

export interface Benefit {
  id: string;
  label: string;
}

/* ------------------------------------------------------------------ *
 * Calculation vocabulary (T3.2.4)
 * ------------------------------------------------------------------ */

/**
 * Inputs to a maturity calculation.
 *
 * Promoted here because *what a deposit is worth* is platform vocabulary, not
 * one module's opinion. Marketplace, Booking, and — shortly — Portfolio and the
 * FD Ladder all need to answer it, and they cannot import the answer from each
 * other: the module boundary is ESLint-enforced, and correctly so.
 *
 * An identical pair still exists at `modules/marketplace/types/calculator.ts`.
 * That duplication is **registered technical debt TD-001** and is scheduled for
 * removal by refactor **R1**, immediately after Booking and before Portfolio
 * (`docs/development/shared-finance-layer.md`). Until then a unit assertion runs
 * both implementations over the six published Marketplace figures and fails the
 * build if they ever disagree.
 */
export interface MaturityInput {
  principal: number;
  /** Annual rate as a percentage number, e.g. 7.75 — never a fraction. */
  annualRate: number;
  tenureMonths: number;
  /** Omitted legacy records use their documented quarterly convention. */
  compoundingFrequency?: 'monthly' | 'quarterly' | 'annual';
}

export interface MaturityResult {
  principal: number;
  interestEarned: number;
  maturityValue: number;
}

/**
 * One band of a tenure-based rate card.
 *
 * A fixed deposit is a rate-**for-tenure** contract: the rate is a function of
 * how long the money is committed, so a product that offers several tenures
 * publishes several rates. Modelling this is what lets Booking offer a tenure
 * choice without quoting a return the user cannot obtain — the defect M2.6
 * decision D2 refused to ship.
 *
 * Distinct from `RateSlab`, which varies rate by **amount**. Both can apply to
 * one product, and they compose in that order: the tenure sets the base rate,
 * the amount slab may then override it.
 */
export interface TenureRate {
  tenureMonths: number;
  annualRate: number;
}

/**
 * What a rate resolution was asked for.
 *
 * An **object rather than a positional argument**, and that is the entire point
 * of it. Rate is a function of more than tenure — amount slabs already exist in
 * the Marketplace catalogue, and senior-citizen and payout-specific pricing are
 * both foreseeable. Each of those becomes an **optional field here**, with no
 * signature change and no caller touched.
 *
 * `amount` arrived first, as predicted — the Marketplace catalogue publishes
 * amount bands (`ProductRateBand`) and the platform resolver reads them.
 * `payoutOption` and `investorSegment` remain unmodelled because no product data
 * resolves them; adding either now would be inventing a business rule.
 */
/**
 * The units a deposit term is actually published in.
 *
 * Days is not a convenience — the client source document prices a **91-day**
 * deposit, and 91 days is not a whole number of months. Storing it as "3 months"
 * would be the platform quietly changing a term the bank published, which is the
 * same class of error as rounding a rate.
 */
export type TenureUnit = 'days' | 'months' | 'years';

/**
 * A deposit term, in the unit it was published in.
 *
 * **The unit is data, not formatting.** Two tenures are the same term only when
 * both value and unit agree, or when one converts to the other **exactly** —
 * years to months does, days to months does not. `toWholeMonths` is the only
 * bridge, and it returns `null` rather than an approximation precisely so that a
 * day-based term can never silently become a month-based one.
 */
export interface Tenure {
  value: number;
  unit: TenureUnit;
}

export interface RateCriteria {
  tenureMonths: number;
  /**
   * The term in its published unit, when it is not whole months.
   *
   * Optional and additive: absent means `tenureMonths` is the whole story, which
   * is true for every existing caller. Present, it is matched against the
   * product's own published term exactly — which is the only way a 91-day
   * deposit can be priced without inventing a month equivalent for it.
   */
  tenure?: Tenure;
  /**
   * The deposit amount, when the caller has one.
   *
   * **Optional, and absent is meaningful**: it means no amount band applies and
   * the published base rate stands — the same answer as an amount below the
   * first band. That keeps the base rate reachable without a caller inventing a
   * placeholder amount to ask for it.
   *
   * Optional also keeps this backwards compatible. Booking's `resolveRate`
   * destructures `tenureMonths` alone and is unaffected; every existing
   * `{ tenureMonths }` call site still satisfies the type.
   */
  amount?: number;
  /**
   * Whether the depositor qualifies for the senior-citizen benefit.
   *
   * **Optional, and absent means "not a senior citizen"** — never "unknown", so
   * no caller has to supply `false` to get the ordinary rate. Every existing
   * call site is unaffected.
   *
   * The uplift itself is published per product as
   * `FixedDepositTerms.seniorCitizenDelta`; this only says whether to apply it.
   * That division matters: the criteria describe the *depositor*, the terms
   * describe the *product*, and the resolver remains the only thing that turns
   * the two into a rate.
   */
  isSeniorCitizen?: boolean;
}

/**
 * The answer to "what rate does this configuration earn", **with its
 * provenance**.
 *
 * Replaces a bare `number | null`. A number tells you the rate; it cannot tell
 * you which published band produced it — and once a product prices by tenure
 * *and* amount *and* investor type, "7.25%" alone is not an answer anyone can
 * check.
 *
 * ## Why only two fields
 *
 * The architect review proposed `bandId`, `effectiveFrom`, `dayCountBasis` and
 * `compoundingFrequency` as well. **None of them exists anywhere in this
 * repository**: `TenureRate` is `{ tenureMonths, annualRate }`, the fixture
 * carries nothing more, and compounding is a platform constant
 * (`COMPOUNDS_PER_YEAR` in `@/utils/maturity`) rather than product data.
 * Synthesising a `bandId` would defeat the audit purpose that field exists for.
 *
 * They are added when the data arrives — which is exactly what this shape makes
 * cheap, since the callers destructure what they need and ignore the rest.
 *
 * `tenureMonths` **is** included: it exists, it is genuine provenance, and it
 * answers "which band was this quoted from" for free.
 */
export interface RateQuote {
  /** Annual rate as a percentage number, e.g. 7.25 — never a fraction. */
  annualRate: number;
  /** The rate-card band this quote came from. */
  tenureMonths: number;
}
