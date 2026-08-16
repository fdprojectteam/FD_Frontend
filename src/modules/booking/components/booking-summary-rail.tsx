'use client';

import { useMemo } from 'react';

import { BankBadge } from '@/components/business/bank-badge';
import { Badge } from '@/components/ui/badge';

import { InvestmentSummary } from './investment-summary';
import type { SelectedDeposit } from '../types/booking';
import type { InvestmentConfiguration } from '../types/draft';
import { buildConfiguredSummaryRows } from '../utils/investment-summary';

/**
 * The Investment Summary rail, as drawn on every step from Investment Details
 * onwards.
 *
 * The approved artwork puts the identical panel on screens 2 through 8 — same
 * bank header, same rows, same order. It was built inline on two screens; five
 * more would have made seven copies of one derivation, and the first one
 * someone edited would be the moment two steps started quoting different
 * figures for the same deposit.
 *
 * **Derivation is not repeated here.** `buildConfiguredSummaryRows` remains the
 * single owner of the row model, including the rule that the rate shown is the
 * one resolved for the chosen tenure rather than the headline. This component
 * memoises that call and renders it.
 *
 * Presentation only: no draft, no router, no query.
 */
export interface BookingSummaryRailProps {
  deposit: SelectedDeposit;
  investment: InvestmentConfiguration;
  /** Extra rows appended after the derived ones — e.g. Success's maturity date. */
  extraRows?: React.ComponentProps<typeof InvestmentSummary>['rows'];
}

export function BookingSummaryRail({ deposit, investment, extraRows }: BookingSummaryRailProps) {
  const rows = useMemo(
    () => [...buildConfiguredSummaryRows(deposit, investment), ...(extraRows ?? [])],
    [deposit, investment, extraRows],
  );

  return (
    <InvestmentSummary
      rows={rows}
      header={
        <div className="flex items-center gap-3">
          <BankBadge bank={deposit.bank} size="lg" decorative={false} />

          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body-lg text-content font-semibold">{deposit.productName}</p>

            {deposit.isPreferredPartner ? (
              <Badge size="sm" className="w-fit">
                Preferred Partner
              </Badge>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
