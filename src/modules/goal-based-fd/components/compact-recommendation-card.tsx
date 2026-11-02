import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatRate, formatTenure } from '@/utils';

import { RULE_LABELS } from '../constants/presentation';
import type { Recommendation } from '../types/recommendation';
import { toBookingHandoff } from '../utils/booking-handoff';

/**
 * A secondary recommendation — everything needed to compare, nothing more.
 *
 * `outlined` and shadow-free, so the best-fit card above is dominant without
 * having to shout. The four values a customer actually compares — bank, term,
 * rate, estimated maturity — sit in one row, and a single reason line says why
 * it qualified at all.
 *
 * One reason, not all of them: this card exists to be scanned. The full
 * explanation belongs to the card the customer chooses to read.
 *
 * ## Why it no longer knows its own position
 *
 * It used to take an `index` and set an inline `animationDelay` from it. That
 * put presentation sequencing inside a card that should only know how to render
 * one recommendation, and an inline delay cannot express a ceiling — a list of
 * forty would have staggered for two and a half seconds. Ordering now belongs
 * to the `ds-stagger` container in `PlannerResults`, which caps at five steps.
 */
export function CompactRecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { product, quote, maturity, reasons } = recommendation;
  const handoff = toBookingHandoff(recommendation);
  const leadReason = reasons[0];

  return (
    <Card variant="outlined" className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4 className="text-body text-content truncate font-semibold">{product.name}</h4>
          <p className="text-caption text-content-muted">{product.bank.name}</p>
        </div>
        <span className="text-numeric text-content-brand shrink-0 tabular-nums">
          {formatRate(quote.annualRate)}
        </span>
      </div>

      {/*
        Mobile-first: one column at 320px, two from `xs`. Two columns of
        currency at 320px crushed the figures onto three lines each and
        pushed the card into horizontal overflow.
      */}
      <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Term</dt>
          <dd className="text-body text-content font-medium">
            {formatTenure(product.terms.tenureMonths)}
          </dd>
          {product.rateSource ? (
            <span className="text-caption text-content-muted">
              {product.rateSource.tenureLabel}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col">
          <dt className="text-caption text-content-muted">Estimated maturity</dt>
          <dd className="text-body text-content font-medium tabular-nums">
            {maturity === null ? 'Not shown' : formatCurrency(maturity.maturityValue)}
          </dd>
        </div>
      </dl>

      {leadReason ? (
        <p className="text-caption text-content-muted">{RULE_LABELS[leadReason.ruleId]}</p>
      ) : null}

      <Button variant="secondary" asChild className="w-full">
        <Link href={handoff.href}>View details</Link>
      </Button>
    </Card>
  );
}
