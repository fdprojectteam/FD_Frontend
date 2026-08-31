import { Skeleton } from '@/components/ui/skeleton';

import { CategoryCard } from './category-card';
import { SectionHeading } from './section-heading';
import type { ProductCategoryOption } from '../constants/categories';

/**
 * RecommendedRow — the approved "Recommended for you" row (M2.3).
 *
 * Receives already-derived entries (category + its best product) from
 * HomeScreen; see marketplace-home-query-strategy.md for the derivation
 * rules. Categories with no matching product are simply absent.
 *
 * Category cards are presentational in M2.3: the `onSelect` seam exists
 * but writing `?category=` is deferred to M2.5 (approved adjustment 3).
 */
export interface RecommendedEntry {
  category: ProductCategoryOption;
  bankName: string;
  rate: number;
}

export interface RecommendedRowProps {
  entries: RecommendedEntry[];
  isLoading?: boolean;
}

export function RecommendedRow({ entries, isLoading = false }: RecommendedRowProps) {
  if (isLoading) {
    return (
      <section aria-labelledby="home-recommended-title" className="flex flex-col gap-6">
        <SectionHeading id="home-recommended-title" title="Explore by what matters to you" />
        <div role="status" aria-live="polite" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <span className="sr-only">Loading recommendations…</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="home-recommended-title" className="flex flex-col gap-6">
      <SectionHeading id="home-recommended-title" title="Explore by what matters to you" />
      <ul className="grid list-none grid-cols-1 gap-4 md:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.category.id}>
            <CategoryCard category={entry.category} bankName={entry.bankName} rate={entry.rate} />
          </li>
        ))}
      </ul>
    </section>
  );
}
