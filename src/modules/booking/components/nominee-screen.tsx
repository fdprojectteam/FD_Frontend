'use client';

import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { BankBadge } from '@/components/business/bank-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { ROUTES } from '@/constants/routes';

import { BookingStepActions } from './booking-step-actions';
import { ImportantInformation } from './important-information';
import { InvestmentSummary } from './investment-summary';
import { NominationTypeGroup } from './nomination-type-group';
import { NomineeFields } from './nominee-fields';
import { BOOKING_PHASES, resolveBookingPhase } from '../constants/phases';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';
import { buildConfiguredSummaryRows } from '../utils/investment-summary';
import type { NomineeField } from '../utils/nominee-schema';
import { validateNomineeConfiguration } from '../utils/nominee-schema';

/**
 * NomineeScreen — step three of the approved booking journey (T3.3.2).
 *
 * **This is the shell.** The nominee form (name, relationship, date of birth,
 * guardian, share of proceeds), add/remove and the Nomination Type cards are
 * T3.3.3–T3.3.5, and one of them is blocked on business data — see below.
 *
 * ## Composed almost entirely from what already exists
 *
 * The right rail is **the same rail as Investment Details**, unchanged: the same
 * `InvestmentSummary` with the same bank header and the same
 * `buildConfiguredSummaryRows` row model, reading the same draft. The approved
 * artwork draws it identically on both screens, so it is reused rather than
 * rebuilt. The disclosure card beneath it is `ImportantInformation` in its
 * `checklist` variant with a different title — the prop that exists for exactly
 * this.
 *
 * `Stepper`, `BookingStepActions` and the back link are untouched.
 *
 * ## ⚠ Why the form is not here yet
 *
 * Spec 21d §8 Rule 3 requires the relationship to come "from supported values",
 * and **no supported values are enumerated in any of the 34 Booking analysis
 * documents**. Document 19 lists "Relationship Types" among the platform's
 * reference data without saying what is in it; the only concrete values anywhere
 * are two illustrations, "Brother" in the spec and "Wife" in the artwork.
 *
 * The approved design renders a `Select`. Populating it would be inventing
 * business data, so the form waits for the list rather than shipping a dropdown
 * someone made up. The domain beneath it is complete and tested
 * (`nominee-schema.ts`), and `SUPPORTED_RELATIONSHIPS` is the single edit that
 * unblocks it.
 *
 * ## Nominee data is not persisted
 *
 * The draft's nominee section is in memory only — names and dates of birth are
 * PII about a third party, and `PersistedBookingDraft` omits the section at the
 * type level. A refresh clears it. See `types/draft.ts`.
 */
export interface NomineeScreenProps {
  productId: string;
}

