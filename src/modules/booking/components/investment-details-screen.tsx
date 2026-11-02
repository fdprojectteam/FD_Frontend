'use client';

import { ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { ROUTES } from '@/constants/routes';

import { BookingStepActions } from './booking-step-actions';
import { EstimatedReturns } from './estimated-returns';
import { InvestmentAmountField } from './investment-amount-field';
import { PayoutOptionGroup } from './payout-option-group';
import { QuickAmountChips } from './quick-amount-chips';
import { TenureSelector } from './tenure-selector';
import { BOOKING_PHASES, resolveBookingPhase } from '../constants/phases';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';
import { validateAmount, validateInvestmentConfiguration } from '../utils/investment-schema';
import {
  defaultPayoutOption,
  reconcilePayoutOption,
  resolvePayoutOptions,
} from '../utils/payout-options';
import { resolveQuickAmounts } from '../utils/quick-amounts';
import { calculateReturns } from '../utils/returns';
import { defaultTenure, selectableTenures } from '../utils/tenure-rates';

/**
 * InvestmentDetailsScreen — step two of the approved booking journey
 * (T3.2.7 shell · T3.2.8 amount · T3.2.9 payout · T3.2.10 tenure).
 *
 * All four configuration regions are now live: amount with quick amounts,
 * tenure, interest payout, and the estimated returns strip. Two affordances the
 * approved artwork draws are **deliberately absent** — the tenure slider, whose
 * domain against a sparse rate card Design has not settled, and Custom tenure,
 * which cannot resolve against an exact-match rate card without inventing a
 * rate. Both are recorded in `tenure-selector.tsx`, not forgotten.
 *
 * **The route's sole owner** (invariant I3/I2a, as on every other screen in this
 * codebase): it reads the draft, derives the row model, and will hand sections
 * plain values and callbacks. The sections beneath own no state, no router and
 * no query.
 *
 * ## What it consumes, and what it refuses to do
 *
 * The domain layer is complete (T3.2.4 – T3.2.6), and this screen consumes it
 * rather than restating any of it:
 *
 * - the configured rail's rows come from `buildConfiguredSummaryRows`, which
 *   resolves the rate through `resolveTenureRate`
 * - the configuration itself comes from `useBookingDraft`, seated on the
 *   `/booking/[productId]` layout so it survives a trip to the next step
 *
 * Nothing here calculates a return, validates a value, or navigates. Those have
 * owners already, and a screen that re-derived any of them would be the second
 * opinion the module has spent four tasks avoiding.
 *
 * ## Layout, from the approved artwork
 *
 * A full-width header (back link, progress rail, title block) over a two-column
 * body: the configuration card at two thirds, the summary and disclosure rail at
 * one third, collapsing to a single column below `md` with the rail *after* the
 * card in source order — the same reading sequence at both widths, and the same
 * choice `BookingOverviewScreen` made.
 *
 * **No assurance strip.** The Overview screen carries one; this screen does not,
 * and the artwork is explicit about that. Adding it "for consistency" would be
 * the redesign this task forbids.
 */
export interface InvestmentDetailsScreenProps {
  productId: string;
}

export function InvestmentDetailsScreen({ productId }: InvestmentDetailsScreenProps) {
  /*
    The same deposit Overview and Nominee are using, resolved once by the layout.
    This screen previously defaulted to a hardcoded fixture, so a booking for one
    product would have priced another product's terms.
  */
  const { deposit } = useBookingProduct();
  const { draft, setInvestment } = useBookingDraft();
  const { investment } = draft;

  const phaseId = resolveBookingPhase('investment');

  /**
   * Whether the amount field has been left at least once.
   *
   * The *only* piece of state this screen owns beyond the draft, and it is
   * genuinely local: whether the user has finished with a field is a property of
   * this visit, not of the booking, and persisting it would mean a resumed
   * draft opened mid-scold.
   *
   * It gates the error **message**, never the validation — see
   * `InvestmentAmountField`.
   */
  const [amountTouched, setAmountTouched] = useState(false);

  /**
   * The chips this product may offer — filtered against its own limits, so
   * every rendered chip is a value the user can actually invest (C3b).
   */
  const quickAmounts = useMemo(() => resolveQuickAmounts(deposit.terms), [deposit.terms]);

  /** The payout cards this product offers — spec 21b §D, five narrowed to three. */
  const payoutOptions = useMemo(() => resolvePayoutOptions(deposit.terms), [deposit.terms]);

  /**
   * The tenures this product actually prices (T3.2.10).
   *
   * Derived from the rate card, never from `tenureRange` — the range is the
   * advertised family ("7 Days – 10 Years") and the card is what the bank has
   * quoted. With today's single-row fixture this yields **one** chip; supplying
   * more rows renders more chips with no code change here or in the selector.
   */
  const tenures = useMemo(() => selectableTenures(deposit.terms), [deposit.terms]);

  /**
   * Seed the default tenure once, on first arrival — the same contract the
   * payout seeding follows, and for the same reason: a screen that priced a
   * tenure the draft did not hold would disagree with Review about what was
   * chosen. Guarded on `null`, so it never overrides a user's choice or a
   * resumed draft.
   */
  useEffect(() => {
    if (investment.tenureMonths !== null) return;

    const fallback = defaultTenure(deposit.terms);
    if (fallback === null) return;

    setInvestment({ tenureMonths: fallback });
  }, [investment.tenureMonths, deposit.terms, setInvestment]);

  /**
   * Seed the default payout once, on first arrival (T3.2.9).
   *
   * Not a render-time fallback. Showing "At Maturity" selected while the draft
   * held `null` would mean the screen priced one thing and Review read another —
   * the screen and the record must not disagree about what was chosen. Writing
   * it makes the default a real decision the rest of the journey can see.
   *
   * Guarded on `null`, so it runs once and never overrides a user's choice or a
   * resumed draft. A product offering no payout at all yields `null` from
   * `defaultPayoutOption` and nothing is written.
   */
  useEffect(() => {
    if (investment.payoutOption !== null) return;

    const fallback = defaultPayoutOption(deposit.terms);
    if (fallback === null) return;

    setInvestment({ payoutOption: fallback });
  }, [investment.payoutOption, deposit.terms, setInvestment]);

  /**
   * The amount's verdict, recomputed on every change (FR-CONF-001). The message
   * is withheld until the field has been left once; the *validation* is not.
   */
  const amountError = useMemo(
    () => validateAmount(investment.amount, deposit.terms),
    [investment.amount, deposit.terms],
  );

  /**
   * The whole configuration's verdict — what Continue is gated on (FR-CONF-001).
   *
   * The screen decides nothing: `validateInvestmentConfiguration` owns which
   * fields are required, what each product accepts, and what to say about it.
   * It is asked against the **product's own** supported payouts, so a payout the
   * deposit does not offer cannot pass here even if the draft holds one.
   */
  const validation = useMemo(
    () =>
      validateInvestmentConfiguration(investment, deposit.terms, deposit.terms.supportedPayouts),
    [investment, deposit.terms],
  );

  /**
   * Every figure in the returns strip, from the domain layer (T3.2.5).
   *
   * `null` until the configuration can be priced — which, until T3.2.9 and
   * T3.2.10 ship the payout and tenure controls, it cannot be. The strip renders
   * its awaiting state rather than zeros, because a zero maturity value is a
   * claim about the deposit and an absent one is the truth.
   *
   * Guarded on `amountError` as well as on the nulls: a below-minimum amount is
   * arithmetically priceable and must not be priced, or the screen would quote a
   * return for a deposit the bank would refuse.
   */
  const returns = useMemo(() => {
    if (amountError !== null) return null;
    if (investment.amount === null || investment.tenureMonths === null) return null;
    if (investment.payoutOption === null) return null;

    return calculateReturns({
      principal: investment.amount,
      tenureMonths: investment.tenureMonths,
      payoutOption: investment.payoutOption,
      terms: deposit.terms,
    });
  }, [amountError, investment, deposit.terms]);

  /**
   * Continue advances to Nominee (T3.2.12, now wired).
   *
   * Through `useBookingStep`, like every other step: it records that this step
   * was completed *before* navigating, so the destination's guard sees a draft
   * that already knows. The screen names no route — `BOOKING_STEP_ROUTES` owns
   * the ordering, so inserting a step is one edit there and none here.
   */
  const { continueTo: handleContinue } = useBookingStep('investment', productId);

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
          Four phases, not eight steps (T3.2.1). Overview and Investment Details
          are both "Details", so this rail looks identical to the previous
          screen's — which is the Founder Note's model working as intended, and
          also the reason R-F2 is on the risk register.
        */}
        {phaseId ? (
          <Stepper steps={[...BOOKING_PHASES]} currentStepId={phaseId} label="Booking progress" />
        ) : null}

        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-content">Investment Details</h1>
          <p className="text-body-lg text-content-muted">
            Enter your investment amount, choose tenure and payout option to see your estimated
            returns.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-1 md:gap-8">
          {/* Two thirds on desktop, first everywhere — it is what the user came to do. */}
          <div className="md:col-span-2">
            <Card variant="outlined">
              <div className="flex flex-col gap-8 p-5 md:p-6">
                {/*
                  Each region is a labelled `<section>` with its approved
                  heading, so the document outline is complete before the
                  controls arrive and each later task drops its control into a
                  region that already announces itself. The headings are the
                  artwork's own wording.
                */}
                {/*
                  Field and chips share a row from `md` and stack below it, as
                  drawn. The field takes the wider column: it is the control the
                  user reaches for, and the chips are the shortcut.
                */}
                <ConfigurationRegion title="Investment Amount">
                  {/*
                    Named for what the customer is doing here. Both entry paths
                    arrive with an amount already established — the goal
                    planner's, or the one they calculated with on the product
                    page — so this step reviews a configuration rather than
                    collecting one. The field stays editable because the product
                    genuinely allows a different amount.
                  */}
                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto] md:gap-6">
                    <InvestmentAmountField
                      value={investment.amount}
                      minInvestment={deposit.terms.minInvestment}
                      maxInvestment={deposit.terms.maxInvestment}
                      maxInvestmentPublished={
                        deposit.demoTerms?.includes('max-investment') !== true
                      }
                      error={amountTouched ? amountError : null}
                      onBlur={() => setAmountTouched(true)}
                      onChange={(amount) => setInvestment({ amount })}
                    />

                    <QuickAmountChips
                      amounts={quickAmounts}
                      selectedAmount={investment.amount}
                      /*
                        Pressing a chip is a completed decision, so the field
                        counts as visited from that moment — otherwise a chip
                        could set an amount and the message for it would stay
                        hidden until the user happened to focus the input.
                      */
                      onSelect={(amount) => {
                        setAmountTouched(true);
                        setInvestment({ amount });
                      }}
                    />
                  </div>
                </ConfigurationRegion>

                <ConfigurationRegion title="Tenure">
                  {/*
                    Chips only. The approved artwork also draws a slider and a
                    Custom affordance; both are deliberately unbuilt — the
                    slider needs a domain decision Design has not made, and
                    Custom cannot resolve against an exact-match rate card
                    without inventing a rate.

                    Changing tenure reconciles the payout in the same write, so
                    the two can never be momentarily inconsistent.
                  */}
                  <TenureSelector
                    tenures={tenures}
                    value={investment.tenureMonths}
                    onChange={(tenureMonths) =>
                      setInvestment({
                        tenureMonths,
                        payoutOption: reconcilePayoutOption(deposit.terms, investment.payoutOption),
                      })
                    }
                  />
                </ConfigurationRegion>

                <ConfigurationRegion
                  title="Interest Payout Options"
                  titleAdornment={
                    <Info aria-hidden="true" className="text-content-muted size-4 shrink-0" />
                  }
                >
                  {/*
                    The region's own `h2` is the approved heading, so the
                    fieldset's legend is hidden rather than repeated — it stays
                    the group's accessible name without announcing the same
                    words twice.
                  */}
                  <PayoutOptionGroup
                    options={payoutOptions}
                    value={investment.payoutOption}
                    onChange={(payoutOption) => setInvestment({ payoutOption })}
                  />
                </ConfigurationRegion>

                <ConfigurationRegion title="Estimated Returns">
                  <EstimatedReturns result={returns} />
                </ConfigurationRegion>
              </div>
            </Card>
          </div>

          {/* <div className="flex flex-col gap-6">
            <InvestmentSummary
              rows={summaryRows}
              header={
                <div className="flex items-center gap-3">
                  <BankBadge bank={deposit.bank} size="lg" decorative={false} />

                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-body-lg text-content font-semibold">{deposit.productName}</p>

                    {deposit.isPreferredPartner ? (
                      <Badge size="sm" className="w-fit">
                        Preferred Partner
                      </Badge>
                    ) : null}
                  </div>
                </div>
              }
            />
            <ImportantInformation
              notes={investmentInformation}
              variant="checklist"
              headingLevel={2}
            />
          </div> */}
        </div>

        {/*
          Continue is gated on the **domain verdict**, exactly as Nominee's is.

          It previously carried a bare `continueDisabled` — which in JSX is
          `true` — from the period when Nominee had no route to advance to. The
          destination has existed since the journey was completed, so the
          hardcoded disable was the only thing standing between a valid
          configuration and the next step: the button could never enable, for
          any product, on either entry path.

          Replaced with the validator that was written for this and had no call
          site: amount within the product's limits, a tenure it actually prices,
          and a payout it offers. `handleContinue` records the step and
          navigates through `useBookingStep`, so no route is named here.
        */}
        <BookingStepActions
          /* The step before this one is Investor Verification (doc 07 Stage 3). */
          backHref={ROUTES.bookingIdentity(productId)}
          backLabel="Back"
          continueLabel="Continue"
          continueDisabled={!validation.isValid}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}

/**
 * One titled region of the configuration card.
 *
 * A local composition helper, not a platform component: it exists so the four
 * regions cannot drift apart in heading level, spacing or labelling, and it has
 * no meaning outside this screen. Promoting it would be the mistake CLAUDE.md
 * warns about in the other direction — a shared component nobody else shares.
 */
function ConfigurationRegion({
  title,
  titleAdornment,
  children,
}: {
  title: string;
  titleAdornment?: ReactNode;
  children?: ReactNode;
}) {
  /*
    Named regions, so a screen-reader user can jump between the four decisions
    this screen asks for rather than reading through them. An unnamed <section>
    is a generic container and would give them nothing to navigate by — the
    same `aria-labelledby` pattern `SelectedFdSummary` and `InvestmentSummary`
    already use.
  */
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2
        id={headingId}
        className="text-body-lg text-content flex items-center gap-2 font-semibold"
      >
        {title}
        {titleAdornment}
      </h2>
      {children}
    </section>
  );
}
