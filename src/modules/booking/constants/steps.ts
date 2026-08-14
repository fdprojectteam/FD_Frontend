import type { BookingStep } from '../types/booking';

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
