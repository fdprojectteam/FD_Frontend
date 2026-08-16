import { ArrowRight, Info, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { BankBadge } from '@/components/business/bank-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { isBookableProduct } from '@/constants/booking';
import { formatCurrency, formatRate } from '@/utils';
import { formatTenureExact, publishedTenure } from '@/utils/finance';

import { RULE_LABELS } from '../constants/presentation';
import type { AllocationLeg } from '../types/plan';
import { bookingHandoffHref } from '../utils/booking-handoff';

/**
 * One placement of money — a bank, a deposit, an amount, and why.
 *
 * ## Everything shown was decided upstream
 *
 * Bank, rate, term, amount, reasons and the safety position all arrive on the
 * leg. Nothing here compares, totals or recomputes: a screen that decided for
 * itself whether an amount was insured would be a second authority on the
 * customer's safety, which is precisely what `SafetyAssessment` exists to
 * prevent.
 *
 * ## The term prints in its published unit
 *
 * `formatTenureExact` — so a 91-day deposit reads "91 days" and never "3
 * months". The unit is part of what the bank published.
 *
 * ## Bank quality is shown, not scored
 *
 * Rating and category are displayed because a customer choosing between banks is
 * entitled to them, and because the client document requires Small Finance Banks
 * to be identified. Neither field ranks anything: no approved rule says how
 * rating should order a recommendation.
 */
export function AllocationLegCard({ leg }: { leg: AllocationLeg }) {
  /*
      The leg's own amount travels with its own product — the rupees the
      allocator placed in *this* deposit, not the plan's total. A leg that
      handed over the whole plan would open Booking on a figure the customer
      never assigned to this bank.
    */
  const href = bookingHandoffHref(leg.productId, leg.amount);
  const bookable = isBookableProduct(leg.productId);
  const term = formatTenureExact(publishedTenure({ tenureMonths: leg.quote.tenureMonths }));

  return (
    <Card variant="outlined" className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-body text-content font-semibold">{leg.bank.name}</p>
          <p className="text-caption text-content-muted">
            {leg.bank.category === 'small-finance' ? 'Small Finance Bank' : 'Universal bank'}
            {leg.bank.rating === null ? '' : ` · ${leg.bank.rating}`}
          </p>
        </div>
        <BankBadge bank={leg.bank} decorative className="shrink-0" />
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Amount placed</dt>
          <dd className="text-body text-content font-semibold tabular-nums">
            {formatCurrency(leg.amount)}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Term</dt>
          <dd className="text-body text-content font-medium">{term}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Indicative rate</dt>
          <dd className="text-numeric text-content-brand tabular-nums">
            {formatRate(leg.quote.annualRate)}
          </dd>
        </div>
      </dl>

      {/*
        The safety position, as the engine assessed it — including when the
        answer is "this is within cover", because a customer is entitled to know
        the consideration ran and concluded the exposure was fine.
      */}
      <p
        className={
          leg.safety.withinInsuredCover
            ? 'text-caption text-content-muted flex items-start gap-2'
            : 'text-caption text-content flex items-start gap-2 font-medium'
        }
      >
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        {leg.safety.text}
      </p>

      {leg.reasons.length > 0 ? (
        <ul className="text-caption text-content-muted flex list-none flex-col gap-1.5">
          {leg.reasons.slice(0, 3).map((reason) => (
            <li key={reason.ruleId} className="flex items-start gap-2">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              {RULE_LABELS[reason.ruleId]}
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        The CTA carries this leg's own `productId`. Booking resolves one deposit
        today; every other product opens its Marketplace page, which is a real
        screen for the same real product. The label says which.
      */}
      <Button variant="secondary" asChild className="mt-auto w-full">
        <Link href={href}>
          {bookable ? 'Continue with this FD' : 'View this FD'}
          <span aria-hidden="true" className="inline-flex shrink-0">
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </Button>
    </Card>
  );
}