export function NomineeScreen({ productId }: NomineeScreenProps) {
  /*
    The same deposit the two steps before it are using, resolved once by the
    layout — so the right rail here cannot describe a different product from the
    one whose amount and tenure were just configured.
  */
  const { deposit, nominationInformation } = useBookingProduct();
  const { draft, setNominee, addNominee, removeNominee, updateNominee } = useBookingDraft();
  const { nominee } = draft;

  const phaseId = resolveBookingPhase('nominee');

  /**
   * Seed the first nominee row on arrival, so the screen opens on a form rather
   * than an empty card with an Add button.
   *
   * The same seeding contract tenure and payout follow, and guarded the same
   * way: it runs once, never overrides an existing row, and adds nothing if the
   * user has already removed everything down to zero and is mid-decision — the
   * guard is on length, and a removal that empties the list re-seeds, which is
   * correct because the validator requires at least one.
   */
  useEffect(() => {
    if (nominee.nominees.length === 0) addNominee();
  }, [nominee.nominees.length, addNominee]);

  /**
   * The whole nominee verdict, from the domain layer (T3.3.5).
   *
   * The screen consumes it and never re-derives any rule: which fields are
   * required, whether the shares reach 100%, and what to say about it all live
   * in `nominee-schema.ts`.
   */
  const validation = useMemo(() => validateNomineeConfiguration(nominee), [nominee]);

  /**
   * Field errors, indexed for display.
   *
   * Built once per validation rather than searched per field — with several
   * nominees and five fields each, a linear scan inside every input is a lot of
   * work to repeat for a list that was just computed.
   */
  const errorsByNominee = useMemo(() => {
    const byNominee = new Map<string, Partial<Record<NomineeField, string>>>();

    for (const error of validation.errors) {
      const existing = byNominee.get(error.nomineeId) ?? {};
      // First message per field wins; the schema emits at most one anyway.
      if (!existing[error.field]) existing[error.field] = error.message;
      byNominee.set(error.nomineeId, existing);
    }

    return byNominee;
  }, [validation.errors]);

  /**
   * The same rail as Investment Details, from the same row model and the same
   * draft — so the two screens cannot disagree about the deposit the user is
   * partway through booking.
   */
  const summaryRows = useMemo(
    () => buildConfiguredSummaryRows(deposit, draft.investment),
    [deposit, draft.investment],
  );

  /**
   * Continue advances to Bank Account, through the shared step hook — so the
   * high-water mark is recorded before the navigation and this screen names no
   * route of its own.
   */
  const { continueTo: handleContinue } = useBookingStep('nominee', productId);

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

        {phaseId ? (
          <Stepper steps={[...BOOKING_PHASES]} currentStepId={phaseId} label="Booking progress" />
        ) : null}

        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-content">Nominee Details</h1>
          {/*
            Two lines, as drawn. The second states that nomination is mandatory —
            the artwork's wording, reproduced as copy and deliberately not wired
            to any gate, because spec §8 Rule 1 makes the requirement conditional
            on a partner-bank policy the data does not carry.
          */}
          <p className="text-body-lg text-content-muted">
            Add a nominee who will receive the proceeds in case of an unfortunate event.
            <br />
            As per RBI guidelines, nomination is mandatory.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
          <div className="md:col-span-2">
            <Card variant="outlined">
              <div className="flex flex-col gap-6 p-5 md:p-6">
                {nominee.nominees.map((entry, index) => (
                  <NomineeFields
                    key={entry.id}
                    nominee={entry}
                    position={index + 1}
                    isPrimary={index === 0}
                    /* There must always be one nominee; the last row cannot be removed. */
                    canRemove={nominee.nominees.length > 1}
                    errors={errorsByNominee.get(entry.id) ?? {}}
                    onChange={(patch) => updateNominee(entry.id, patch)}
                    onRemove={() => removeNominee(entry.id)}
                  />
                ))}

                {/*
                  The approved "Important Information" note inside the card,
                  stating the 100% rule and who may be nominated. Plain variant,
                  as drawn — the checklist variant belongs to the rail.
                */}
                <ImportantInformation
                  notes={[
                    'The total share of all nominees must be equal to 100%.',
                    'Nominee can be a family member or any other individual.',
                  ]}
                />

                {/*
                  The running total, and the message when it misses 100%. Comes
                  straight from the validator — the screen never adds the shares
                  up itself.
                */}
                {validation.formErrors.length > 0 ? (
                  <p role="alert" className="text-caption text-error">
                    {validation.formErrors.join(' ')}
                  </p>
                ) : null}

                <Button variant="secondary" className="w-fit self-center" onClick={addNominee}>
                  <Plus aria-hidden="true" className="size-4" />
                  Add Nominee
                </Button>

                <div className="flex flex-col gap-4">
                  <h2 className="text-body-lg text-content font-semibold">Nomination Type</h2>
                  <NominationTypeGroup
                    value={nominee.nominationType}
                    onChange={(nominationType) => setNominee({ nominationType })}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
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
              notes={nominationInformation}
              title="Why Nomination is Important"
              variant="checklist"
              headingLevel={2}
            />
          </div>
        </div>

        {/*
          Continue is gated on the domain verdict — every required field present,
          every share in range, and the shares totalling exactly 100%. The screen
          asks `validateNomineeConfiguration`; it does not decide.
        */}
        <BookingStepActions
          backHref={ROUTES.bookingInvestmentDetails(productId)}
          backLabel="Back"
          continueLabel="Continue"
          continueDisabled={!validation.isValid}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}
