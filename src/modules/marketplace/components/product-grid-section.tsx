'use client';

import { forwardRef, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import type { PaginationMeta } from '@/types/pagination';

import { ProductGrid } from './product-grid';
import { ProductGridSkeleton } from './product-grid-skeleton';
import { ResultCount } from './result-count';
import { SectionHeading } from './section-heading';
import { SortControl } from './sort-control';
import type { SortOption } from '../types/filters';
import type { ProductSummary } from '../types/product';

/**
 * ProductGridSection — the listing section of Marketplace Home (M2.4):
 * heading, result count, sort control, grid, and pagination.
 *
 * Presentation-only (invariant I3): every value and callback arrives
 * through props; it owns no query, no router access, and no state. The
 * heading/count/sort row renders in every state so the layout is stable
 * across loading, empty, and error.
 */
export interface ProductGridSectionProps {
  products: ProductSummary[];
  /**
   * Server-owned totals only. `meta.page` is deliberately ignored: the
   * active page comes from `currentPage` below (invariant I1).
   */
  meta?: PaginationMeta;
  /** Current page, from URL state. */
  currentPage: number;
  sort: SortOption;
  onSortChange: (option: SortOption) => void;
  onPageChange: (page: number) => void;
  /**
   * Filter controls, composed by HomeScreen (M2.5).
   *
   * A slot rather than five filter props: this section renders the listing,
   * it does not need to understand facets, bank lists, or which filters are
   * applied. Threading that through would make a presentation component
   * knowledgeable about filter semantics for no gain — the same reasoning
   * that puts SortControl in SectionHeading's `action`.
   */
  toolbar?: ReactNode;
  /** Clears search and filters from the empty state (M2.5). */
  onClearFilters?: () => void;
  /** Compare selection, threaded to the cards (M2.6, T2.6.7). */
  onCompare?: (productId: string) => void;
  comparingIds?: string[];
  compareDisabled?: boolean;
  /** True when the empty result is the consequence of an applied filter. */
  hasActiveFilters?: boolean;
  isLoading?: boolean;
  /** True while a new page/sort is fetching with previous data still shown. */
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const ProductGridSection = forwardRef<HTMLElement, ProductGridSectionProps>(
  (
    {
      products,
      meta,
      currentPage,
      sort,
      onSortChange,
      onPageChange,
      toolbar,
      onClearFilters,
      onCompare,
      comparingIds,
      compareDisabled,
      hasActiveFilters = false,
      isLoading = false,
      isFetching = false,
      isError = false,
      onRetry,
    },
    ref,
  ) => (
    <section
      ref={ref}
      id="products"
      // Programmatically focusable so a page change can move focus here
      // (decision D1); tabIndex={-1} keeps it out of the tab order.
      tabIndex={-1}
      aria-labelledby="home-products-title"
      className="focus-ring flex scroll-mt-20 flex-col gap-6"
    >
      <SectionHeading
        id="home-products-title"
        title="Fixed Deposits"
        action={<SortControl value={sort} onChange={onSortChange} />}
      />

      {toolbar}

      {/*
        Always mounted, meta or not: ResultCount is a live region, and a
        live region that appears together with its first content is never
        announced (M2.4 audit, defect L8).
      */}
      <ResultCount page={currentPage} meta={meta} />

      {isError ? (
        <div className="border-border-default bg-surface-card rounded-card flex flex-col items-start gap-4 border p-8">
          <div className="flex flex-col gap-1">
            <p className="text-body text-content font-medium">Unable to load products</p>
            <p className="text-body text-content-muted">
              Something went wrong while fetching Fixed Deposits. Please try again.
            </p>
          </div>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="border-border-default bg-surface-card rounded-card flex flex-col items-start gap-4 border p-8">
          <div className="flex flex-col gap-1">
            <p className="text-body text-content font-medium">
              {hasActiveFilters
                ? 'No investment products match your filters'
                : 'No investment products available'}
            </p>
            {/*
              The copy states the action that is actually available. Offering
              "clear your search" with nothing to clear sends the user looking
              for a control that isn't there (M2.4 risk R5).
            */}
            <p className="text-body text-content-muted">
              {hasActiveFilters
                ? 'Try widening your search, or clear all filters to see every product.'
                : 'Please try again shortly.'}
            </p>
          </div>
          {hasActiveFilters && onClearFilters ? (
            <Button variant="secondary" onClick={onClearFilters}>
              Clear all filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          aria-busy={isFetching || undefined}
          className={isFetching ? 'duration-fast opacity-70 transition ease-out' : undefined}
        >
          <ProductGrid
            products={products}
            onCompare={onCompare}
            comparingIds={comparingIds}
            compareDisabled={compareDisabled}
          />
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex justify-center">
          {/*
            currentPage comes from the URL, totalPages from the response.
            Reading the active page from `meta.page` left aria-current and
            the highlight a page behind for the whole of a fetch, because
            keepPreviousData holds the previous response (M2.4 audit, A4).
          */}
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            onPageChange={onPageChange}
            disabled={isLoading || isError}
          />
        </div>
      ) : null}
    </section>
  ),
);
ProductGridSection.displayName = 'ProductGridSection';
