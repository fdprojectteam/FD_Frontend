'use client';

import { ChevronLeft } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { DataProvenanceNote, SafetyNote } from '@/components/business';
import { Stepper } from '@/components/ui/stepper';
import { ROUTES } from '@/constants/routes';

import { BookingAssuranceStrip } from './booking-assurance-strip';
import { BookingStepActions } from './booking-step-actions';
import { SelectedFdSummary } from './selected-fd-summary';
import { BOOKING_PHASES, resolveBookingPhase } from '../constants/phases';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';

/**
 * BookingOverviewScreen — step 1 of the approved booking journey (T3.1).
 *
 * The screen answers one question and collects nothing: *is this the Fixed
 * Deposit I meant to invest in?* Spec 21a is explicit that no data entry happens
 * here, which is why there is no form, no validation, and no draft state.
 *
 * **The route's sole owner** (invariant I3/I2a, as on every other screen in this
 * codebase): it holds the data, derives the row model, and hands sections plain
 * values and callbacks. The sections beneath own no state, no router and no
 * query, so any of them can be reused on a later step unchanged.
 *
 * **Data is a fixture, and the seam is real.** `overview` is a prop with a
 * fixture default, not an import buried three components down — so introducing
 * `useBookingOverview(productId)` is a change to this file's first three lines
 * and nothing else. The type it will return already exists.
 *
 * **What is deliberately absent.** No API calls (not yet specified), no booking
 * session (created on Continue, once the endpoint exists), no Save for Later
 * (the draft-persistence decision is still open, so the control is *hidden*
 * rather than shipped inert — an affordance that silently does nothing is worse
 * on a financial screen than one that is not there yet). Continue navigates
 * nowhere for the same reason step 2 does not exist; the callback is wired and
 * the destination is the one line that changes.
 *
 * Layout follows the approved screen: a full-width header with the stepper,
 * title and assurances, then a two-column body — the deposit on the left, the
 * terms and next step on the right — collapsing to one column below `md`, with
 * the summary *after* the deposit card in source order so the reading sequence
 * is the same at both widths.
 */
export interface BookingOverviewScreenProps {
  productId: string;
  /**
   * The amount the entry flow already established, or `null`.
   *
   * Parsed by the route from its own `searchParams`, so this screen receives a
   * number and never a URL. See `utils/entry-amount.ts` for why an amount may
   * cross the boundary when a rate may not.
   */
  entryAmount?: number | null;
}

