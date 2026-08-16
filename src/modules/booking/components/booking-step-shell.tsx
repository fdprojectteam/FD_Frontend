'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Stepper } from '@/components/ui/stepper';
import { ROUTES } from '@/constants/routes';

import { BOOKING_PHASES, resolveBookingPhase } from '../constants/phases';
import type { BookingStepId } from '../types/booking';

/**
 * The chrome every booking step draws: back link, progress rail, title block.
 *
 * ## Why this exists now and did not before
 *
 * Three screens repeating a header is a repetition. Eight screens repeating it
 * is the thing that drifts — and the element most likely to drift is the
 * progress rail, whose entire job is to be right about where the customer is.
 * One shell means one `resolveBookingPhase` call site and one null branch for
 * the terminal step.
 *
 * The three existing screens are unchanged by this: it is additive, and they
 * keep their hand-written headers until there is a reason to touch them.
 *
 * ## Presentation only
 *
 * No draft, no router, no guard. It takes a step id and children. The screens
 * above it own the data; this owns the frame.
 */
export interface BookingStepShellProps {
  stepId: BookingStepId;
  title: string;
  /** One or two lines under the title, as the approved screens draw. */
  description?: ReactNode;
  /** False while the guard is still deciding — renders a skeleton instead. */
  isReady?: boolean;
  children: ReactNode;
}

export function BookingStepShell({
  stepId,
  title,
  description,
  isReady = true,
  children,
}: BookingStepShellProps) {
  const phaseId = resolveBookingPhase(stepId);

  return (
    <div className="flex flex-col gap-8 py-8 md:gap-10 md:py-12">
      <div className="container-page flex flex-col gap-8 md:gap-10">
        <Link
          href={ROUTES.home}
          className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to Marketplace
        </Link>

        {/*
          `null` is the documented contract for a terminal step, not an
          oversight: passing it to `Stepper` would draw four *upcoming* phases
          on a completed booking. Success is the one step that renders no rail.
        */}
        {phaseId ? (
          <Stepper steps={[...BOOKING_PHASES]} currentStepId={phaseId} label="Booking progress" />
        ) : null}

        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-content">{title}</h1>
          {description ? (
            <div className="text-body-lg text-content-muted">{description}</div>
          ) : null}
        </div>

        {isReady ? (
          children
        ) : (
          <div role="status" aria-busy="true" className="flex flex-col gap-4">
            <span className="sr-only">Loading your booking…</span>
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
