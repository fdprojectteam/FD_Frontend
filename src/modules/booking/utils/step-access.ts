import { BOOKING_STEPS } from '../constants/steps';
import type { BookingStepId } from '../types/booking';
import type { BookingDraft } from '../types/draft';

/**
 * Which step of a booking the customer may be on (BR-BOOK-002, FR-SYS-001).
 *
 * ## The rule
 *
 * > A user may open any step they have already reached, and no step beyond it.
 *
 * `furthestStep` is the high-water mark the draft already maintains — advanced
 * on Continue, never retreated by Back. So going back to change an amount is
 * free, and typing `/booking/fd-002/payment` into the address bar on a fresh
 * booking is not: BR-BOOK-002 forbids skipping states, and a payment screen
 * reached without an amount would be a screen asking for money it cannot name.
 *
 * ## Why this is a pure function and not a redirect
 *
 * The decision is a fact about a draft and a step id. Expressed here, it is
 * assertable for all sixty-four step pairs without a router, a DOM or a route.
 * `useBookingStepGuard` performs the navigation; it makes no judgement.
 *
 * ## Success is guarded on confirmation, not on position
 *
 * Reaching `success` by advancing through Processing is not sufficient on its
 * own — a booking is confirmed when the partner bank confirms it (spec 21i §8
 * Rule 1), and that fact lives on `confirmation.confirmedAt`. A refresh on a
 * paid-but-unconfirmed booking therefore resumes on Processing, which is where
 * the customer actually is.
 */
export interface StepAccess {
  allowed: boolean;
  /** Where to send the customer instead. Equal to `stepId` when allowed. */
  redirectTo: BookingStepId;
}

/** Position in the approved journey. `-1` for an id outside it. */
export function stepIndex(stepId: BookingStepId): number {
  return BOOKING_STEPS.findIndex((step) => step.id === stepId);
}

export function resolveStepAccess(stepId: BookingStepId, draft: BookingDraft): StepAccess {
  const furthest = draft.furthestStep;

  /*
    Success states that the deposit exists. Only a confirmed booking may say so,
    however far the draft's marker has advanced — Rule 1 of spec 21i, and the
    reason `confirmedAt` is nullable rather than absent.
  */
  if (stepId === 'success' && draft.confirmation?.confirmedAt == null) {
    return { allowed: false, redirectTo: furthest === 'success' ? 'processing' : furthest };
  }

  /*
    Equally, a confirmed booking must not be walked back into payment. The money
    has moved; re-entering the steps that move it is how a second payment gets
    attempted, which spec 21g §8 Rule 3 exists to prevent.
  */
  if (draft.confirmation?.confirmedAt != null && stepIndex(stepId) >= stepIndex('payment')) {
    return stepId === 'success'
      ? { allowed: true, redirectTo: 'success' }
      : { allowed: false, redirectTo: 'success' };
  }

  return stepIndex(stepId) <= stepIndex(furthest)
    ? { allowed: true, redirectTo: stepId }
    : { allowed: false, redirectTo: furthest };
}

/** The step after `stepId`, or `null` at the end of the journey. */
export function nextStep(stepId: BookingStepId): BookingStepId | null {
  const next = BOOKING_STEPS[stepIndex(stepId) + 1];
  return next?.id ?? null;
}
