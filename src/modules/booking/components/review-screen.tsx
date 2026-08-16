'use client';

import { BadgeCheck, ChartColumn, FileText, Landmark, Users } from 'lucide-react';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatRate, formatTenure } from '@/utils/format';

import { BookingStepActions } from './booking-step-actions';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { ImportantInformation } from './important-information';
import { ReviewSection } from './review-section';
import { PAYOUT_OPTION_LABELS } from '../constants/payout-options';
import { SAVED_BANK_ACCOUNTS } from '../fixtures/bank-accounts';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';
import { deriveBookingFigures } from '../utils/booking-figures';
import { formatMaturityDate } from '../utils/maturity-date';

/**
 * ReviewScreen — step five of the approved booking journey (spec 21f).
 *
 * ## It states, and never decides
 *
 * Every value on this screen is read from the deposit, the draft or
 * `deriveBookingFigures`. Nothing is computed here, and in particular no
 * maturity figure is stored and re-displayed — the rule from Document 09 §10,
 * which matters most on the last screen before money moves.
 *
 * ## The declarations gate Continue
 *
 * Spec 21f §8 Rule 3: the customer cannot proceed until the required
 * declarations are accepted. Both drawn checkboxes are treated as required
 * because both appear ticked on the approved screen and no source distinguishes
 * them. They live in the draft, so a trip back to fix a nominee does not silently
 * un-tick them — and, equally, so returning does not leave them ticked for a
 * booking whose figures have since changed. (They persist because §8 Rule 4
 * requires earlier steps to be editable without loss; a customer who edits the
 * *amount* re-reads the summary above the checkboxes before confirming.)
 *
 * ## ⚠ What Rule 1 asks for and this cannot do
 *
 * §8 Rule 1 requires product availability, rate, amount, bank policy, account
 * verification and nominee requirements to be **revalidated** before payment,
 * and §8 Rule 2 requires an explicit acknowledgement if the rate moved while the
 * customer was reading. Both need a booking API that can be asked; there is
 * none. The figures are therefore recomputed from the same catalogue the
 * recommendation and Investment Details used, which is as fresh as this
 * platform can currently be, and the gap is recorded rather than papered over.
 */
export interface ReviewScreenProps {
  productId: string;
}

