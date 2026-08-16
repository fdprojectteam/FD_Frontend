import type { Route } from 'next';

import { ROUTES } from '@/constants/routes';

import type { BookingStep, BookingStepId } from '../types/booking';

/**
 * The approved booking journey (T3.1).
 *
 * Declared once, here, because every one of the eight screens renders the same
 * rail and must agree with the others about what step it is on. A screen that
 * built its own list would be the way step five and step six come to disagree
 * about how many steps exist — and the stepper is the one element on the page
 * whose entire job is to be right about that.
 *
 * Order is meaningful: `Stepper` derives complete / current / upcoming from
 * position, so this array *is* the sequence. Inserting a step is an edit here
 * and nowhere else.
 *
 * Labels are the approved ones and are deliberately short — they sit in a rail
 * that must survive 320px.
 */
export const BOOKING_STEPS: readonly BookingStep[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'investment', label: 'Investment' },
  { id: 'nominee', label: 'Nominee' },
  { id: 'bank-account', label: 'Bank Account' },
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Payment' },
  { id: 'processing', label: 'Processing' },
  { id: 'success', label: 'Success' },
] as const;

/**
 * The route each step lives at — the single bridge between the state machine's
 * vocabulary and the URL's.
 *
 * A total `Record`, so adding a ninth step is a compile error here rather than a
 * guard that silently cannot navigate to it. Every entry goes through `ROUTES`;
 * no booking path is written as a string anywhere in this module.
 *
 * This is also what makes the convergence checkable: there is **one** map from
 * step to route, so a second booking flow would have to add a second map, and
 * an invariant asserts there is only one.
 */
export const BOOKING_STEP_ROUTES: Record<BookingStepId, (productId: string) => Route> = {
  overview: ROUTES.bookingOverview,
  investment: ROUTES.bookingInvestmentDetails,
  nominee: ROUTES.bookingNominee,
  'bank-account': ROUTES.bookingBankAccount,
  review: ROUTES.bookingReview,
  payment: ROUTES.bookingPayment,
  processing: ROUTES.bookingProcessing,
  success: ROUTES.bookingSuccess,
};

/** The route for one step of one product's booking. */
export function bookingStepRoute(stepId: BookingStepId, productId: string): Route {
  return BOOKING_STEP_ROUTES[stepId](productId);
}
