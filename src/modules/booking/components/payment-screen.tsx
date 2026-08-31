'use client';

import { Building2, CreditCard, KeyRound, Landmark, Smartphone } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { RadioCardGroup } from '@/components/ui/radio-card-group';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/format';

import { BookingStepActions } from './booking-step-actions';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { ImportantInformation } from './important-information';
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from '../constants/payment-methods';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';
import type { PaymentMethodId } from '../types/draft';
import { buildBookingReference } from '../utils/booking-reference';

/**
 * PaymentScreen — step six of the approved booking journey (spec 21g).
 *
 * ## ⚠ No money moves
 *
 * There is no payment gateway, no payment order and no partner bank in this
 * codebase. Pressing "Make Payment" records that the customer chose to pay, mints
 * a local booking reference and advances to Processing. **Nothing is charged.**
 *
 * This is stated on the screen itself, not only in this comment: a payment
 * screen that looks real and silently does nothing is the single most dangerous
 * thing this module could ship, so the customer is told before they press it.
 *
 * ## What is real
 *
 * The amount. It is read from the draft the customer configured, and spec 21g
 * §8 Rule 1 — *"must exactly match the confirmed booking amount, no client-side
 * modification"* — is satisfied structurally: this screen has no control that
 * can change it, and the figure is the same `investment.amount` Review quoted.
 *
 * ## Duplicate protection
 *
 * §8 Rule 3 requires an idempotency key. `confirmPayment` is idempotent in the
 * state layer — a draft that already carries a confirmation is returned
 * unchanged — so a double-click, a StrictMode double-invoke or a replayed
 * effect cannot mint a second reference. That is deliberately not a disabled
 * button: a disabled button is a rendering detail, and this is money.
 */
const METHOD_ICONS: Record<PaymentMethodId, ReactNode> = {
  'net-banking': <Landmark aria-hidden="true" className="size-5" />,
  upi: <Smartphone aria-hidden="true" className="size-5" />,
  'debit-card': <CreditCard aria-hidden="true" className="size-5" />,
  'credit-card': <CreditCard aria-hidden="true" className="size-5" />,
  'neft-rtgs': <Building2 aria-hidden="true" className="size-5" />,
};

export interface PaymentScreenProps {
  productId: string;
}

export function PaymentScreen({ productId }: PaymentScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, setPaymentMethod, confirmPayment } = useBookingDraft();
  const { isReady, continueTo } = useBookingStep('payment', productId);

  const amount = draft.investment.amount;
  const method = draft.paymentMethod ?? DEFAULT_PAYMENT_METHOD;

  const options = useMemo(
    () =>
      PAYMENT_METHODS.map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        icon: METHOD_ICONS[entry.id],
      })),
    [],
  );

  const handlePay = () => {
    if (amount === null) return;

    /*
      Minted once, here, and stored — so Processing and Success quote the same
      reference the customer would write down. `confirmPayment` refuses a second
      one, which is where the idempotency actually lives.
    */
    confirmPayment({
      reference: buildBookingReference(deposit.bank.shortCode, Date.now()),
      paidAt: Date.now(),
      confirmedAt: null,
    });

    continueTo();
  };

  return (
    <BookingStepShell
      stepId="payment"
      title="Payment"
      isReady={isReady}
      description={
        <>
          Choose how you would pay. Your FD is created only after payment and bank
          <br />
          confirmation — neither of which happens in this build.
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="flex flex-col gap-6 md:col-span-2">
          <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-body-lg text-content font-semibold">Amount to Pay</h2>
              <p className="text-h2 text-content font-semibold tabular-nums">
                {amount === null ? 'Not set' : formatCurrency(amount)}
              </p>
            </div>

            {/*
              ⚠ Was "Secure Payment · All payments are encrypted and secure ·
              [256-bit SSL]" behind a green shield. Three assertions about a
              payment path that does not exist — the badge in particular named a
              cipher strength as though someone had configured one. The screen
              two paragraphs below already says no gateway is connected, so the
              page was contradicting itself: a customer reading top to bottom met
              "256-bit SSL" first and the truth second.

              What stands here now is the same reassurance a real payment screen
              owes, reduced to what holds: nothing is collected, so nothing can
              leak.
            */}
            <div className="border-border-default rounded-card flex items-center gap-3 border p-4">
              <KeyRound aria-hidden="true" className="text-content-brand size-5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-body text-content font-semibold">No payment details collected</p>
                <p className="text-caption text-content-muted">
                  No card, UPI or net-banking credential is asked for or stored.
                </p>
              </div>
            </div>

            {/*
              Said plainly, before the button rather than after it. The approved
              artwork draws a working payment screen; this platform has no
              gateway, and letting a customer believe otherwise for even one
              screen is not a trade worth making for fidelity.
            */}
            <p
              role="note"
              className="text-caption text-content-muted border-border-default rounded-card border border-dashed p-3"
            >
              Demonstration only — no payment gateway is connected, so no money is taken and no
              account is debited. Continuing records your choices and shows the confirmation
              journey.
            </p>
          </Card>

          <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
            <h2 className="text-body-lg text-content font-semibold">Choose Payment Method</h2>

            <RadioCardGroup<PaymentMethodId>
              label="Payment method"
              labelHidden
              options={options}
              value={method}
              onChange={setPaymentMethod}
            />

            {/*
              ⚠ "In case of payment failure, the amount will be refunded within
              3-5 working days" was a service-level promise about a refund
              process that does not exist, on a screen that takes no payment.
              The other two notes describe how an FD booking works and are kept.
            */}
            <ImportantInformation
              notes={[
                'Payment must be made from the selected bank account.',
                'Your FD is created only after the bank confirms the payment.',
                'Refunds on a failed payment are handled by the bank under its own terms.',
              ]}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={draft.investment} />

          {/*
            ⚠ Was "Your money is safe with us · RBI regulated partners ·
            Encrypted transactions · Our support team is here to help" — three
            claims on the one screen where a customer is deciding to part with
            money, and not one of them holds: no partner licence has been
            checked, no transaction is encrypted because no transaction occurs,
            and no support team exists. Replaced with what this step genuinely
            does, which a customer is better served by knowing here than
            discovering afterwards.
          */}
          <ImportantInformation
            notes={[
              'No payment is taken. This step records your choice of method and moves the booking on.',
              'You are never asked for a card number, UPI PIN or net-banking password.',
              'The deposit is not created with the bank. Nothing here is sent to one.',
            ]}
            title="What happens at this step"
            variant="checklist"
            headingLevel={2}
          />
        </div>
      </div>

      <BookingStepActions
        backHref={ROUTES.bookingReview(productId)}
        backLabel="Back"
        continueLabel={amount === null ? 'Make Payment' : `Pay ${formatCurrency(amount)}`}
        continueDisabled={amount === null}
        onContinue={handlePay}
      />
    </BookingStepShell>
  );
}
