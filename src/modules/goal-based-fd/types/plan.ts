import type { Bank, Tenure } from '@/types/finance';

import type { GoalType } from './goal';
import type { Recommendation } from './recommendation';
import type { RecommendationWarning } from './rule';

/**
 * Multi-goal planning (client source document, Use Case 2).
 *
 * ## What this models, and what it deliberately does not
 *
 * The document describes a depositor with ₹25,00,000 and three goals, each with
 * its own amount and timeline, and shows an allocation across four deposits.
 * Allocation is decided by a **configurable policy** (`AllocationPolicy`), not
 * by anything in this file and not by any rule read out of the worked examples.
 * The client states no concentration limit, so none is encoded: what the engine
 * applies is published deposit-insurance cover as a *safety consideration*,
 * which prefers to keep each bank's exposure insured and discloses when it
 * cannot. `§11.diversification` therefore stays in `BLOCKED_RULES` — a
 * configured default must never masquerade as an approved business rule.
 *
 * ## No combined maturity
 *
 * The document reports no maturity for UC2 — not per goal and not in total. A
 * combined figure would be this module's invention, and a plan-level number is
 * exactly the kind a customer would read as a promise.
 */

/** One goal inside a multi-goal plan. */
export interface GoalPlan {
  goalType: GoalType;
  /** What the customer wants to place against this goal, in rupees. */
  amount: number;
  /**
   * The customer's timeline **in the unit they stated it**.
   *
   * A `Tenure`, not a month count, because the document's own scenario contains
   * `91 days` — and 91 days is not a whole number of months. A goal the
   * month-based engine cannot evaluate is reported as such rather than rounded
   * into one it can.
   */
  horizon: Tenure;
  /**
   * The document's own `Intent` column, verbatim — "Short-term liquidity",
   * "Goal matching with diversification", "Long-term fixed return".
   *
   * Carried as a label and read by nothing. It is what the customer said, not a
   * rule: no filter, ranking or allocation consults it, because the document
   * defines no behaviour for it.
   */
  intent?: string;
}

/**
 * Who is investing — asked **once per planning journey**, not once per goal.
 *
 * Senior-citizen status is an attribute of the depositor, not of a goal. Asking
 * it beside every goal would be asking the same question three times and would
 * allow three different answers to the same fact about one person.
 *
 * It is consumed by every goal's `GoalInput`, so the published benefit applies
 * wherever a deposit offers one — through the existing rate authority, which
 * remains the only thing that turns status into a rate.
 */
export interface InvestorProfile {
  /** Absent means the question has not been answered; `false` is a real answer. */
  isSeniorCitizen?: boolean;
}

/** The whole plan, as stated by the customer. */
export interface MultiGoalPlan {
  /** One profile for the whole plan. Never per goal. */
  investor?: InvestorProfile;
  /**
   * The amount the customer has to invest.
   *
   * Held separately from the sum of the goals so the two can be **reconciled and
   * reported** rather than assumed equal. The document's example happens to
   * balance; nothing states that it must, so the plan reports any difference
   * instead of silently distributing it.
   */
  totalAmount: number;
  goals: readonly GoalPlan[];
}

/**
 * One placement of money against one goal.
 *
 * A goal has as many legs as the policy produced for it — one when the amount
 * sits within insured cover or only one suitable deposit exists, several when
 * spreading keeps more of the money insured. The shape does not change either
 * way, which is why a leg is a leg rather than a field on the goal.
 */
export interface AllocationLeg {
  goalType: GoalType;
  /** Also the id Booking is handed. One field, one meaning. */
  productId: string;
  /** Who the money would be deposited with, including rating and category. */
  bank: Bank;
  /** Rupees placed in this deposit. */
  amount: number;
  /** The rate this placement earns and the term it earns over. */
  quote: Recommendation['quote'];
  /** Why this product, each tied to a rule id. Straight from the engine. */
  reasons: Recommendation['reasons'];
  /** Where this placement stands against deposit insurance, and why. */
  safety: SafetyAssessment;
}

/**
 * The safety position of one placement.
 *
 * Computed once, in the engine, and carried — never recomputed by a screen. A
 * UI that decided for itself whether an amount was insured would be a second
 * authority on the customer's safety.
 */
export interface SafetyAssessment {
  ruleId: '§11.deposit-insurance';
  withinInsuredCover: boolean;
  /** The cover this was measured against, so the figure shown is the one used. */
  insuredCoverageAmount: number;
  text: string;
}

/** Why a goal produced no leg. Never a silent omission. */
export type GoalPlanStatus =
  | 'allocated'
  /** The horizon is not expressible in whole months, so the engine could not run. */
  | 'tenure-unsupported'
  /** The engine ran and no product survived filtering. */
  | 'no-match';

/** The outcome for one goal, whatever that outcome is. */
export interface GoalPlanResult {
  /** The goal exactly as the customer stated it — amount and horizon preserved. */
  goal: GoalPlan;
  status: GoalPlanStatus;
  /** Present only when `status === 'allocated'`. One or more, per the policy. */
  legs: readonly AllocationLeg[];
  /** Everything the customer must know about this goal, including why it has no leg. */
  warnings: readonly RecommendationWarning[];
}

/**
 * The plan's full answer.
 *
 * ## Reconciliation, not distribution
 *
 * `allocatedAmount` is what the legs actually place; `unallocatedAmount` is what
 * they do not. A goal the engine could not evaluate leaves its money unplaced
 * and visible, rather than being quietly folded into another goal.
 *
 * **There is no `combinedMaturity`, and its absence is deliberate** — see the
 * module note above.
 */
export interface MultiGoalPlanResult {
  plan: MultiGoalPlan;
  goals: readonly GoalPlanResult[];
  /** Sum of every leg's amount. */
  allocatedAmount: number;
  /** `totalAmount - allocatedAmount`, floored at zero. */
  unallocatedAmount: number;
  /** Plan-level warnings — those belonging to no single goal. */
  warnings: readonly RecommendationWarning[];
}
