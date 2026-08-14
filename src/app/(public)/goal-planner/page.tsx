import type { Metadata } from 'next';
import { Suspense } from 'react';

import { GoalPlannerScreen } from '@/modules/goal-based-fd/components/goal-planner-screen';

/**
 * Goal planner route — the goal-led entry into the existing booking journey.
 *
 * A second **entry point**, not a second flow: it ends at
 * `/booking/{productId}/overview`, the same route a Marketplace product card
 * leads to. Nothing about Booking changes because the customer arrived by goal.
 *
 * ## Why the Suspense boundary
 *
 * The screen reads `?goal=` through `useSearchParams`, which opts the tree out
 * of prerendering. Without a boundary that bailout propagates to the whole
 * route. Same containment `/compare` already uses, and for the same reason.
 *
 * Metadata is static: MSW intercepts `/api/v1/*` in the browser only, so
 * `generateMetadata` would have nothing to fetch.
 */
export const metadata: Metadata = {
  title: 'Plan by goal — FD Investment Platform',
  description:
    'Tell us what you are saving for and see Fixed Deposit suggestions from our partner banks, with the reason for each one and the expected maturity.',
};

export default function GoalPlannerPage() {
  return (
    <Suspense>
      <GoalPlannerScreen />
    </Suspense>
  );
}
