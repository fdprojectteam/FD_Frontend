import type { Route } from 'next';

import type { GoalMarkKind } from '@/components/business';
import { ROUTES } from '@/constants/routes';

/**
 * The goal-planner entry points, as Marketplace states them.
 *
 * ## Why these carry a query parameter
 *
 * A customer who picks "Children's education" here has **answered the planner's
 * first question**. Linking to the bare route would discard that and ask again
 * on arrival — which is precisely the duplicate this exists to remove. The
 * planner validates the value and falls back to asking if it does not recognise
 * it, so the parameter is a hint rather than an instruction.
 *
 * ## Why this is duplicated rather than imported
 *
 * The three goals are declared in `@/modules/goal-based-fd/constants/goals`, and
 * Marketplace **may not import it** — module → module is forbidden
 * (`eslint.config.mjs`). Three labels restated where they are rendered is the
 * cheapest of the available options, and an invariant asserts the two lists
 * still name the same three goals.
 *
 * Nothing here is business data: no rate, no tenure, no rule.
 */
export interface GoalEntry {
  /**
   * Typed as `GoalMarkKind` rather than `string`, so the id that selects the
   * mark and the id that travels in the query parameter cannot drift apart — a
   * fourth goal is then a compile error here rather than a blank column.
   */
  id: GoalMarkKind;
  label: string;
  /** One line, in the customer's terms — what they are planning for. */
  description: string;
  focus: string;
  href: Route;
}

/*
  The lucide icons that used to sit here are gone. `GoalMark` draws each goal's
  actual tenure preference — a short closing arc, a path to a fixed milestone, a
  long reach to an open ring — which distinguishes the three by something true
  about them rather than by three unrelated pictograms.
*/
export const GOAL_ENTRIES: readonly GoalEntry[] = [
  {
    id: 'multiGoal',
    label: 'Multi Goal',
    description: 'For multiple goals with different timelines.',
    focus: 'Timeline • Maturity • Goal alignment',
    href: ROUTES.goalPlannerPlan,
  },
  {
    id: 'emergency',
    label: 'Emergency fund',
    description: 'For unexpected expenses and short-notice needs.',
    focus: 'Liquidity • Accessibility • Suitable tenure',
    href: `${ROUTES.goalPlanner}?goal=emergency` as Route,
  },
  {
    id: 'education',
    label: "Children's education",
    description: 'Build towards an education milestone with a defined timeline.',
    focus: 'Timeline • Maturity • Goal alignment',
    href: `${ROUTES.goalPlanner}?goal=education` as Route,
  },
  {
    id: 'retirement',
    label: 'Retirement',
    description: 'Build a long-term savings path for your future.',
    focus: 'Tenure • Maturity • Long-term fit',
    href: `${ROUTES.goalPlanner}?goal=retirement` as Route,
  },
] as const;
