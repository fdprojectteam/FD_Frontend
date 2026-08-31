import { BankBadge } from '@/components/business/bank-badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Bank } from '@/types/finance';

import { SectionHeading } from './section-heading';

/**
 * FeaturedBanks — the approved partner-bank strip (M2.3).
 *
 * Order comes from the API; no client-side re-sorting is invented. Each
 * tile reuses BankBadge, so bank identity is rendered identically here,
 * on product cards, and in comparison columns.
 *
 * Below md the row scrolls horizontally (approved mobile screen); from md
 * it lays out evenly.
 */
export interface FeaturedBanksProps {
  banks: Bank[];
  isLoading?: boolean;
}

export function FeaturedBanks({ banks, isLoading = false }: FeaturedBanksProps) {
  if (isLoading) {
    return (
      <section aria-labelledby="home-banks-title" className="flex flex-col gap-6">
        <SectionHeading id="home-banks-title" title="Featured banks" />
        <div role="status" aria-live="polite" className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <span className="sr-only">Loading partner banks…</span>
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (banks.length === 0) return null;

  return (
    <section aria-labelledby="home-banks-title" className="flex flex-col gap-6">
      <SectionHeading id="home-banks-title" title="Featured banks" />
      <ul className="-mx-4 flex list-none gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {banks.map((bank) => (
          <li key={bank.id} className="w-56 shrink-0 md:w-auto">
            <Card className="p-4">
              <BankBadge bank={bank} showName />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
