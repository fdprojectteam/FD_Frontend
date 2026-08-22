import type { BookingPhase, BookingPhaseId, BookingStepId } from '../types/booking';

/**
 * The four progress steps the user is shown (T3.2.1).
 *
 * **Why four when there are eight routes.** The Founder Discussion Note
 * (`docs/engineering/00_Founder_Vision.md` §7) is explicit that Booking must
 * deliver *"four clear steps: Details, Nominee, Review, Pay & Confirm"* and must
 * avoid a long form-heavy process. The approved artwork, the Screen Inventory
 * (doc 20) and `BOOKING_STEPS` all describe eight. The Note is Priority 1, so it
 * governs what the indicator says; the eight routes remain because retiring a
 * signed-off screen was not the approved reconciliation.
 *
 * So there are two lists and they answer different questions:
 *
 *   BOOKING_STEPS  — where the user *is*      (routing, guards, resume)
 *   BOOKING_PHASES — what the user is *told*  (the progress indicator)
 *
 * `resolveBookingPhase` is the only bridge between them. A screen that picked
 * its own phase would be how step five and step six come to disagree about
 * which quarter of the journey they are in.
 *
 * **Recorded honestly:** this satisfies the Note's labelling more fully than its
 * intent — the user still visits eight screens. The lightness requirement is
 * therefore carried by the screens themselves (plan §5 D9, D11 and the
 * out-of-scope list), not by this file.
 *
 * Labels are the Note's own words, and short by necessity: four of them share a
 * rail that must survive 320px.
 */
export const BOOKING_PHASES: readonly BookingPhase[] = [
  { id: 'details', label: 'Details' },
  { id: 'nominee', label: 'Nominee' },
  { id: 'review', label: 'Review' },
  { id: 'pay-confirm', label: 'Pay & Confirm' },
] as const;

/**
 * Which phase each route belongs to.
 *
 * A total record rather than a partial one: `Record<BookingStepId, …>` means
 * adding a ninth step is a type error here rather than a step that silently
 * belongs to no phase and blanks the indicator.
 *
 * Two mappings are worth stating out loud:
 *
 * - **`processing` is Pay & Confirm**, not a fifth phase. The payment is still
 *   in flight; telling the user they have finished paying while the platform is
 *   waiting on the partner bank would contradict the state machine (doc 13
 *   Decision 01, which separates payment success from booking confirmation).
 * - **`success` is `null`** — a terminal outcome, not a step, and the contract
 *   for `null` is **render no progress indicator at all**.
 *
 *   This was very nearly written as "`Stepper` shows every phase complete for a
 *   null id", which is false: `findIndex` returns `-1`, and since no index is
 *   less than `-1`, every phase renders *upcoming* — a finished booking would
 *   show a rail on which nothing had been done. Verified before relying on it.
 *   Callers must branch on `null` rather than pass it through.
 */
const STEP_TO_PHASE: Record<BookingStepId, BookingPhaseId | null> = {
  overview: 'details',
  /*
    Identity verification belongs to **Details**, not to a fifth phase. The
    Founder Note fixes the visible phases at four, and verification is part of
    establishing the details of who is investing — it is not a separate stage of
    the journey from the customer's point of view.
  */
  identity: 'details',
  investment: 'details',
  nominee: 'nominee',
  'bank-account': 'pay-confirm',
  /*
    The application belongs to **Review**, not to a fifth phase. It is the
    document the customer is about to review — preparing it is part of that
    phase from their point of view, and the Founder Note fixes the visible
    markers at four.
  */
  application: 'review',
  review: 'review',
  payment: 'pay-confirm',
  processing: 'pay-confirm',
  success: null,
};

/**
 * The phase to mark current for a given route.
 *
 * `null` means **this route shows no progress indicator** — it is a terminal
 * outcome, not a position in the journey. Callers must handle it; passing it to
 * `Stepper` would render four upcoming phases on a completed booking.
 *
 * `Stepper` itself is untouched by T3.2.1. It already takes `steps` and a
 * `currentStepId`, so presenting phases instead of steps is a change to what it
 * is fed, not to how it works.
 */
export function resolveBookingPhase(stepId: BookingStepId): BookingPhaseId | null {
  return STEP_TO_PHASE[stepId];
}
