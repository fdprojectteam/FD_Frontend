'use client';

import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId } from 'react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { defaultFundingAccount, isUsableForFunding } from '@/utils/bank-account';

import { BankAccountOption } from './bank-account-option';
import { BookingStepActions } from './booking-step-actions';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { ImportantInformation } from './important-information';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';

/**
 * BankAccountScreen — step four of the approved booking journey (spec 21e).
 *
 * ## What it decides
 *
 * One thing: which saved account funds this deposit. **The id goes to the
 * draft, and nothing else** — no bank name, no IFSC, no four digits. The
 * accounts themselves come from the customer's vault through the platform hook
 * (Module 11), so this screen displays what the vault owns and Booking holds a
 * reference to it. An account edited in the vault is edited here, because there
 * is only one record.
 *
 * ## Only verified accounts may be selected
 *
 * Spec 21e §8 Rule 3 blocks progression until verification succeeds. That is
 * applied to the *option* rather than to the Continue button, so an unverified
 * account cannot be chosen in the first place — a disabled Continue would leave
 * the customer looking at a selection the screen has silently rejected.
 *
 * ## Adding an account leaves the booking
 *
 * It is a vault action, not a booking step: an account added here belongs to
 * the customer afterwards, not to this deposit. The affordance therefore links
 * to the vault's own add flow rather than growing a second entry form inside
 * Booking — which is exactly the duplication this module was created to remove.
 * The booking is resumable by its own URL, so leaving and coming back loses
 * nothing.
 */
export interface BankAccountScreenProps {
  productId: string;
}

export function BankAccountScreen({ productId }: BankAccountScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, setBankAccountId } = useBookingDraft();
  const { isReady, continueTo } = useBookingStep('bank-account', productId);
  const { accounts, isLoaded: accountsLoaded } = useBankAccounts();

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
    if (!accountsLoaded) return;
    if (draft.bankAccountId !== null) return;

    const preferred = defaultFundingAccount(accounts);
    if (preferred) setBankAccountId(preferred.id);
  }, [isReady, accountsLoaded, accounts, draft.bankAccountId, setBankAccountId]);

  /*
    Continue is gated on a *verified* account being chosen — the same rule the
    options apply, asked again at the boundary. Two checks of one rule, guarding
    two different threats: a stale draft id and a mis-rendered option.
  */
  const selected = accounts.find((account) => account.id === draft.bankAccountId);
  const canContinue = selected !== undefined && isUsableForFunding(selected);

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

              {!accountsLoaded ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : accounts.length === 0 ? (
                <p className="text-body text-content-muted">
                  You have no saved bank accounts yet. Add one to fund this deposit.
                </p>
              ) : (
                accounts.map((account) => (
                  <BankAccountOption
                    key={account.id}
                    account={account}
                    name={groupName}
                    selected={draft.bankAccountId === account.id}
                    disabled={!isUsableForFunding(account)}
                    onSelect={() => {
                      setBankAccountId(account.id);
                    }}
                  />
                ))
              )}

              {/*
                Drawn as the artwork shows, and honest about its state. Not a
                button that opens nothing: an affordance that silently does
                nothing on a financial screen is worse than one that explains
                itself.
              */}
              <Link
                href={ROUTES.bankAccountNew}
                className="focus-ring rounded-card border-border-default hover:border-border-primary/60 group flex items-start gap-3 border border-dashed p-4 transition-colors"
              >
                <span className="bg-surface-brand-subtle text-content-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Plus aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body text-content font-semibold">Add a bank account</span>
                  <span className="text-caption text-content-muted">
                    Added accounts live in your bank account vault and can be used for any
                    investment. Ownership is not verified in this build, so a new account cannot
                    fund a deposit until it is marked verified.
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="text-content-muted motion-safe:duration-base mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href={ROUTES.bankAccounts}
                className="focus-ring text-caption text-content-brand w-fit rounded-md font-medium"
              >
                Manage your bank accounts
              </Link>

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
