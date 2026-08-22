'use client';

import { BadgeCheck, CircleAlert } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { IDENTITY_FIELD_LABELS, isIdentityCleared, type KycReadiness } from '@/utils/kyc/readiness';

import { BookingStepActions } from './booking-step-actions';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { IdentityAssurance } from './identity-assurance';
import { IdentityDetailList } from './identity-detail-list';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';

/**
 * IdentityScreen — Investor Verification, **Stage 3** of the approved
 * future-state journey (doc 07).
 *
 * ## Why it sits here and not later
 *
 * Doc 07 places verification immediately after the booking introduction and
 * *before* investment configuration: *"Instead of asking everything… determine
 * what already exists. Only request missing information."* Establishing who is
 * investing before asking them for an amount, a tenure and a nominee's details
 * is the order that makes the rest of the journey shorter.
 *
 * ## It asks for as little as the record allows
 *
 * The screen renders **one** of four outcomes, and `deriveKycReadiness` chooses
 * which. It never renders a field the platform already holds, and it never
 * renders a field it does not need:
 *
 * | Outcome | What the investor sees |
 * |---|---|
 * | `already-verified` | A confirmation, and Continue. Nothing to do. |
 * | `confirm-details` | Their details, prefilled, and one Confirm button. |
 * | `refresh-required` | The same, with the reason the record needs refreshing. |
 * | `collect-missing` | Only the fields genuinely absent. |
 *
 * ## What it does not do
 *
 * **No document upload, no selfie, no OTP.** None is required to satisfy any
 * outcome this build can reach: the platform already holds the record, and the
 * only usable route is confirming it. Adding an OTP step that verifies nothing
 * would be theatre on the screen where trust matters most — and it would be a
 * step an older investor has to complete for no benefit.
 *
 * The registry in `services/investor/kyc-methods.ts` is where DigiLocker, CKYC,
 * Aadhaar e-KYC and Video-CIP plug in. Each is declared and each is marked
 * `not-connected`, so none is offered as something that works.
 *
 * ## What is recorded
 *
 * A timestamp and a method id on the booking draft — never a copy of the
 * identity. The identity belongs to the Investor domain and is read from it, so
 * Portfolio will later read the same record rather than a second copy.
 */
export interface IdentityScreenProps {
  productId: string;
}

/** The heading for each outcome. Plain words, no abbreviation. */
const TITLE_BY_OUTCOME: Record<KycReadiness['outcome'], string> = {
  'already-verified': 'Your identity is verified',
  'confirm-details': 'Verify your identity',
  'refresh-required': 'Confirm your details',
  'collect-missing': 'A few details are missing',
};

