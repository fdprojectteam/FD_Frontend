'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { cn } from '@/lib/utils';

import { ActiveFilters } from './active-filters';
import { CompareEntryBar } from './compare-entry-bar';
import { FeaturedBanks } from './featured-banks';
import { FilterBar } from './filter-bar';
import { HomeHero } from './home-hero';
import { ProductGridSection } from './product-grid-section';
import { RecommendedRow, type RecommendedEntry } from './recommended-row';
import { SearchBar } from './search-bar';
import { TrustStrip } from './trust-strip';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { MIN_COMPARE } from '../constants/compare';
import { useBanks } from '../hooks/use-banks';
import { useCompareSelection } from '../hooks/use-compare-selection';
import { useMarketplaceUrlState } from '../hooks/use-marketplace-url-state';
import { useProducts } from '../hooks/use-products';
import type {
  MarketplaceFilterValues,
  MarketplaceSearchValues,
  SortOption,
} from '../types/filters';
import type { ProductSummary } from '../types/product';
import { compareHref } from '../utils/compare-url';
import { describeActiveFilters, type MarketplaceFilterKey } from '../utils/filter-labels';
import { toProductListParams } from '../utils/list-params';

/**
 * HomeScreen — composition root for Marketplace Home (M2.3, extended M2.4).
 *
 * Sole owner of hooks *and* of Marketplace URL mutations (invariants I3 and
 * I2a): sections receive plain data and callbacks.
 *
 * Two product queries by design (invariant I2):
 *   • hero + recommendations — a rate-sorted sample that must NOT change
 *     when the user paginates or sorts;
 *   • listing — the user's current page, driven by URL state.
 * They serve different purposes, so they use different keys and are not
 * deduplicated. See marketplace-home-query-strategy.md.
 */
const HOME_PRODUCT_SAMPLE = 12;

/** Highest-rate product in the sample — derived, never positional. */
function selectSpotlight(products: ProductSummary[]): ProductSummary | undefined {
  return products.reduce<ProductSummary | undefined>(
    (best, product) => (!best || product.interestRate > best.interestRate ? product : best),
    undefined,
  );
}

/** Best product per category; categories without a match are omitted. */
function selectRecommended(products: ProductSummary[]): RecommendedEntry[] {
  return PRODUCT_CATEGORIES.flatMap((category) => {
    const match = products
      .filter((product) => product.categories.includes(category.id))
      .reduce<ProductSummary | undefined>(
        (best, product) => (!best || product.interestRate > best.interestRate ? product : best),
        undefined,
      );

    return match ? [{ category, bankName: match.bank.name, rate: match.interestRate }] : [];
  });
}

