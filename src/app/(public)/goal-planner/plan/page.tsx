import type { Metadata } from 'next';

import { MultiGoalPlannerScreen } from '@/modules/goal-based-fd/components/multi-goal-planner-screen';

/**
 * Multi-goal planning route (client source document, Use Case 2).
 *
 * A sibling of `/goal-planner`, not a replacement: one goal is a sequence of
 * questions, several goals are a list. Both end at the same deposits and use the
 * same engine.
 *
 * No `Suspense` boundary here — unlike the single-goal planner this screen reads
 * no search params, so nothing opts the route out of prerendering.
 */
export const metadata: Metadata = {
  title: 'Plan across several goals — FD Investment Platform',
  description:
    'Give each of your goals its own amount and timeline, and see Fixed Deposit suggestions for each — with the reason for every placement and how it sits against deposit-insurance cover.',
};

export default function MultiGoalPlannerPage() {
  return <MultiGoalPlannerScreen />;
}
