'use client';

import { Plus } from 'lucide-react';
import { useEffect, useId } from 'react';

import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';

import { BankAccountOption } from './bank-account-option';
import { BookingStepActions } from './booking-step-actions';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { ImportantInformation } from './important-information';
import { SAVED_BANK_ACCOUNTS } from '../fixtures/bank-accounts';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';

/**
 * BankAccountScreen — step four of the approved booking journey (spec 21e).
 *
 * ## What it decides
 *
 * One thing: which saved account funds this deposit. The id goes to the draft;
 * nothing else about the account is stored, and the account list is a fixture
 * transcribed from the approved artwork — see `fixtures/bank-accounts.ts` for
 * why, and for what the absent partner-bank configuration would otherwise
 * govern.
 *
 * ## Only verified accounts may be selected
 *
 * Spec 21e §8 Rule 3 blocks progression until verification succeeds. That is
 * applied to the *option* rather than to the Continue button, so an unverified
 * account cannot be chosen in the first place — a disabled Continue would leave
 * the customer looking at a selection the screen has silently rejected.
 *
 * ## Add New Bank Account is stated, not shipped
 *
 * §5C defers the field list to a rules engine that does not exist and §11 to a
 * verification service that does not exist. An entry form here would collect a
 * real account number into a platform with nothing to verify it against. The
 * affordance is drawn as the artwork shows and says plainly that it is not yet
 * available — the same treatment "Save for Later" already carries.
 */
export interface BankAccountScreenProps {
  productId: string;
}

export function BankAccountScreen({ productId }: BankAccountScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, setBankAccountId } = useBookingDraft();
  const { isReady, continueTo } = useBookingStep('bank-account', productId);

  const groupName = useId();

  /**
   * The primary account is pre-selected on arrival (spec 21e §Global 2, "Smart
   * Default Selection"), once, and only when the customer has chosen nothing.
   *
   * Guarded on `isReady` so it runs after hydration: seeding before the stored
   * draft is read would overwrite an account the customer picked earlier in
   * this same booking.
   */
  useEffect(() => {
    if (!isReady) return;
    if (draft.bankAccountId !== null) return;

    const preferred = SAVED_BANK_ACCOUNTS.find(
      (account) => account.isPrimary && account.verification === 'verified',
    );
    if (preferred) setBankAccountId(preferred.id);
  }, [isReady, draft.bankAccountId, setBankAccountId]);

  /*
    Continue is gated on a *verified* account being chosen — the same rule the
    options apply, asked again at the boundary. Two checks of one rule, guarding
    two different threats: a stale draft id and a mis-rendered option.
  */
  const selected = SAVED_BANK_ACCOUNTS.find((account) => account.id === draft.bankAccountId);
  const canContinue = selected !== undefined && selected.verification === 'verified';

  return (
    <BookingStepShell
      stepId="bank-account"
      title="Bank Account"
      isReady={isReady}
      description={
        <>
          Select an account for debit of principal amount and credit of maturity proceeds.
          <br />
          Ensure your account details are correct and active.
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="md:col-span-2">
          <Card variant="outlined">
            <fieldset className="flex flex-col gap-4 p-5 md:p-6">
              <legend className="text-body-lg text-content font-semibold">
                Select Funding &amp; Payout Account
              </legend>

              {SAVED_BANK_ACCOUNTS.map((account) => (
                <BankAccountOption
                  key={account.id}
                  account={account}
                  name={groupName}
                  selected={draft.bankAccountId === account.id}
                  disabled={account.verification !== 'verified'}
                  onSelect={() => {
                    setBankAccountId(account.id);
                  }}
                />
              ))}

              {/*
                Drawn as the artwork shows, and honest about its state. Not a
                button that opens nothing: an affordance that silently does
                nothing on a financial screen is worse than one that explains
                itself.
              */}
              <div className="rounded-card border-border-default flex items-start gap-3 border border-dashed p-4">
                <span className="bg-surface-brand-subtle text-content-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Plus aria-hidden="true" className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-body text-content font-semibold">Add New Bank Account</p>
                  <p className="text-caption text-content-muted">
                    Adding an account needs the partner bank&apos;s verification service, which is
                    not connected yet. Choose one of your verified accounts above.
                  </p>
                </div>
              </div>

              <ImportantInformation
                notes={[
                  'The selected account will be used to debit the principal amount.',
                  'Maturity proceeds will be credited to the same account.',
                  'Ensure the account is active and KYC compliant.',
                ]}
              />
            </fieldset>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={draft.investment} />

          <ImportantInformation
            notes={[
              '256-bit SSL encryption for all transactions',
              'Your bank details are secure and protected',
              'We never store your banking passwords',
            ]}
            title="Your Security is Our Priority"
            variant="checklist"
            headingLevel={2}
          />
        </div>
      </div>

      <BookingStepActions
        backHref={ROUTES.bookingNominee(productId)}
        backLabel="Back"
        continueLabel="Continue"
        continueDisabled={!canContinue}
        onContinue={continueTo}
      />
    </BookingStepShell>
  );
}
