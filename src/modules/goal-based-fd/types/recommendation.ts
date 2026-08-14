import type { MaturityResult, RateQuote } from '@/types/finance';
import type { ProductMaster } from '@/types/product-master';

import type { GoalType } from './goal';
import type { BlockedRule, RecommendationReason, RecommendationWarning } from './rule';

/**
 * Target assessment (`04-rule-engine.md` §12, R-TARGET-001/002).
 *
 * Present **only** when the customer named a target. Absent means the question
 * was never asked — which is a different statement from "target not met", and
 * the shape says so rather than leaving a `null` for every consumer to
 * interpret.
 */
export interface TargetAssessment {
  targetAmount: number;
  /** R-TARGET-001 — `expected maturity >= target`. */
  achieved: boolean;
  /**
   * R-TARGET-002 — `target - expected maturity`, floored at zero.
   *
   * Zero when the target is met. Never negative: a surplus is not a gap, and
   * reporting one as `-40000` invites a UI to render "gap: -₹40,000".
   */
  gap: number;
}

/**
 * One recommended deposit, with everything needed to explain it.
 *
 * Every field is sourced or computed from data that exists. Nothing is nullable
 * as a placeholder: a product whose rate could not be resolved never becomes a
 * `Recommendation` at all, so `quote` and `maturity` are always real.
 *
 * `product` carries the whole `ProductMaster` rather than a copy of its fields —
 * `08-data-model.md` §2: *"Goal-Based FD must consume the existing FD product
 * model. It must not create a second FD product catalogue."*
 */
export interface Recommendation {
  productId: string;
  /** The goal this was recommended for — carried so an allocation leg keeps it. */
  goalType: GoalType;
  product: ProductMaster;
  /** The amount this recommendation was evaluated for, in rupees. */
  principal: number;
  /** The product's published tenure — the term this recommendation is for. */
  tenureMonths: number;
  /** What the deposit earns, from `resolveProductRate`. Never a stored or headline figure. */
  quote: RateQuote;
  /**
   * Expected maturity, from the platform engine — or **`null` when it cannot be
   * produced**.
   *
   * Null for a deposit whose term is published in days: compounding needs a
   * month count, and converting days into months requires a day-count basis no
   * approved document states. Reporting nothing is the honest outcome; a figure
   * derived from an assumed basis would be a number no bank agreed to pay.
   */
  maturity: MaturityResult | null;
  /** Present only when a target was set. */
  target?: TargetAssessment;
  /** Why this product was recommended, each tied to a rule id (§14). */
  reasons: readonly RecommendationReason[];
  /** What the customer must know that is not a reason. */
  warnings: readonly RecommendationWarning[];
}

/**
 * The engine's full answer.
 *
 * `blockedRules` is part of the output, not a footnote: `04-rule-engine.md` §16
 * forbids inventing the data these rules need, so the honest alternative is to
 * report which rules did not run. A caller that renders recommendations without
 * ever reading this is choosing to; it cannot claim it was not told.
 */
export interface GoalRecommendationResult {
  /** Ranked best-first. Empty when no product survives filtering. */
  recommendations: readonly Recommendation[];
  /** How many products were considered before filtering. */
  candidatesConsidered: number;
  /** Result-level warnings — those not specific to one recommendation. */
  warnings: readonly RecommendationWarning[];
  /** Rules the approved documents define that this engine did not evaluate. */
  blockedRules: readonly BlockedRule[];
}
