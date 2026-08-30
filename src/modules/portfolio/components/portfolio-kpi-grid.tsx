'use client';

import { CalendarClock, Coins, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { formatCurrency, formatTenure } from '@/utils/format';
import type { PortfolioSummary } from '@/utils/portfolio';

/**
 * The four figures that answer "where do I stand", in one row.
 *
 * ## Compact by design
 *
 * Four tiles, one line of label, one figure, one line of context. A KPI card
 * that grows into a panel stops being scannable, and scanning is the entire
 * job: the customer should have the state of their money before they have
 * decided to read anything.
 *
 * ## What is deliberately not here
 *
 * **No market value and no gain against one.** A fixed deposit is not traded.
 * "Current value" is principal plus interest accrued so far, labelled
 * *contracted* — and the note beneath the grid says why. Inventing a percentage
 * change against a price that does not exist would be the one thing a financial
 * dashboard must never do.
 *
 * Presentation only; every figure arrives computed.
 */
interface Kpi {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  context: string;
}

export function PortfolioKpiGrid({ summary }: { summary: PortfolioSummary }) {
  const depositWord = summary.activeCount === 1 ? 'deposit' : 'deposits';

  /* The longest term held — what "expected at maturity" is waiting on. */
  const longestTerm = summary.holdings.reduce(
    (longest, view) => Math.max(longest, view.holding.tenureMonths),
    0,
  );

  const accrued = summary.currentValue - summary.totalPrincipal;

  const kpis: Kpi[] = [
    {
      id: 'invested',
      icon: <Wallet aria-hidden="true" className="size-4" />,
      label: 'Total invested',
      value: formatCurrency(summary.totalPrincipal),
      context: `Across ${String(summary.activeCount)} ${depositWord}`,
    },
    {
      id: 'current',
      icon: <TrendingUp aria-hidden="true" className="size-4" />,
      label: 'Contracted value',
      value: formatCurrency(summary.currentValue),
      context:
        accrued > 0 ? `${formatCurrency(accrued)} accrued so far` : 'Interest not yet accrued',
    },
    {
      id: 'maturity',
      icon: <CalendarClock aria-hidden="true" className="size-4" />,
      label: 'Expected at maturity',
      value: formatCurrency(summary.totalMaturityValue),
      context: longestTerm > 0 ? `Longest term ${formatTenure(longestTerm)}` : 'Term not published',
    },
    {
      id: 'interest',
      icon: <Coins aria-hidden="true" className="size-4" />,
      label: 'Total interest',
      value: formatCurrency(summary.totalInterest),
      context: 'Over the full term',
    },
  ];

  return (
    <section aria-label="Portfolio summary" className="flex flex-col gap-3">
      {/*
        Two columns from the narrowest useful width, four from `lg`. One column
        on a 360px screen would push the holdings below three scrolls of tiles.
      */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id} variant="outlined" className="flex flex-col gap-2 p-4 md:p-5">
            <dt className="text-caption text-content-muted flex items-center gap-1.5">
              <span className="text-content-brand">{kpi.icon}</span>
              {kpi.label}
            </dt>
            <dd className="flex flex-col gap-0.5">
              <span className="text-h3 text-content font-semibold break-words tabular-nums">
                {kpi.value}
              </span>
              <span className="text-caption text-content-muted">{kpi.context}</span>
            </dd>
          </Card>
        ))}
      </dl>

      <p className="text-caption text-content-muted">
        Contracted value is your principal plus interest accrued so far, on a straight-line basis. A
        fixed deposit has no market price.
      </p>
    </section>
  );
}
