'use client';

import { ArrowRight, CalendarClock, CircleCheck, Landmark, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { usePortfolio } from '@/hooks/use-portfolio';
import { formatCurrency } from '@/utils/format';

import { BookingCelebration } from './booking-celebration';
import { BookingReferenceCard } from './booking-reference-card';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { ImportantInformation } from './important-information';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';
import { deriveBookingFigures } from '../utils/booking-figures';
import { formatMaturityDate } from '../utils/maturity-date';
import { toMaturityInstruction } from '../utils/maturity-instruction';

/**
 * SuccessScreen — step eight, the terminal outcome (spec 21i).
 *
 * ## Reachable only when the booking is confirmed
 *
 * Spec 21i §8 Rule 1 requires payment confirmation, partner bank confirmation
 * and FD creation before this screen is shown. `resolveStepAccess` enforces
 * that on `confirmation.confirmedAt` rather than on the step marker, so typing
 * this URL — or refreshing mid-processing — lands on Processing instead.
 *
 * ## No progress rail
 *
 * `resolveBookingPhase('success')` returns `null`, and the contract for `null`
 * is *render nothing*. Passing it to `Stepper` would draw four **upcoming**
 * phases on a completed booking, which is why the shell branches rather than
 * forwarding it.
 *
 * ## The draft is not reset here
 *
 * `reset()` exists and is deliberately not called. A customer who refreshes
 * Success must still see their booking; wiping the draft on arrival would make
 * the screen unreachable a second later and take the reference with it.
 *
 * ## ⚠ Portfolio does not exist
 *
 * The spec's primary CTA is "View Portfolio" and §8 Rule 3 requires the
 * investment to appear there. **There is no Portfolio module, no specification
 * for one and no approved artwork** — unlike every screen in this journey, all
 * of which were built from 21a–21i and signed-off PNGs.
 *
 * So the affordance is drawn and states that it is not yet available, the same
 * treatment "Save for Later" and "Add New Bank Account" already carry. Building
 * a portfolio from invented holdings would be the one thing this module has
 * consistently refused to do.
 */
export interface SuccessScreenProps {
  productId: string;
}

export function SuccessScreen({ productId }: SuccessScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft } = useBookingDraft();
  const { isReady } = useBookingStep('success', productId);
  const { record } = usePortfolio();
  const { accounts } = useBankAccounts();

  const confirmation = draft.confirmation;
  const account = accounts.find((entry) => entry.id === draft.bankAccountId);

  /*
    Derived from the moment the deposit was paid for, so the maturity date is
    stable across every visit to this screen rather than sliding forward each
    time it is opened.
  */
  // const figures = useMemo(
  //   () => deriveBookingFigures(deposit, draft, confirmation?.paidAt ?? Date.now()),
  //   [deposit, draft, confirmation?.paidAt],
  // );

  const { investment } = draft;

  const figures = useMemo(
    () =>
      deriveBookingFigures(
        deposit,
        investment.amount,
        investment.tenureMonths,
        investment.payoutOption,
        confirmation?.paidAt ?? Date.now(),
      ),
    [
      deposit,
      investment.amount,
      investment.tenureMonths,
      investment.payoutOption,
      confirmation?.paidAt,
    ],
  );

  const investedOn = confirmation ? new Date(confirmation.paidAt) : null;

  /**
   * The moment a booking becomes something the investor **holds**.
   *
   * This is the one place the product crosses that line, so it is the one place
   * a holding is written. Everything before it is intent — a draft, editable and
   * abandonable — and nothing before it may appear in Portfolio. A confirmed
   * booking, and only a confirmed booking, becomes a deposit they own.
   *
   * ## What is recorded, and what is not
   *
   * The **terms of the contract**, which are fixed the moment the bank
   * confirms: principal, the rate resolved for this term, the tenure, whether
   * interest compounds, and when it started. Portfolio derives every figure —
   * maturity amount, interest, maturity date — from those, so a later catalogue
   * change cannot rewrite a deposit somebody already owns.
   *
   * ## Written once
   *
   * Guarded on the confirmation being complete, and idempotent on the bank's
   * reference in the store beneath. A re-render, a refresh of this screen or
   * StrictMode's double invocation cannot produce a second holding.
   */
  useEffect(() => {
    if (!isReady) return;
    if (confirmation?.confirmedAt == null) return;
    if (figures.returns === null) return;
    if (investment.amount === null || investment.tenureMonths === null) return;

    record({
      reference: confirmation.reference,
      source: 'platform-booked',
      externalReference: null,
      productType: 'fixed-deposit',
      productId: deposit.productId,
      productName: deposit.productName,
      bank: deposit.bank,
      principal: investment.amount,
      annualRate: figures.returns.annualRate,
      tenureMonths: investment.tenureMonths,
      isCumulative: figures.returns.isCumulative,
      payoutLabel: figures.returns.isCumulative ? 'At maturity' : 'Paid out periodically',
      startedAt: confirmation.paidAt,
      /*
        What the investor told the bank to do at maturity, translated out of
        that bank's own option vocabulary. `null` where the form did not ask —
        stated as unknown rather than defaulted.
      */
      maturityInstruction: toMaturityInstruction(draft.application.answers.maturityInstruction),
      /*
        Which account funded it — the id alone. The vault owns the account; this
        records that this deposit was funded from it.
      */
      fundingAccountId: draft.bankAccountId,
      status: 'active',
    });
  }, [
    isReady,
    confirmation,
    draft.application.answers.maturityInstruction,
    draft.bankAccountId,
    figures.returns,
    investment.amount,
    investment.tenureMonths,
    deposit,
    record,
  ]);

  return (
    <BookingStepShell
      stepId="success"
      title="Your FD is Successfully Created!"
      isReady={isReady}
      description={
        <>
          Your investment has been confirmed with {deposit.bank.name}.
          <br />
          You will receive an email confirmation shortly.
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="flex flex-col gap-6 md:col-span-2">
          <Card variant="outlined" className="flex flex-col gap-6 p-5 md:p-6">
            {/*
              The celebration is scoped to this card rather than the viewport,
              so it acknowledges the moment without covering the reference
              number the customer came to read. `relative` is what contains it.
            */}
            <div className="relative flex flex-col items-center gap-3">
              <BookingCelebration />
              <span className="bg-surface-subtle text-success relative flex size-16 items-center justify-center rounded-full">
                <ShieldCheck aria-hidden="true" className="size-8" />
              </span>
            </div>

            {confirmation ? <BookingReferenceCard reference={confirmation.reference} /> : null}

            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="border-border-default rounded-card flex flex-col items-center gap-1 border p-4 text-center">
                <CalendarClock aria-hidden="true" className="text-content-muted size-4" />
                <dt className="text-caption text-content-muted">Investment Date</dt>
                <dd className="text-body text-content font-semibold">
                  {investedOn === null ? '—' : formatMaturityDate(investedOn)}
                </dd>
              </div>

              <div className="border-border-default rounded-card flex flex-col items-center gap-1 border p-4 text-center">
                <Landmark aria-hidden="true" className="text-content-muted size-4" />
                <dt className="text-caption text-content-muted">Funded From</dt>
                <dd className="text-body text-content font-semibold">
                  {account ? (
                    <>
                      <span aria-hidden="true">XXXX {account.lastFourDigits}</span>
                      <span className="sr-only">
                        account ending {account.lastFourDigits.split('').join(' ')}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>

              <div className="border-border-default rounded-card flex flex-col items-center gap-1 border p-4 text-center">
                <CircleCheck aria-hidden="true" className="text-content-muted size-4" />
                <dt className="text-caption text-content-muted">Status</dt>
                <dd>
                  <Badge size="sm">Confirmed</Badge>
                </dd>
              </div>

              <div className="border-border-default rounded-card flex flex-col items-center gap-1 border p-4 text-center">
                <CalendarClock aria-hidden="true" className="text-content-muted size-4" />
                <dt className="text-caption text-content-muted">Maturity Date</dt>
                <dd className="text-body text-content font-semibold">
                  {figures.maturesOn === null ? '—' : formatMaturityDate(figures.maturesOn)}
                </dd>
              </div>
            </dl>

            {account && draft.investment.amount !== null ? (
              <p className="bg-surface-subtle text-body text-content rounded-lg p-4">
                Your principal amount of {formatCurrency(draft.investment.amount)} has been debited
                from your {account.institution.name} account ending {account.lastFourDigits}.
              </p>
            ) : null}

            <p
              role="note"
              className="text-caption text-content-muted border-border-default rounded-card border border-dashed p-3"
            >
              Demonstration only — no deposit was created with {deposit.bank.name} and no account
              was debited. The reference above is generated locally.
            </p>
          </Card>

          <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
            <h2 className="text-body-lg text-content font-semibold">What&apos;s Next?</h2>

            {/* `grid-cols-1` bounds the track — see the note in `planner-results.tsx`. */}
            <ol className="text-body text-content-muted grid list-none grid-cols-1 gap-4 md:grid-cols-4">
              {[
                ['1. Confirmation Email', 'You will receive an email with FD details.'],
                [
                  '2. Bank Confirmation',
                  `${deposit.bank.name} will send the account confirmation.`,
                ],
                ['3. Earn Interest', 'Interest will be calculated as per your FD terms.'],
                ['4. Maturity Payout', 'Amount will be credited at maturity.'],
              ].map(([title, description]) => (
                <li key={title} className="flex flex-col gap-1">
                  <span className="text-body text-content font-semibold">{title}</span>
                  <span className="text-caption">{description}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={draft.investment} />

          <ImportantInformation
            notes={[
              'Your investment is confirmed and your FD terms are fixed.',
              'You will be reminded before maturity.',
              'Important updates about this investment will be sent to you.',
            ]}
            title="Good to know"
            variant="checklist"
            headingLevel={2}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
        <Button asChild variant="secondary">
          <Link href={ROUTES.home}>Explore more Fixed Deposits</Link>
        </Button>

        {/*
          The spec's primary CTA. Inert rather than absent — the established
          treatment in this codebase for a destination that has not been
          specified — and it explains itself rather than failing silently.
        */}
        <Button asChild variant="primary">
          <Link href={ROUTES.portfolio}>
            View Portfolio
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>

      <p className="text-caption text-content-muted">
        This deposit now appears in your portfolio, alongside its maturity date and expected return.
      </p>
    </BookingStepShell>
  );
}
