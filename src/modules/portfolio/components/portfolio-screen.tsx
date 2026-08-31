'use client';
import { useCallback, useMemo, useState } from 'react';

import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/hooks/use-portfolio';
import { summarisePortfolio } from '@/utils/portfolio';

import { FixedDepositHoldingCard } from './fixed-deposit-holding-card';
import { EditHoldingDialog, RemoveHoldingDialog } from './holding-management-dialogs';
import { PortfolioEmptyState } from './portfolio-empty-state';
import { PortfolioHeader } from './portfolio-header';
import { PortfolioInsights } from './portfolio-insights';
import { PortfolioKpiGrid } from './portfolio-kpi-grid';
import { PortfolioTrustNotice } from './portfolio-trust-notice';
import { QuickActions } from './quick-actions';
import { UpcomingMaturities } from './upcoming-maturities';

/**
 * The Portfolio dashboard — the platform's surface for **ownership**.
 *
 * ## Composition, and why the page is not a stack of full-width cards
 *
 * Header → KPIs → a two-column body → insights → trust. The two-column split
 * matters: holdings are the thing being read, while maturities and actions are
 * things being *referred to*. Stacking them all full-width would make a
 * portfolio of three deposits scroll like a report, and would give a quick
 * action the same visual weight as the money it acts on.
 *
 * Below `lg` the rail moves under the holdings, because at that width a side
 * column is a squeeze rather than a glance.
 *
 * ## The route's sole owner
 *
 * One hook, one derivation, and every section receives plain values. No section
 * fetches, calculates, or knows where a holding came from.
 *
 * ## Three states, kept distinct
 *
 * Loading is not emptiness. `isLoaded` is what the screen branches on: an empty
 * list before the store has been read is not the same statement as "you hold
 * nothing", and flashing the empty state at someone who has deposits is the
 * worst of the three.
 */
type SortKey = 'maturity' | 'principal' | 'rate';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'maturity', label: 'Maturity (earliest)' },
  { value: 'principal', label: 'Amount (largest)' },
  { value: 'rate', label: 'Interest rate (highest)' },
];

export function PortfolioScreen() {
  const { holdings, isLoaded, reload, remove, update } = usePortfolio();
  const [sort, setSort] = useState<SortKey>('maturity');
  const [editingReference, setEditingReference] = useState<string | null>(null);
  const [removingReference, setRemovingReference] = useState<string | null>(null);

  /*
    The clock is read once per derivation, so every figure on the screen — the
    KPIs, each card's progress, the maturity list — is calculated against the
    same instant. `refreshedAt` is what makes the refresh control real: it
    changes the input, so the summary is genuinely recomputed.
  */
  const [refreshedAt, setRefreshedAt] = useState(() => Date.now());

  const summary = useMemo(() => summarisePortfolio(holdings, refreshedAt), [holdings, refreshedAt]);

  const handleRefresh = useCallback(() => {
    reload();
    setRefreshedAt(Date.now());
  }, [reload]);

  const sorted = useMemo(() => {
    const views = [...summary.holdings];

    if (sort === 'principal')
      return views.sort((a, b) => b.holding.principal - a.holding.principal);
    if (sort === 'rate') return views.sort((a, b) => b.holding.annualRate - a.holding.annualRate);

    /* Undated deposits sort last — there is nothing to order them by. */
    return views.sort((a, b) => {
      if (a.maturesOn === null) return 1;
      if (b.maturesOn === null) return -1;
      return a.maturesOn.getTime() - b.maturesOn.getTime();
    });
  }, [summary.holdings, sort]);

  const editingHolding = holdings.find((holding) => holding.reference === editingReference) ?? null;
  const removingHolding =
    holdings.find((holding) => holding.reference === removingReference) ?? null;

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-page flex flex-col gap-8 py-10 md:py-14"
      >
        <span className="sr-only">Loading your portfolio…</span>
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="container-page py-10 md:py-14">
        <PortfolioEmptyState />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-8 py-8 md:gap-10 md:py-12">
      <PortfolioHeader generatedAt={summary.generatedAt} onRefresh={handleRefresh} />

      <PortfolioKpiGrid summary={summary} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        <section
          aria-labelledby="portfolio-holdings-title"
          className="flex flex-col gap-4 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="portfolio-holdings-title" className="text-h2 text-content">
              Your fixed deposits{' '}
              <span className="text-content-muted font-normal">({summary.activeCount})</span>
            </h2>

            {/* Only worth offering once there is something to reorder. */}
            {summary.holdings.length > 1 ? (
              <label className="flex items-center gap-2">
                <span className="text-caption text-content-muted shrink-0">Sort by</span>
                <Select
                  value={sort}
                  options={SORT_OPTIONS}
                  aria-label="Sort deposits"
                  onValueChange={(value) => {
                    setSort(value as SortKey);
                  }}
                />
              </label>
            ) : null}
          </div>

          <ul className="grid list-none grid-cols-1 gap-4 xl:grid-cols-2">
            {sorted.map((view) => (
              <li key={view.holding.reference}>
                <FixedDepositHoldingCard
                  view={view}
                  onEdit={setEditingReference}
                  onDelete={setRemovingReference}
                />
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <UpcomingMaturities views={summary.upcomingMaturities} />
          <QuickActions />
        </aside>
      </div>

      <PortfolioInsights summary={summary} />

      <PortfolioTrustNotice />

      <EditHoldingDialog
        holding={editingHolding}
        onOpenChange={(open) => {
          if (!open) setEditingReference(null);
        }}
        onSave={update}
      />
      <RemoveHoldingDialog
        holding={removingHolding}
        onOpenChange={(open) => {
          if (!open) setRemovingReference(null);
        }}
        onConfirm={remove}
      />
    </div>
  );
}
