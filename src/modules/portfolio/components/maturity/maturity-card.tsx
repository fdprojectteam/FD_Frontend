'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { BankBadge } from '@/components/business/bank-badge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatMaturityDate } from '@/utils/finance';
import { formatCurrency, formatRate, formatTenure } from '@/utils/format';
import { MATURITY_INSTRUCTION_LABEL, type MaturityEntry } from '@/utils/portfolio';

/**
 * One maturity, and the decision attached to it.
 *
 * ## The instruction is the point
 *
 * Everything above it — bank, amount, rate, term, dates — is context the
 * investor already half-knows. What they came for is *what happens to this
 * money*, so the instruction sits in its own block with the one-sentence
 * outlook beneath it, and it is the last thing before the action.
 *
 * ## An absent instruction is stated, never filled in
 *
 * Where the bank's form did not ask, or the answer was not captured, the block
 * says so. Defaulting to "renew" would tell someone their money rolls over when
 * the bank may be paying it out.
 *
 * Presentation only — every figure and the outlook sentence arrive computed.
 */
const STAGE_LABEL: Record<MaturityEntry['stage'], string> = {
  scheduled: 'Scheduled',
  'maturing-soon': 'Maturing soon',
  matured: 'Matured',
  undated: 'Date not published',
};

export function MaturityCard({ entry }: { entry: MaturityEntry }) {
  const { view, stage, instruction, outlook } = entry;
  const { holding, maturesOn, maturityValue } = view;

  return (
    <Card
      variant="outlined"
      className="motion-safe:duration-base hover:shadow-elevation-1 flex h-full flex-col gap-5 p-5 transition-shadow md:p-6"
    >
      <div className="flex items-start gap-3">
        <BankBadge bank={holding.bank} size="lg" decorative={false} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-body-lg text-content font-semibold break-words">{holding.bank.name}</p>
          <p className="text-caption text-content-muted break-words">{holding.productName}</p>
        </div>

        <Badge size="sm">{STAGE_LABEL[stage]}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">Invested</dt>
          <dd className="text-body text-content font-semibold tabular-nums">
            {formatCurrency(holding.principal)}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">Rate</dt>
          <dd className="text-body text-content-brand font-semibold tabular-nums">
            {formatRate(holding.annualRate)} p.a.
          </dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">Tenure</dt>
          <dd className="text-body text-content font-semibold tabular-nums">
            {holding.tenureMonths > 0 ? formatTenure(holding.tenureMonths) : 'Not specified'}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col">
          <dt className="text-caption text-content-muted">
            {stage === 'matured' ? 'Matured on' : 'Matures on'}
          </dt>
          <dd className="text-body text-content font-semibold tabular-nums">
            {maturesOn === null ? 'Not available' : formatMaturityDate(maturesOn)}
          </dd>
        </div>
      </dl>

      <div className="bg-surface-subtle flex flex-col gap-3 rounded-lg p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-caption text-content-muted">
            {holding.isCumulative ? 'Expected at maturity' : 'Returned at maturity'}
          </span>
          <span className="text-h3 text-content font-semibold tabular-nums">
            {formatCurrency(maturityValue)}
          </span>
        </div>

        <div className="border-border-default flex flex-col gap-1 border-t pt-3">
          <span className="text-caption text-content-muted">Current instruction</span>
          <span className="text-body text-content font-medium">
            {instruction === null ? 'Not recorded' : MATURITY_INSTRUCTION_LABEL[instruction]}
          </span>
          <p className="text-caption text-content-muted">{outlook}</p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span className="text-caption text-content-placeholder tabular-nums">
          Ref {holding.reference}
        </span>

        <Link
          href={ROUTES.product(holding.productId)}
          className="focus-ring text-body text-content-brand group inline-flex items-center gap-1 rounded-md font-medium"
        >
          View FD
          <ArrowRight
            aria-hidden="true"
            className="motion-safe:duration-base size-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </Card>
  );
}
