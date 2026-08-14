import type { GoalType } from '../types/goal';

/** The goals the approved screens offer (`05-screen-specification.md:74–76`). */
export const GOAL_TYPES: readonly GoalType[] = ['emergency', 'education', 'retirement'] as const;

export const GOAL_LABELS: Record<GoalType, string> = {
  emergency: 'Emergency Fund',
  education: "Children's Education",
  retirement: 'Retirement',
};

/**
 * How each goal prefers tenures — an **ordering**, never a threshold.
 *
 * This is the part of the rule engine most likely to be faked, so it is worth
 * being explicit about what the documents do and do not say.
 *
 * `04-rule-engine.md` says *"prefer short-duration FD products"* (R-GOAL-001),
 * *"prefer FD tenure aligned with the education time horizon"* (R-GOAL-002),
 * *"prefer longer-term FD products aligned with the retirement time horizon"*
 * (R-GOAL-003) and *"prefer shorter available tenures"* (R-TENURE-003).
 *
 * Every one of those is comparative. **None of them names a number.** There is
 * no "emergency means twelve months or less" anywhere in the approved documents,
 * so there is none here: encoding one would be inventing the business rule §16
 * forbids, and it would look entirely reasonable while doing it.
 *
 * So each goal maps to a comparator strategy over the tenures that actually
 * exist, and a catalogue with different tenures produces different answers
 * without this file changing.
 */
export type TenurePreference =
  /** R-GOAL-001, R-TENURE-003 — the shortest available tenure ranks first. */
  | 'shortest'
  /** R-GOAL-002 — the tenure nearest the customer's horizon ranks first. */
  | 'closest-to-horizon'
  /** R-GOAL-003 — the longest available tenure ranks first, nearest as tie-break. */
  | 'longest';

export const GOAL_TENURE_PREFERENCE: Record<GoalType, TenurePreference> = {
  emergency: 'shortest',
  education: 'closest-to-horizon',
  retirement: 'longest',
};
