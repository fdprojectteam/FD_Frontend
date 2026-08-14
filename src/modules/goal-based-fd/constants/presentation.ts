import { GOAL_TENURE_PREFERENCE, type TenurePreference } from './goals';
import type { GoalType } from '../types/goal';
import type { RuleId } from '../types/rule';

/**
 * How the planner **speaks**. Presentation only — no rule, no rate, no figure.
 *
 * Everything here restates something the engine already decided, in the
 * customer's words. Nothing here decides anything: change a sentence and the
 * recommendation is identical.
 */

/**
 * The approved artwork for each goal, by path.
 *
 * Paths rather than icon components since the illustrations became commissioned
 * PNGs. Consumers render them through `next/image`.
 */
export const GOAL_ICONS: Record<GoalType, string> = {
  emergency: '/goal-emergency-fund.png',
  education: '/goal-childran-education.png',
  retirement: '/goal-retirment.png',
};

/** One line per goal, in the customer's terms — what they are planning for. */
export const GOAL_DESCRIPTIONS: Record<GoalType, string> = {
  emergency: 'Money you may need at short notice.',
  education: 'A milestone with a date attached.',
  retirement: 'Building toward your future.',
};

/**
 * What the platform says once a goal is chosen.
 *
 * Keyed on `TenurePreference`, not on the goal — so it is a **restatement of the
 * rule that will actually run** (`GOAL_TENURE_PREFERENCE`), not a second opinion
 * about it. If a goal's preference ever changes, this sentence follows it
 * automatically instead of quietly becoming a lie.
 */
const ACKNOWLEDGEMENT_BY_PREFERENCE: Record<TenurePreference, string> = {
  shortest: 'We’ll prioritise shorter terms, so your money stays within reach.',
  'closest-to-horizon': 'We’ll prioritise deposits that mature closest to when you need the money.',
  longest: 'We’ll prioritise the longest terms available, to build toward your future.',
};

export function acknowledgementFor(goalType: GoalType): string {
  return ACKNOWLEDGEMENT_BY_PREFERENCE[GOAL_TENURE_PREFERENCE[goalType]];
}

/**
 * The customer-facing label for each rule that can produce a reason.
 *
 * **Exhaustive over `RuleId`** — a `Record`, not a partial map, so adding a rule
 * to the engine is a compile error here rather than a blank line on the screen.
 *
 * Rule ids are internal vocabulary and must never reach the DOM. The engine's
 * own `reason.text` is the detail sentence; this is the four-word summary that
 * goes beside a tick. Neither invents a claim: every label restates a rule that
 * fired.
 */
export const RULE_LABELS: Record<RuleId, string> = {
  'R-ELIG-001': 'Senior-citizen rate applied',
  'R-TENURE-001': 'Matches your timeline exactly',
  'R-TENURE-003': 'Shorter term keeps it available',
  'R-GOAL-001': 'Suits an emergency fund',
  'R-GOAL-002': 'Matures close to when you need it',
  'R-GOAL-003': 'Builds toward your future',
  'R-TARGET-001': 'Meets your target',
  'R-TARGET-002': 'Falls short of your target',
  'R-TARGET-003': 'Ways to close the gap',
  '§8.investment-amount': 'Fits your investment amount',
  '§8.tenure-constraints': 'Rate published for your amount',
  '§11.deposit-insurance': 'Deposit-insurance cover considered',
};

/**
 * Horizon presets, in months (decision A3).
 *
 * These describe **the customer's need**, not the catalogue's terms. Five years
 * is offered even though the longest deposit on the platform runs 36 months,
 * because a customer who needs money in five years has that need whether or not
 * a product serves it — and the honest response is to show them the gap, which
 * the engine already produces as a warning on every recommendation.
 *
 * Capping the list at what the catalogue can match would hide a real limitation
 * behind a control that looks complete.
 */
export const HORIZON_PRESETS: readonly { months: number; label: string }[] = [
  { months: 6, label: '6 months' },
  { months: 12, label: '1 year' },
  { months: 24, label: '2 years' },
  { months: 36, label: '3 years' },
  { months: 60, label: '5 years' },
] as const;

/**
 * One line under each question saying **why it is being asked**.
 *
 * A customer who understands why a planner wants a number answers it more
 * readily than one who is simply presented with a field. Each line describes
 * what the engine does with the answer and nothing more — no promise, no claim.
 */
export const STEP_HINTS = {
  goal: 'We use this to decide which maturity dates suit you.',
  investor:
    'Some deposits publish a higher rate for senior citizens. The bank confirms eligibility at booking.',
  amount: 'We only show deposits that accept the amount you have.',
  horizon: 'We look for deposits that mature around the time you need the money.',
  target: 'If you have a figure in mind, we’ll tell you whether this plan reaches it.',
} as const;

/** The planner's five questions, for the progress rail. */
export const PLANNER_STEPS: readonly { id: string; label: string }[] = [
  { id: 'goal', label: 'Goal' },
  { id: 'investor', label: 'You' },
  { id: 'amount', label: 'Amount' },
  { id: 'horizon', label: 'When' },
  { id: 'target', label: 'Target' },
] as const;
