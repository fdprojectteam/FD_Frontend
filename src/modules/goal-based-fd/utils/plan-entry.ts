import { GOAL_TYPES } from '../constants/goals';
import type { GoalType } from '../types/goal';

/**
 * What Home hands to the canonical planner.
 *
 * ## Why the URL carries it
 *
 * Home and `/goal-planner/plan` are two routes. The customer's first two
 * answers — how much, and which goals — must survive the navigation between
 * them, and the alternatives were worse:
 *
 * - **A store** would make an entry screen own planner state, which is the
 *   duplicate source of truth this feature exists to avoid.
 * - **Session storage** would make a shareable planning link impossible and
 *   would resurrect work the customer had abandoned.
 *
 * The URL is the honest carrier: it is the seed for a plan the planner then
 * owns entirely, it survives a refresh, and it can be shared or bookmarked.
 *
 * ## It is a seed, not a plan
 *
 * Nothing here allocates, prices or recommends. The planner reads these two
 * values once, builds its own drafts from them, and from that moment
 * `useMultiGoalPlan` is the only authority — exactly as it is for a customer who
 * opened the route directly.
 *
 * ## Everything is validated, and nothing is invented
 *
 * An unusable total yields `null` and the planner opens empty; unknown goal
 * types are dropped rather than guessed at. A seed can only ever be a
 * shortcut — never a source of a figure the customer did not state.
 *
 * Pure and React-free.
 */
export const PLAN_TOTAL_PARAM = 'total';
export const PLAN_GOALS_PARAM = 'goals';

export interface PlanEntrySeed {
  /** Rupees, or `null` when nothing usable was supplied. */
  totalAmount: number | null;
  /** The goal types to open with, in the order chosen. Empty when none. */
  goalTypes: readonly GoalType[];
}

export const EMPTY_PLAN_ENTRY_SEED: PlanEntrySeed = { totalAmount: null, goalTypes: [] };

/** Digits only — the same rule the amount fields apply, applied at the boundary. */
function parseTotal(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const total = Number(trimmed);
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

/**
 * Goal types from a comma-separated list.
 *
 * Unknown values are dropped and duplicates collapse: a seed names *which*
 * goals to open, and opening the same goal twice from a URL is a malformed
 * request rather than an instruction.
 */
function parseGoalTypes(raw: string | string[] | undefined): GoalType[] {
  if (typeof raw !== 'string') return [];

  const requested = raw.split(',').map((entry) => entry.trim());

  return GOAL_TYPES.filter((type) => requested.includes(type));
}

export function parsePlanEntrySeed(
  query: Record<string, string | string[] | undefined>,
): PlanEntrySeed {
  return {
    totalAmount: parseTotal(query[PLAN_TOTAL_PARAM]),
    goalTypes: parseGoalTypes(query[PLAN_GOALS_PARAM]),
  };
}

/**
 * The query string for a seed, or `''` when there is nothing to carry.
 *
 * Keys are omitted rather than emitted empty, so a customer who entered nothing
 * gets the bare canonical route and not `?total=&goals=`.
 */
export function serialisePlanEntrySeed(seed: PlanEntrySeed): string {
  const params = new URLSearchParams();

  if (seed.totalAmount !== null && seed.totalAmount > 0) {
    params.set(PLAN_TOTAL_PARAM, String(seed.totalAmount));
  }
  if (seed.goalTypes.length > 0) {
    params.set(PLAN_GOALS_PARAM, seed.goalTypes.join(','));
  }

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}
