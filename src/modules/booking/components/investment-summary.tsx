'use client';

import {
  Banknote,
  CalendarRange,
  CircleDollarSign,
  FileText,
  IndianRupee,
  Info,
  Landmark,
  Percent,
  RefreshCw,
} from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { InvestmentSummaryRow, SummaryRowIconId } from '../types/booking';

/**
 * InvestmentSummary — the terms panel beside the deposit card (T3.1).
 *
 * Nine labelled values: the bank, the product, the rate, the investment
 * bounds, and the four policy answers a user checks before committing money.
 *
 * **It renders a row model it did not build.** `buildInvestmentSummaryRows`
 * decides which rows exist, in what order, and how each value is formatted;
 * this component decides how a row looks. That split is why the panel is
 * testable without a DOM, and why adding "Tax Deducted at Source" later is one
 * entry in a pure function rather than another block of JSX.
 *
 * **A definition list.** Label and value are a pair, and a table would promise
 * columns that do not exist. `<dl>` with `<dt>`/`<dd>` gives assistive
 * technology the association directly.
 *
 * The layout is the part that has to survive a phone: label and value share one
 * row, the value is right-aligned and allowed to wrap onto its own line when it
 * cannot fit — "Monthly, Quarterly, Cumulative, At Maturity" is four words too
 * long for a 320px row, and truncating a payout option is not an acceptable way
 * to state terms.
 */
const ICONS: Record<SummaryRowIconId, typeof Landmark> = {
  bank: Landmark,
  product: FileText,
  rate: Percent,
  'min-investment': IndianRupee,
  'max-investment': CircleDollarSign,
  tenure: CalendarRange,
  payout: Banknote,
  withdrawal: Info,
  renewal: RefreshCw,
};

export interface InvestmentSummaryProps {
  rows: InvestmentSummaryRow[];
  /**
   * Optional identity block between the title and the rows (T3.2.7).
   *
   * The approved Investment Details rail names the bank and product above the
   * terms; the Overview rail does not, because the deposit card beside it
   * already has. A slot rather than a `deposit` prop keeps this component
   * ignorant of what a deposit is — it renders a title, an optional block, and
   * a row model, and that is all it has ever known.
   */
  header?: ReactNode;
}

export function InvestmentSummary({ rows, header }: InvestmentSummaryProps) {
  /*
    Generated rather than hardcoded (T3.2.7). The id was a literal, which is
    correct for exactly one instance per page and silently wrong for two —
    duplicate ids make `aria-labelledby` resolve to whichever came first. Two
    summary panels on one screen is a plausible future (a comparison of
    configurations), so the collision is removed rather than documented.
  */
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card variant="outlined" className="flex flex-col">
        <h2
          className="text-h3 text-content border-border-default border-b p-5 md:p-6"
          id={headingId}
        >
          Investment Summary
        </h2>

        {header ? <div className="border-border-default border-b p-5 md:p-6">{header}</div> : null}

        <dl className="flex flex-col">
          {rows.map((row) => {
            const Icon = ICONS[row.icon];

            return (
              <div
                key={row.id}
                data-summary-row={row.id}
                className="border-border-default flex items-start justify-between gap-4 border-b px-5 py-3.5 last:border-b-0 md:px-6"
              >
                <dt className="text-body text-content-muted flex min-w-0 items-center gap-2.5">
                  <Icon aria-hidden="true" className="text-content-muted size-4 shrink-0" />
                  <span className="min-w-0">{row.label}</span>
                </dt>

                {/*
                  `text-right` with `break-words`: the value column is the one
                  that varies from "7.25%" to a four-item payout list, and it
                  must be free to wrap without pushing the label off the card.
                  `tabular-nums` keeps the money rows aligned down the column.
                */}
                <dd
                  className={cn(
                    'text-body text-right font-semibold break-words tabular-nums',
                    row.emphasis ? 'text-content-brand' : 'text-content',
                  )}
                >
                  {row.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>
    </section>
  );
}