export function ReviewScreen({ productId }: ReviewScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, setDeclarations } = useBookingDraft();
  const { isReady, continueTo, goToStep } = useBookingStep('review', productId);

  const { investment, declarations } = draft;

  /*
    The date the deposit would start from is *now* — it has not been paid for
    yet. Memoised on the draft so the maturity date does not shift a day each
    time React re-renders this screen at midnight.
  */
  const figures = useMemo(
    () =>
      deriveBookingFigures(
        deposit,
        investment.amount,
        investment.tenureMonths,
        investment.payoutOption,
        Date.now(),
      ),

    // deliberately captured once per configuration, not per render.
    [deposit, investment.amount, investment.tenureMonths, investment.payoutOption],
  );

  const account = SAVED_BANK_ACCOUNTS.find((entry) => entry.id === draft.bankAccountId);

  const canContinue =
    declarations.detailsConfirmed && declarations.termsAccepted && figures.returns !== null;

  const notStated = 'Not stated';

  return (
    <BookingStepShell
      stepId="review"
      title="Review & Confirm"
      isReady={isReady}
      description={
        <>
          Please review all the details carefully before confirming your investment.
          <br />
          By proceeding, you agree to the terms and conditions.
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="md:col-span-2">
          <Card variant="outlined">
            <div className="flex flex-col px-5 md:px-6">
              <ReviewSection
                icon={<ChartColumn aria-hidden="true" className="size-4" />}
                title="Investment Details"
                editLabel="Edit investment details"
                onEdit={() => {
                  goToStep('investment');
                }}
                fields={[
                  { label: 'Product', value: deposit.productName },
                  {
                    label: 'Interest Rate (p.a.)',
                    value:
                      figures.returns === null ? notStated : formatRate(figures.returns.annualRate),
                  },
                  {
                    label: 'Tenure',
                    value:
                      investment.tenureMonths === null
                        ? notStated
                        : formatTenure(investment.tenureMonths),
                  },
                  {
                    label: 'Interest Payout',
                    value:
                      investment.payoutOption === null
                        ? notStated
                        : PAYOUT_OPTION_LABELS[investment.payoutOption],
                  },
                ]}
              />

              <ReviewSection
                icon={<Users aria-hidden="true" className="size-4" />}
                title="Nominee Details"
                editLabel="Edit nominee details"
                onEdit={() => {
                  goToStep('nominee');
                }}
                fields={[
                  {
                    label: 'Nominee Type',
                    value:
                      draft.nominee.nominees.length > 1 ? 'Multiple Nominees' : 'Single Nominee',
                  },
                  {
                    label: 'Nominee Name',
                    /*
                      Nominee details are never persisted, so a refreshed
                      booking legitimately has none to show. The row says so
                      rather than rendering an empty cell that reads as a fault.
                    */
                    value: draft.nominee.nominees[0]?.fullName || 'Re-enter after refresh',
                  },
                  {
                    label: 'Relationship',
                    value: draft.nominee.nominees[0]?.relationship || '—',
                  },
                  {
                    label: 'Share of Proceeds',
                    value: draft.nominee.nominees[0]?.sharePercent
                      ? `${draft.nominee.nominees[0].sharePercent}%`
                      : '—',
                  },
                ]}
              />

              <ReviewSection
                icon={<Landmark aria-hidden="true" className="size-4" />}
                title="Bank Account Details"
                editLabel="Change bank account"
                onEdit={() => {
                  goToStep('bank-account');
                }}
                fields={[
                  { label: 'Bank Name', value: account?.bankName ?? notStated },
                  {
                    label: 'Account Type',
                    value:
                      account?.accountType === 'current' ? 'Current Account' : 'Savings Account',
                  },
                  {
                    label: 'Account Number',
                    value: account ? (
                      <>
                        <span aria-hidden="true">XXXX XXXX {account.lastFourDigits}</span>
                        <span className="sr-only">
                          ending {account.lastFourDigits.split('').join(' ')}
                        </span>
                      </>
                    ) : (
                      notStated
                    ),
                  },
                  { label: 'IFSC Code', value: account?.ifsc ?? notStated },
                ]}
              >
                {account?.verification === 'verified' ? (
                  <p className="text-caption text-success inline-flex items-center gap-1.5">
                    <BadgeCheck aria-hidden="true" className="size-4" />
                    Verified Account
                  </p>
                ) : null}
              </ReviewSection>

              <ReviewSection
                icon={<FileText aria-hidden="true" className="size-4" />}
                title="Investment Summary"
                editLabel="Edit investment amount"
                onEdit={() => {
                  goToStep('investment');
                }}
                fields={[
                  {
                    label: 'Investment Amount',
                    value:
                      investment.amount === null ? notStated : formatCurrency(investment.amount),
                  },
                  {
                    label: 'Maturity Amount (Est.)',
                    value:
                      figures.returns === null
                        ? notStated
                        : formatCurrency(figures.returns.maturityValue),
                  },
                  {
                    label: 'Total Interest (Est.)',
                    value:
                      figures.returns === null
                        ? notStated
                        : formatCurrency(figures.returns.totalInterest),
                  },
                  {
                    label: 'Maturity Date',
                    value:
                      figures.maturesOn === null
                        ? notStated
                        : formatMaturityDate(figures.maturesOn),
                  },
                ]}
              />
            </div>

            {/*
              The declarations. Real checkboxes with real labels: the whole
              control is clickable, the state is announced, and nothing here is
              styled into a div that a screen reader cannot operate.
            */}
            <div className="bg-surface-brand-subtle/40 m-5 flex flex-col gap-3 rounded-lg p-4 md:m-6">
              <label className="text-body text-content flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={declarations.detailsConfirmed}
                  onChange={(event) => {
                    setDeclarations({ detailsConfirmed: event.target.checked });
                  }}
                  className="accent-content-brand mt-1 size-4 shrink-0"
                />
                I confirm that the above details are correct and I wish to proceed with this
                investment.
              </label>

              <label className="text-body text-content flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={declarations.termsAccepted}
                  onChange={(event) => {
                    setDeclarations({ termsAccepted: event.target.checked });
                  }}
                  className="accent-content-brand mt-1 size-4 shrink-0"
                />
                I have read and agree to the Terms &amp; Conditions, Privacy Policy and FD specific
                terms provided by {deposit.bank.name}.
              </label>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={investment} />

          <ImportantInformation
            notes={[
              `Your FD will be created with ${deposit.bank.name}.`,
              'Interest rates are subject to change.',
              'Premature withdrawal is allowed as per bank policy.',
              'TDS will be applicable as per Income Tax Act.',
              'Please review all the details before proceeding.',
              'Once payment is successful, your FD will be created.',
            ]}
            variant="checklist"
            headingLevel={2}
          />
        </div>
      </div>

      <BookingStepActions
        backHref={ROUTES.bookingBankAccount(productId)}
        backLabel="Back"
        continueLabel="Confirm & Proceed to Payment"
        continueDisabled={!canContinue}
        onContinue={continueTo}
      />
    </BookingStepShell>
  );
}