export function BookingOverviewScreen({
  productId,
  entryAmount = null,
}: BookingOverviewScreenProps) {
  /*
    The deposit comes from the booking session, resolved once by the layout —
    not from a prop and not from a fixture. There is deliberately no way to hand
    this screen a different product from the one the other two steps are using.
  */
  const overview = useBookingProduct();

  const { deposit, assurances, importantInformation } = overview;

  const { draft, isHydrated, setInvestment, reset } = useBookingDraft();

  /**
   * Arriving at Overview **is** starting a booking.
   *
   * So a draft that is already confirmed belongs to a booking that is over, and
   * this is a new one. Without this, a completed booking sealed that product
   * forever: the guard saw `confirmedAt`, and choosing the same deposit again
   * bounced the customer to the Success screen of the booking they had already
   * finished.
   *
   * Resetting here — at the entry step, and only for a *finished* booking —
   * keeps every other guarantee intact. A booking in progress still survives a
   * refresh and Back, because it has no confirmation; a finished one still
   * reads as terminal from every later step.
   */
  const isFinished = draft.confirmation?.confirmedAt != null;

  useEffect(() => {
    if (!isHydrated || !isFinished) return;
    reset();
  }, [isHydrated, isFinished, reset]);

  /**
   * Seed the amount the entry flow already collected — **once, into the one
   * canonical draft**.
   *
   * This is the whole of the fix for the duplicate amount request. Goal-Based
   * FD and Comparison both establish an amount before the customer arrives
   * here; it simply had no way to travel. It now arrives on the entry route,
   * lands in `draft.investment.amount`, and from that point there is exactly one
   * authority for it — the same field every later step already reads. No second
   * draft, no parallel state, and nothing downstream knows an entry flow
   * existed.
   *
   * ## Three guards, each closing a different failure
   *
   * **`isHydrated`** — the draft is restored from storage in an effect, so
   * writing before that would overwrite a resumed booking with the URL's value.
   *
   * **`entryAmount !== null`** — a missing or unusable parameter writes nothing.
   * Investment Details then reports the amount as missing in its own words,
   * which is the existing intended behaviour. No minimum, quick amount or
   * product default is ever substituted.
   *
   * **`furthestStep === 'overview'`** — the customer has not yet reached the
   * screen where the amount is editable, so there is no edit of theirs to
   * overwrite. Past that point the draft wins, and a stale link cannot silently
   * change an amount they have since adjusted.
   */
  useEffect(() => {
    if (!isHydrated) return;
    /* Never seed into a finished booking — the reset above is about to replace it. */
    if (isFinished) return;
    if (entryAmount === null) return;
    if (draft.furthestStep !== 'overview') return;
    if (draft.investment.amount === entryAmount) return;

    setInvestment({ amount: entryAmount });
  }, [
    isHydrated,
    isFinished,
    entryAmount,
    draft.furthestStep,
    draft.investment.amount,
    setInvestment,
  ]);

  const phaseId = resolveBookingPhase('overview');

  /**
   * Continue moves to Investment Details (spec 21a §10).
   *
   * The booking *session* the spec also describes is a server concept and there
   * is still no endpoint for it; what exists is the draft, seated on the layout,
   * which `useBookingStep` advances before navigating. No session id appears in
   * the URL because none has been issued.
   */
  const { continueTo: handleContinue } = useBookingStep('overview', productId);

  return (
    <div className="flex flex-col gap-8 py-8 md:gap-10 md:py-12">
      <div className="container-page flex flex-col gap-8 md:gap-10">
        {/*
          The same back affordance the Marketplace screens use, in the same
          position and with the same treatment. The approved screen labels it
          "Back to Marketplace"; spec 21a §5 calls the secondary CTA "Back to
          Product". The design wins here and the bottom action row carries the
          product-level Back, so both destinations exist — worth confirming at
          sign-off.
        */}
        <Link
          href={ROUTES.home}
          className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to Marketplace
        </Link>

        {/*
          Four phases, not eight steps (T3.2.1). Overview and Investment Details
          are both "Details" — the Founder Note's first phase — so this screen
          and the next one show the same marker current. `resolveBookingPhase`
          owns that mapping; this screen only names the route it is.

          The null branch is the documented contract, not defensive padding:
          terminal outcomes (Success) render no rail, and passing null through
          would draw four *upcoming* phases on a finished booking.
        */}
        {phaseId ? (
          <Stepper steps={[...BOOKING_PHASES]} currentStepId={phaseId} label="Booking progress" />
        ) : null}

        {/*
          Title block and assurances share a row from `md` and stack below it.
          `items-start` rather than `items-center`: the title block is two lines
          and the assurance cards are one, and centring them would let the
          heading drift as the description wraps at different widths.
        */}
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 text-content">Booking Overview</h1>
            <p className="text-body-lg text-content-muted">
              Review the Fixed Deposit you’ve selected. Click “Continue” to proceed with your
              investment.
            </p>
          </div>

          <BookingAssuranceStrip assurances={assurances} />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-1 md:gap-8">
          {/* Two thirds on desktop, first everywhere — it is what the user came to check. */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <SelectedFdSummary deposit={deposit} importantInformation={importantInformation} />

            {/*
              The coverage note the client document requires "at the time of
              recommendation **and** booking". The recommendation side has had it
              since the Goal-Based FD reveal; this is the booking side.

              The same component as the recommendation renders, not a second
              copy: a compliance sentence maintained in two places drifts, and
              the drift is invisible until someone reads both screens.

              It sits below the deposit rather than in the assurance strip
              because the strip states what the platform undertakes to do, and
              this states a condition on the product itself.
            */}
            <div className="border-border-default rounded-card flex flex-col gap-3 border p-4">
              <SafetyNote />
              {/*
                And where the figures above came from. The two notes are
                adjacent because they answer the same question a customer asks
                at this moment — *what am I actually relying on here?* — and
                splitting them across the page would let one be read without
                the other.
              */}
              <DataProvenanceNote tone="booking" />
            </div>
          </div>

          {/* <div className="flex flex-col gap-6">
            <InvestmentSummary rows={summaryRows} />

            <Card variant="outlined" className="flex items-start gap-3 p-5">
              <span className="bg-surface-brand-subtle text-content-brand flex size-10 shrink-0 items-center justify-center rounded-full">
                <ChevronLeft aria-hidden="true" className="size-5 rotate-180" />
              </span>

              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-body-lg text-content font-semibold">Next Step</h2>
                <p className="text-body text-content-muted">{nextStep}</p>
              </div>
            </Card>
          </div> */}
        </div>

        <BookingStepActions
          backHref={ROUTES.product(productId)}
          backLabel="Back to product"
          continueLabel="Continue"
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}
