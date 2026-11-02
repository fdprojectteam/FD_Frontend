import { ArrowRight, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { BankBadge } from '@/components/business/bank-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatRate, formatTenure } from '@/utils';

import { MaturityFlow } from './maturity-flow';
import { ReasonList } from './reason-list';
import { SafetyNote } from './safety-note';
import type { Recommendation } from '../types/recommendation';
import { toBookingHandoff } from '../utils/booking-handoff';
import { TARGET_ADJUSTMENTS } from '../utils/target';

/**
 * The best fit — the one card that should be read first.
 *
 * ## How the hierarchy is achieved
 *
 * By **subtraction**, not addition. This is the only card on the page using
 * `elevated` (elevation-2) and the only one with a brand-coloured eyebrow; every
 * other recommendation is `outlined` with no shadow. The difference is legible
 * at a glance without this card acquiring decoration the others lack.
 *
 * ## What is stated, and what is not
 *
 * The rate is labelled **Indicative**, the maturity **Estimated**, and the
 * footer says plainly where the real numbers come from. The handoff carries a
 * product id and the amount the customer stated — `toBookingHandoff` reads those
 * two fields and no computed figure — so the
 * figures here can never become the terms of a booking.
 *
 * The bank logo appears because it is the fastest way for a customer to
 * recognise who they would be depositing with. It is real product data already
 * in `ProductMaster.bank`, not an illustration.
 */
export function BestFitCard({ recommendation }: { recommendation: Recommendation }) {
  const { product, quote, maturity, target, reasons, warnings } = recommendation;
  const handoff = toBookingHandoff(recommendation);

  return (
    /*
      `ds-stagger` sequences this card's own blocks in the client document's
      information hierarchy: what was selected → what it returns → why it fits.
      Two of the four children deliberately carry no entrance and so appear at
      first paint — see the note above `SafetyNote` and `CardFooter` below.
    */
    <Card
      variant="elevated"
      className="border-border-primary ds-stagger flex flex-col gap-5 overflow-hidden p-6 md:p-8"
    >
      <CardHeader className="motion-safe:animate-reveal gap-4 p-0">
        <span className="text-caption text-content-brand inline-flex items-center gap-2 font-semibold tracking-wide uppercase">
          <Sparkles aria-hidden="true" className="size-4" />
          Best fit for your goal
        </span>

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-h2 text-content">{product.name}</h3>
            <p className="text-body text-content-muted">
              {product.bank.name} · {formatTenure(product.terms.tenureMonths)}
            </p>
            {product.rateSource ? (
              <p className="text-caption text-content-muted">
                Bank rate band: {product.rateSource.tenureLabel}
              </p>
            ) : null}
          </div>

          {/*
            The platform's own bank badge — it already handles the missing-logo
            and failed-load cases with a monogram, which a bare <Image> here
            would have re-solved worse. The bank name is beside it, so the badge
            is decorative.
          */}
          <BankBadge bank={product.bank} size="lg" decorative className="shrink-0" />
        </div>

        <p className="text-caption text-content-muted">
          Indicative rate{' '}
          <span className="text-content-brand text-body font-semibold tabular-nums">
            {formatRate(quote.annualRate)} p.a.
          </span>
        </p>
        {product.dataStatus === 'illustrative' ? (
          <p className="text-caption text-content-muted">Illustrative data — not bookable.</p>
        ) : null}
      </CardHeader>

      <CardContent className="motion-safe:animate-reveal flex flex-col gap-5 p-0">
        {/*
          Absent when the deposit's term is published in days: compounding needs
          a month count, and the platform will not assume a day-count basis the
          bank has not published. The warning list below states why, so nothing
          simply disappears without explanation.
        */}
        {maturity === null ? null : (
          <MaturityFlow
            principal={recommendation.principal}
            tenureMonths={recommendation.tenureMonths}
            maturity={maturity}
          />
        )}

        {/*
          The target outcome, entirely from the engine. `achieved` and `gap` come
          from `assessTarget`; nothing here compares, subtracts or projects — a
          second opinion about whether a target is reachable is exactly what
          R-TARGET-003 exists to prevent.

          A shortfall states the gap first and the remedies after it, so the
          customer reads the problem before the responses to it. The remedies are
          `TARGET_ADJUSTMENTS` verbatim and are deliberately unquantified: saying
          "invest ₹1,40,000 more" would assume the same rate holds at a higher
          amount, which the rate card contradicts.
        */}
        {target ? (
          <div className="border-border-default rounded-card flex flex-col gap-2 border p-4">
            <p
              className={
                target.achieved
                  ? 'text-body text-success font-medium'
                  : 'text-body text-content font-medium'
              }
            >
              {target.achieved
                ? `This meets your ${formatCurrency(target.targetAmount)} target.`
                : `This falls ${formatCurrency(target.gap)} short of your ${formatCurrency(target.targetAmount)} target.`}
            </p>

            {target.achieved ? null : (
              <>
                <p className="text-caption text-content-muted">What could close the gap:</p>
                <ul className="text-caption text-content-muted flex list-none flex-col gap-1.5">
                  {TARGET_ADJUSTMENTS.map((adjustment) => (
                    <li key={adjustment} className="flex items-start gap-2">
                      <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                      {adjustment}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <h4 className="text-h3 text-content">Why this fits your plan</h4>
          <ReasonList reasons={reasons} detailed />
        </div>

        {warnings.length > 0 ? (
          <ul className="text-caption text-content-muted flex list-none flex-col gap-1.5">
            {warnings.map((warning) => (
              <li key={warning.text} className="flex items-start gap-2">
                <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                {warning.text}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      {/*
        The client document requires the coverage note at the time of
        recommendation, so it carries no entrance animation and is present at
        first paint. A disclosure that arrives after the button beside it is a
        disclosure the customer can act past.
      */}
      <SafetyNote className="border-border-default border-t pt-4" />

      {/*
        No entrance either, and for the same class of reason: the answer must be
        actionable the moment it exists. Making someone wait 300ms to see the
        button is a cost with nothing bought by it.
      */}
      <CardFooter className="flex flex-col items-start gap-2 p-0">
        {/*
          The label states the destination. Booking exists for one deposit
          today; every other recommendation opens that product's page, which is
          a real screen for the same real product. Saying "Continue with this
          FD" and landing somewhere else would be the kind of small lie this
          module is built to avoid.
        */}
        <Button size="lg" asChild className="w-full sm:w-auto">
          <Link href={handoff.href}>
            {handoff.bookable ? 'Continue with this FD' : 'View this FD'}
            <span aria-hidden="true" className="inline-flex shrink-0">
              <ArrowRight className="size-4" />
            </span>
          </Link>
        </Button>
        <p className="text-caption text-content-muted">
          {handoff.bookable
            ? 'Rate and maturity are confirmed on the booking screen.'
            : 'Rate and maturity are confirmed before you book.'}
        </p>
      </CardFooter>
    </Card>
  );
}