export function IdentityScreen({ productId }: IdentityScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, confirmIdentity } = useBookingDraft();
  const { isReady, continueTo } = useBookingStep('identity', productId);
  const { identity, readiness, isPending, isError } = useInvestorIdentity();

  const hasConfirmed = draft.identity.confirmedAt !== null;

  const cleared = useMemo(
    () => (readiness === null ? false : isIdentityCleared(readiness, hasConfirmed)),
    [readiness, hasConfirmed],
  );

  /*
    Confirming and continuing are one action, because to the investor they are
    one decision. Recording first means the next step's guard already sees it.
  */
  const handleContinue = () => {
    if (readiness !== null && !hasConfirmed) {
      const method = readiness.usableMethods[0] ?? 'existing-kyc';
      confirmIdentity(method);
    }
    continueTo();
  };

  const description =
    readiness?.outcome === 'already-verified'
      ? 'We already have everything we need. You can carry straight on.'
      : 'We use the details below to securely prepare your FD application. Please check them and confirm — there is nothing to type.';

  return (
    <BookingStepShell
      stepId="identity"
      title={readiness === null ? 'Verify your identity' : TITLE_BY_OUTCOME[readiness.outcome]}
      isReady={isReady}
      description={description}
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="flex flex-col gap-6 md:col-span-2">
          {isPending ? (
            <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
              <span className="sr-only" role="status">
                Checking what we already know about you…
              </span>
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-32 w-full" />
            </Card>
          ) : isError || identity === null || readiness === null ? (
            /*
              No record, or the lookup failed. Stated plainly with a recovery,
              never as "KYC failed" — and the journey is not restarted: the
              amount, tenure and product chosen so far are untouched.
            */
            <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
              <p className="text-body-lg text-content flex items-center gap-2 font-semibold">
                <CircleAlert aria-hidden="true" className="text-content-muted size-5" />
                We couldn&apos;t check your details just now
              </p>
              <p className="text-body text-content-muted">
                This is usually temporary. Nothing you have entered has been lost — you can try
                again in a moment, and your booking will carry on from here.
              </p>
            </Card>
          ) : (
            /*
              **The same card rhythm as every other booking step.**

              This opened with an oversized shield, a badge and a "3 of 4
              details on file" counter — a different visual language from the
              screen immediately before it, which made identity read as a
              separate product rather than the next step of one booking. It is
              now a plain outlined card with a heading and the details, matching
              the deposit card on Overview; the Investment Summary rail beside
              it is literally the same component.
            */
            <Card variant="outlined" className="flex flex-col gap-5 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-body-lg text-content font-semibold">
                  {readiness.outcome === 'already-verified'
                    ? 'Verified with your existing records'
                    : 'Your details'}
                </h2>
                {identity.kyc.status === 'verified' ? (
                  <Badge size="sm" className="ml-auto">
                    <BadgeCheck aria-hidden="true" className="size-3.5" />
                    Verified
                  </Badge>
                ) : null}
              </div>

              <IdentityDetailList identity={identity} fields={readiness.knownFields} />

              {/*
                One line, not a block.

                "What happens when you confirm" — a heading, three bullets and a
                disclaimer — was compliance theatre: it answered questions the
                customer had not asked and made a two-second step look
                consequential. Trust comes from the screen being obviously
                simple.

                What survives is the one sentence that is load-bearing: nothing
                external has been checked. That is a statement about the
                platform's limits rather than reassurance, so removing it would
                be the dishonest edit.
              */}
              {readiness.outcome === 'already-verified' ? null : (
                <p role="note" className="text-caption text-content-muted">
                  Demonstration only — no external verification service is connected, so these
                  details have not been checked with a registry, DigiLocker or Aadhaar.
                </p>
              )}

              {readiness.missingFields.length > 0 ? (
                /*
                  The only branch that asks for anything, and it names exactly
                  what is outstanding. The POC has no route to collect these —
                  saying so is more honest than rendering inputs that go
                  nowhere.
                */
                <div className="border-border-default rounded-card border border-dashed p-4">
                  <p className="text-body text-content font-medium">
                    We still need:{' '}
                    {readiness.missingFields
                      .map((field) => IDENTITY_FIELD_LABELS[field])
                      .join(', ')}
                  </p>
                  <p className="text-caption text-content-muted mt-1">
                    Collecting these needs a verification service that is not connected in this
                    demonstration build.
                  </p>
                </div>
              ) : null}

              {readiness.outcome === 'refresh-required' ? (
                <p className="text-body text-content-muted">
                  Your record is due for a routine refresh. Confirming below updates it for this
                  application.
                </p>
              ) : null}

              <IdentityAssurance />
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={draft.investment} />
        </div>
      </div>

      <BookingStepActions
        backHref={ROUTES.bookingOverview(productId)}
        backLabel="Back"
        continueLabel={
          readiness?.outcome === 'already-verified' || hasConfirmed
            ? 'Continue'
            : 'Confirm & continue'
        }
        continueDisabled={
          isPending ||
          readiness === null ||
          (!cleared && !hasConfirmed && readiness.missingFields.length > 0)
        }
        onContinue={handleContinue}
      />
    </BookingStepShell>
  );
}