export function HomeScreen() {
  const { values, setSearch, setFilters, clearFilters, setPage, correctPage, setSort } =
    useMarketplaceUrlState();
  const listingRef = useRef<HTMLElement>(null);
  const shouldFocusListing = useRef(false);

  // Hero + recommendations: independent of page, sort, AND filters
  // (invariants I2 and A4). "Highest rate available today" is a market fact,
  // not a property of the user's current filter selection — filtering it
  // would be wrong and would stay invisible until someone filtered.
  const sampleQuery = useProducts({
    sort: 'interestRate',
    order: 'desc',
    limit: HOME_PRODUCT_SAMPLE,
  });

  // Listing: driven entirely by URL state, translated in exactly one place
  // (invariant A5). Building this object inline is what let `q` and `tenure`
  // reach the API under names it does not read (gaps G1/G2).
  const listingParams = useMemo(() => toProductListParams(values, DEFAULT_PAGE_SIZE), [values]);
  const listingQuery = useProducts(listingParams);

  const banksQuery = useBanks();

  // Compare selection is feature state owned by the module's context; the
  // listing only reads it and reports toggles (M2.6, D6).
  const compare = useCompareSelection();
  const banks = useMemo(() => banksQuery.data ?? [], [banksQuery.data]);

  const sample = useMemo(() => sampleQuery.data?.items ?? [], [sampleQuery.data]);
  const spotlight = useMemo(() => selectSpotlight(sample), [sample]);
  const recommended = useMemo(() => selectRecommended(sample), [sample]);

  const meta = listingQuery.data?.meta;

  // Out-of-range pages clamp to the last valid page and correct the URL
  // (approved decision D3) — a stale link never yields a broken screen.
  //
  // `correctPage`, not `setPage`: this is the application fixing a URL the
  // user did not ask for, so it replaces rather than pushes (invariant I8).
  // Pushing it would put a page that does not exist into the history stack.
  useEffect(() => {
    if (meta && meta.totalPages > 0 && values.page > meta.totalPages) {
      correctPage(meta.totalPages);
    }
  }, [correctPage, meta, values.page]);

  // Page changes move focus to the listing, not just the scroll position,
  // so keyboard and screen-reader users follow the change (decision D1).
  //
  // Keyed on the requested page as well as the in-flight flag: a page that
  // is already cached and fresh resolves without a fetch, so `isFetching`
  // never changes and an effect watching it alone would never run — focus
  // would silently stay on the pager, and the pending flag would leak into
  // the next interaction (M2.4 audit, defect M5).
  useEffect(() => {
    if (!shouldFocusListing.current || listingQuery.isFetching) return;

    listingRef.current?.focus({ preventScroll: true });
    listingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    shouldFocusListing.current = false;
  }, [listingQuery.isFetching, values.page]);

  // The three URL mutations on this screen, all owned here (invariant I2a).
  const handlePageChange = useCallback(
    (page: number) => {
      shouldFocusListing.current = true;
      setPage(page);
    },
    [setPage],
  );

  const handleSortChange = useCallback((option: SortOption) => setSort(option), [setSort]);

  const handleSearchSubmit = useCallback(
    (next: MarketplaceSearchValues) => setSearch(next),
    [setSearch],
  );

  // One setFilters call per interaction; page reset happens inside the same
  // merge, so a filter change can never strand the user on a page the new
  // result set no longer has.
  const handleFilterChange = useCallback(
    (patch: Partial<MarketplaceFilterValues>) => setFilters(patch),
    [setFilters],
  );

  const handleRemoveFilter = useCallback(
    (key: MarketplaceFilterKey) => {
      // `q` belongs to the search surface, the rest to the filter surface.
      // Both are thin wrappers over the same merge, so removal is one write
      // either way (decision D3).
      if (key === 'q') {
        setSearch({ q: '' });
        return;
      }
      const patch: Partial<MarketplaceFilterValues> = {};
      patch[key] = '';
      setFilters(patch);
    },
    [setFilters, setSearch],
  );

  const handleClearFilters = useCallback(() => clearFilters(), [clearFilters]);

  const searchValues = useMemo<MarketplaceSearchValues>(
    () => ({ q: values.q, amount: values.amount, tenure: values.tenure }),
    [values.q, values.amount, values.tenure],
  );

  // The chip row and the search panel read the same URL values (decision D3),
  // so they cannot disagree: there is one parsed source and no shadow copy.
  const filterValues = useMemo<MarketplaceFilterValues>(
    () => ({
      bank: values.bank,
      tenure: values.tenure,
      minRate: values.minRate,
      amount: values.amount,
    }),
    [values.bank, values.tenure, values.minRate, values.amount],
  );

  const activeFilters = useMemo(() => describeActiveFilters(values, banks), [values, banks]);

  /*
    The entry to the comparison (R15a, T2.7.3b).

    `/compare` is URL-authoritative (C4): the URL *is* the selection there, so a
    bare link would open the empty state however many products are selected
    here. The href therefore carries `?ids=`, and it is composed on every render
    from `compare.ids` — deliberately not memoised, so adding a fourth product
    cannot leave the button pointing at three.

    This is navigation, not a URL write: Home's own URL still carries nothing
    about the selection (C5), and this screen remains a single Marketplace URL
    writer (I2a).
  */
  const showCompareEntry = compare.count >= MIN_COMPARE;

  return (
    <>
      <div
        className={cn(
          'container-page flex flex-col gap-16 py-12',
          /*
            A sticky element reserves its space at its *flow* position, but
            while stuck it paints at the viewport edge — over whatever is
            there, which on a short screen is a product card's footer. The bar
            is the last element on the page, so its reserved space sits below
            the fold and does nothing for the content above it. This adds the
            missing room while the bar can appear, so it can never cover a
            control the user is reaching for.
          */
          showCompareEntry && 'pb-28',
        )}
      >
        <HomeHero spotlightProduct={spotlight} />

        {/*
        No local Suspense boundary here. It existed in M2.3 to isolate the
        only URL-reading component; as of M2.4 HomeScreen itself reads URL
        state, so the boundary moved to the route entry point and an inner
        one would be dead weight with a false rationale (M2.4 audit, C2).
      */}
        <SearchBar values={searchValues} onSubmit={handleSearchSubmit} />

        <RecommendedRow entries={recommended} isLoading={sampleQuery.isPending} />

        <ProductGridSection
          ref={listingRef}
          products={listingQuery.data?.items ?? []}
          meta={meta}
          currentPage={values.page}
          sort={values.sort}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          toolbar={
            <>
              <FilterBar
                values={filterValues}
                banks={banks}
                onChange={handleFilterChange}
                isLoadingBanks={banksQuery.isPending}
              />
              <ActiveFilters
                filters={activeFilters}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearFilters}
              />
            </>
          }
          onClearFilters={handleClearFilters}
          onCompare={compare.toggle}
          comparingIds={compare.ids}
          compareDisabled={compare.isFull}
          hasActiveFilters={activeFilters.length > 0}
          isLoading={listingQuery.isPending}
          isFetching={listingQuery.isFetching}
          isError={listingQuery.isError}
          onRetry={() => void listingQuery.refetch()}
        />

        <FeaturedBanks banks={banks} isLoading={banksQuery.isPending} />

        <TrustStrip />
      </div>

      {showCompareEntry ? (
        <CompareEntryBar
          count={compare.count}
          href={compareHref(compare.ids)}
          onClear={compare.clear}
        />
      ) : null}
    </>
  );
}
