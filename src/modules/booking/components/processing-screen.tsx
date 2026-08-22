'use client';

import { Landmark } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/format';

import { BookingReferenceCard } from './booking-reference-card';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { ImportantInformation } from './important-information';
import { ProcessingTimeline, type ProcessingStage } from './processing-timeline';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';

/**
 * ProcessingScreen — step seven of the approved booking journey (spec 21h).
 *
 * ## ⚠ The progress here is a timer, and the spec says it should not be
 *
 * §8 Rule 1 is explicit: *"progress updates should reflect actual backend
 * events whenever possible, not arbitrary timers."* There is no backend and
 * therefore no event to reflect, so this screen advances on a timer — and says
 * so on the screen, rather than presenting a simulated bank confirmation as a
 * real one.
 *
 * When a booking API exists, the stages below are driven by its status and this
 * component's only change is where `stage` comes from. The shape is already
 * right: a list of stages and a current index.
 *
 * ## Idempotent by construction
 *
 * §8 Rule 2 requires submission to be idempotent — *"refreshing or reopening
 * the page must not create another booking."* Nothing is created here at all:
 * the reference was minted on Payment and `completeBooking` refuses to
 * re-confirm an already-confirmed draft. A refresh mid-processing resumes the
 * timer against the *stored* `paidAt`, so the customer does not restart a
 * two-minute wait they have already half-served.
 *
 * ## No Continue button
 *
 * The customer is waiting, not deciding. The screen advances itself, which is
 * why this is the one step with no `BookingStepActions` — a Continue here would
 * invite them to skip a confirmation that has not happened.
 */

/** How long the simulated partner-bank confirmation takes. */
const CONFIRMATION_DELAY_MS = 4000;

export interface ProcessingScreenProps {
  productId: string;
}

export function ProcessingScreen({ productId }: ProcessingScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, completeBooking } = useBookingDraft();
  const { isReady, continueTo } = useBookingStep('processing', productId);

  const confirmation = draft.confirmation;
  const paidAt = confirmation?.paidAt ?? null;
  const isConfirmed = confirmation?.confirmedAt != null;

  /*
    Elapsed time is measured from the *stored* payment moment, not from when
    this component mounted, so a refresh resumes rather than restarts. That is
    §8 Rule 3 ("background continuation") as far as a client-only build can
    honour it.
  */
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isReady || paidAt === null || isConfirmed) return;

    const tick = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => {
      clearInterval(tick);
    };
  }, [isReady, paidAt, isConfirmed]);

  const elapsed = paidAt === null ? 0 : now - paidAt;

  /*
    Confirmation is recorded once, in the draft, and then the screen advances.
    Splitting it in two — record here, navigate on the confirmed flag — means a
    refresh landing after confirmation still moves on rather than sitting on a
    finished timeline.
  */
  useEffect(() => {
    if (!isReady || paidAt === null) return;
    if (isConfirmed) return;
    if (elapsed < CONFIRMATION_DELAY_MS) return;

    completeBooking(Date.now());
  }, [isReady, paidAt, isConfirmed, elapsed, completeBooking]);

  useEffect(() => {
    if (!isReady || !isConfirmed) return;
    continueTo();

    // rebuilt each render; depending on it would re-navigate on every tick.
  }, [isReady, isConfirmed, continueTo]);

  const stages = useMemo<ProcessingStage[]>(() => {
    const state = (threshold: number): ProcessingStage['state'] =>
      isConfirmed || elapsed >= threshold
        ? 'complete'
        : elapsed >= threshold - CONFIRMATION_DELAY_MS / 2
          ? 'active'
          : 'upcoming';

    return [
      {
        id: 'payment-received',
        label: 'Payment Successful',
        description:
          draft.investment.amount === null
            ? 'Payment received.'
            : `${formatCurrency(draft.investment.amount)} payment received successfully.`,
        state: 'complete',
      },
      {
        id: 'payment-verified',
        label: 'Payment Verified',
        description: 'Your payment has been verified by our system.',
        state: state(CONFIRMATION_DELAY_MS / 2),
      },
      {
        id: 'creating',
        label: 'Creating Fixed Deposit',
        description: `We are creating your FD with ${deposit.bank.name}.`,
        state: isConfirmed ? 'complete' : 'active',
      },
      {
        id: 'confirmation',
        label: 'FD Confirmation',
        description: 'You will receive confirmation email and FD details.',
        state: isConfirmed ? 'complete' : 'upcoming',
      },
    ];
  }, [elapsed, isConfirmed, draft.investment.amount, deposit.bank.name]);

  return (
    <BookingStepShell
      stepId="processing"
      title="Your Investment is Being Processed"
      isReady={isReady}
      description={
        <>
          We are creating your Fixed Deposit with {deposit.bank.name}.
          <br />
          This usually takes a moment. Please do not close or refresh this page.
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="md:col-span-2">
          <Card variant="outlined" className="flex flex-col gap-6 p-5 md:p-6">
            <div className="flex flex-col items-center gap-3">
              {/*
                A turning ring around a still icon. The ring carries the "in
                progress" reading; the icon stays put so the centre of the
                screen is not moving while someone reads it. Rotation only —
                no pulse, no gradient sweep, no scale — and the global
                reduced-motion rule stops it, which is safe because the stage
                list below states the same thing in words.
              */}
              <span className="relative flex size-16 items-center justify-center">
                {isConfirmed ? null : (
                  <span
                    aria-hidden="true"
                    className="animate-processing-sweep border-border-default border-t-content-brand absolute inset-0 rounded-full border-2"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={
                    isConfirmed
                      ? 'border-success text-success absolute inset-0 rounded-full border-2'
                      : 'absolute inset-0'
                  }
                />
                <Landmark
                  aria-hidden="true"
                  className={isConfirmed ? 'text-success size-7' : 'text-content-brand size-7'}
                />
              </span>

              {/*
                `aria-live` on the heading region, so the state change is
                announced rather than only redrawn.
              */}
              <div aria-live="polite" className="flex flex-col items-center gap-1 text-center">
                <p className="text-body-lg text-content font-semibold">
                  {isConfirmed ? 'Fixed Deposit created' : 'Processing your FD…'}
                </p>
                <p className="text-caption text-content-muted">
                  {isConfirmed
                    ? 'Taking you to your confirmation.'
                    : 'Please wait while we confirm your payment and create your FD.'}
                </p>
              </div>
            </div>

            {confirmation ? <BookingReferenceCard reference={confirmation.reference} /> : null}

            <div className="flex flex-col gap-4">
              <h2 className="text-body-lg text-content font-semibold">Processing Status</h2>
              <ProcessingTimeline stages={stages} />
            </div>

            <p
              role="note"
              className="text-caption text-content-muted border-border-default rounded-card border border-dashed p-3"
            >
              Demonstration only — there is no partner bank connection, so these steps advance on a
              timer rather than reporting a real deposit being created.
            </p>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={draft.investment} />

          <ImportantInformation
            notes={[
              'You will receive an email with FD details once it is created.',
              'Your FD certificate will be available in your portfolio.',
              'Interest will start earning as per the FD terms.',
            ]}
            title="What Happens Next?"
            variant="checklist"
            headingLevel={2}
          />
        </div>
      </div>

      {/*
        No action row. The customer is waiting on a confirmation, not making a
        decision, and the only way back out is the header link — which is what
        the approved screen shows.
      */}
      <p className="text-caption text-content-muted">
        Closing this page will not cancel your investment.{' '}
        <a href={ROUTES.home} className="focus-ring text-content-brand rounded-md font-medium">
          Back to Marketplace
        </a>
      </p>
    </BookingStepShell>
  );
}
