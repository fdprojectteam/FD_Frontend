import type { Tenure } from '@/types/finance';

/**
 * Goal-Based FD — goal vocabulary and engine input (`04-rule-engine.md` §2,
 * `03-user-flow.md` §4–§6).
 *
 * The three goals are the ones the approved documents name and the approved
 * screens draw (`05-screen-specification.md:74–76`). No fourth is invented here:
 * `04-rule-engine.md` R-GOAL-004 describes *capital protection* as a property
 * every fixed deposit already has rather than a goal the user picks, so it is
 * not a member of this union.
 */
export type GoalType = 'emergency' | 'education' | 'retirement';

/**
 * What the customer told us.
 *
 * Deliberately small. `03-user-flow.md` §6 — *"Collect only information required
 * by the POC rules… The system should avoid collecting unnecessary
 * information"* — and every field below is read by a rule that runs. Age, senior
 * status, risk preference and diversification preference are **not** here: the
 * rules that would consume them are data-blocked (see
 * `constants/blocked-rules.ts`), and a field nothing reads is a field that
 * invites a rule to be faked around it.
 */
export interface GoalInput {
  goalType: GoalType;
  /** The amount available to invest, in rupees. */
  principal: number;
  /**
   * The customer's horizon in whole months.
   *
   * Months because every tenure the platform models is in months
   * (`ProductMaster.terms.tenureMonths`, `RateQuote.tenureMonths`). No day-count
   * conversion happens anywhere in this module.
   */
  horizonMonths: number;
  /**
   * The customer's horizon **in the unit they stated it**.
   *
   * Optional and additive. When absent the horizon is `horizonMonths` months,
   * which is what every existing caller means — so nothing changes for them.
   *
   * It exists because a 91-day horizon has no whole-month equivalent. A goal
   * stated in days carries `horizonMonths: 0` and its real term here, and the
   * comparison in `tenure-fit.ts` uses this field. Rounding 91 days to 3 months
   * would be the platform restating the customer's own timeline.
   */
  horizon?: Tenure;
  /**
   * The maturity the customer is aiming for, when they named one
   * (`04-rule-engine.md` §12).
   *
   * **Optional, and absent means "no target was set"** — not "target of zero".
   * When absent, R-TARGET-001/002/003 do not run and the recommendation carries
   * no target assessment at all, rather than a null one.
   */
  targetAmount?: number;
  /**
   * Whether the depositor qualifies for the senior-citizen benefit
   * (`04-rule-engine.md` R-ELIG-001; client source document, Use Case 1).
   *
   * **Optional, and absent means "not a senior citizen"** rather than "unknown".
   * The rule applies the uplift a product publishes; it never assumes one, and a
   * product publishing no benefit is unaffected whatever this says.
   *
   * This is the only depositor attribute the engine reads. Age, income and risk
   * preference remain absent because no rule that runs consumes them, and a
   * field nothing reads invites a rule to be faked around it.
   */
  isSeniorCitizen?: boolean;
}
