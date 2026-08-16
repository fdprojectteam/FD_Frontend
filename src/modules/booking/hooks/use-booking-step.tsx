'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useBookingDraft } from './use-booking-draft';
import { bookingStepRoute } from '../constants/steps';
import type { BookingStepId } from '../types/booking';
import { nextStep, resolveStepAccess } from '../utils/step-access';

/**
 * The step a screen is on: may the customer be here, and how do they leave.
 *
 * ## One hook, eight screens
 *
 * Every step needs the same three things — a guard, a way to advance, and the
 * route of the step before it. Written once here, they cannot disagree between
 * screens, which is the failure the eight-screen journey is most exposed to:
 * step six sending the customer somewhere step five did not expect.
 *
 * `continueTo()` **advances the high-water mark and then navigates**, in that
 * order. The reverse would race — the destination's own guard could run against
 * a draft that had not yet recorded the step being left.
 *
 * ## Why the guard waits for hydration
 *
 * The draft starts empty and is replaced from storage in an effect, so on the
 * first render of a resumed booking `furthestStep` is always `overview`. A
 * guard that ran then would bounce every direct link back to step one. It
 * therefore does nothing until `isHydrated`, and the screen renders its skeleton
 * meanwhile — `isReady` is what screens branch on.
 *
 * ## `replace`, not `push`
 *
 * A redirect the customer did not ask for must not become a history entry;
 * pushing one would make Back return to the step they were just refused.
 */
export interface BookingStepState {
  /** False while the draft is hydrating or a redirect is in flight. */
  isReady: boolean;
  /** Advance to the next step, recording that this one was completed. */
  continueTo: () => void;
  /** Jump to a specific step — the Review screen's "Edit" affordances. */
  goToStep: (stepId: BookingStepId) => void;
}

export function useBookingStep(stepId: BookingStepId, productId: string): BookingStepState {
  const router = useRouter();
  const { draft, isHydrated, markStepReached } = useBookingDraft();

  const access = resolveStepAccess(stepId, draft);

  useEffect(() => {
    if (!isHydrated) return;
    if (access.allowed) return;

    router.replace(bookingStepRoute(access.redirectTo, productId));
  }, [isHydrated, access.allowed, access.redirectTo, productId, router]);

  const continueTo = () => {
    const target = nextStep(stepId);
    if (target === null) return;

    /*
      Recorded before the navigation, so the destination's guard sees a draft
      that already knows this step was completed.
    */
    markStepReached(target);
    router.push(bookingStepRoute(target, productId));
  };

  const goToStep = (target: BookingStepId) => {
    router.push(bookingStepRoute(target, productId));
  };

  return { isReady: isHydrated && access.allowed, continueTo, goToStep };
}
