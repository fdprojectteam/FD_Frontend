'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { DEFAULT_SORT } from '../constants/filters';
import type { MarketplaceFilterValues, MarketplaceUrlValues, SortOption } from '../types/filters';
import {
  mergeMarketplaceParams,
  parseMarketplaceUrlValues,
  ORDER_PARAM,
  PAGE_PARAM,
  SORT_PARAM,
} from '../utils/url-values';

/**
 * useMarketplaceUrlState — the single owner of Marketplace URL state
 * (M2.3 → M2.4 → M2.5).
 *
 * Contract: docs/engineering/marketplace-url-state.md
 *   • one writer, many readers — every write goes through `navigate()`
 *   • read-then-merge: writes never build a URL from a partial snapshot
 *   • exactly one navigation per user interaction
 *   • intent pushes, correction replaces (I8) — see below
 *   • validation on read, so a hand-edited URL can never break the screen
 *   • I7 canonicalisation is WRITE-ONLY: defaults are dropped when we write,
 *     never by rewriting the URL on load
 *
 * **I8 — intent pushes, correction replaces (approved).** A URL the user asked
 * for is a place they can come back to, so search, filters, sort, pagination,
 * and clear all use `router.push()`. A URL the application produced on its own
 * — canonicalisation, normalising an invalid value, clamping an out-of-range
 * page — uses `router.replace()`, because a correction the user never asked
 * for must not become somewhere they can navigate back to.
 *
 * Before this rule, every write replaced: three filter interactions produced
 * three writes and one history entry, and Back left the site instead of
 * undoing a filter (M2.5 verification, F3).
 *
 * Parsing and merging are pure and live in `utils/url-values.ts`, so the URL
 * contract is assertable without rendering. What remains here is what is
 * genuinely React's: subscribing to `useSearchParams`, and being the **only**
 * module that navigates (invariants I1 and I2a).
 *
 * Only HomeScreen calls the setters; sections receive callbacks as props.
 */
export type { MarketplaceUrlValues };

type SearchPatch = Partial<Pick<MarketplaceUrlValues, 'q' | 'amount' | 'tenure'>>;
type FilterPatch = Partial<MarketplaceFilterValues>;

export function useMarketplaceUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo<MarketplaceUrlValues>(
    () => parseMarketplaceUrlValues(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  /**
   * The only place a Marketplace URL is written. Reads the current params,
   * applies the patch, drops defaults (I7), and performs exactly one
   * navigation — pushing or replacing according to I8.
   */
  const navigate = useCallback(
    (patch: Record<string, string | undefined>, mode: 'push' | 'replace') => {
      const query = mergeMarketplaceParams(new URLSearchParams(searchParams.toString()), patch);
      // typedRoutes cannot statically check a runtime query string; the
      // composed URL is typed once here rather than loosening route typing.
      const href = (query ? `${pathname}?${query}` : pathname) as Route;
      // scroll is suppressed in both modes: this screen moves focus to the
      // listing deliberately (M2.4 decision D1), and letting the router jump
      // to the top as well would fight it.
      if (mode === 'push') {
        router.push(href, { scroll: false });
      } else {
        router.replace(href, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  /** A URL the user asked for — it becomes a history entry (I8). */
  const commit = useCallback(
    (patch: Record<string, string | undefined>) => navigate(patch, 'push'),
    [navigate],
  );

  /** A URL the application produced on its own — it must not (I8). */
  const correct = useCallback(
    (patch: Record<string, string | undefined>) => navigate(patch, 'replace'),
    [navigate],
  );

  /** Search submit — resets pagination in the same single write. */
  const setSearch = useCallback(
    (patch: SearchPatch) => commit({ ...patch, [PAGE_PARAM]: undefined }),
    [commit],
  );

  /**
   * Filter change (M2.5) — resets pagination in the same single write, so the
   * user is never left stranded on a page the new result set no longer has
   * (rule 4).
   *
   * `tenure` and `amount` are reachable from here *and* from `setSearch` by
   * approved decision D3. Both funnel into `merge`, so the two controls edit
   * one piece of state and cannot clobber each other.
   */
  const setFilters = useCallback(
    (patch: FilterPatch) => commit({ ...patch, [PAGE_PARAM]: undefined }),
    [commit],
  );

  /**
   * Clear all — search and filters, in one write.
   *
   * Sort is deliberately preserved: sorting is not a filter, and silently
   * reordering the list is not what "clear filters" promises. With the default
   * sort (canonical, absent from the URL) the result is exactly `/`.
   */
  const clearFilters = useCallback(
    () =>
      commit({
        q: undefined,
        amount: undefined,
        tenure: undefined,
        bank: undefined,
        minRate: undefined,
        [PAGE_PARAM]: undefined,
      }),
    [commit],
  );

  const pagePatch = (page: number) => ({ [PAGE_PARAM]: page > 1 ? String(page) : undefined });

  /** Page change — preserves search, filters, and sort. */
  const setPage = useCallback((page: number) => commit(pagePatch(page)), [commit]);

  /**
   * Page correction — the out-of-range clamp (`?page=99` on a two-page result).
   *
   * Identical patch, different navigation: the user did not ask to be on the
   * last page, the application put them there because the page they asked for
   * does not exist. Pushing it would let Back return to a URL that was already
   * known to be broken (I8).
   */
  const correctPage = useCallback((page: number) => correct(pagePatch(page)), [correct]);

  /** Sort change — resets to page 1 in the same single write (approved). */
  const setSort = useCallback(
    (option: SortOption) => {
      const isDefault = option.id === DEFAULT_SORT.id;
      commit({
        [SORT_PARAM]: isDefault ? undefined : option.field,
        [ORDER_PARAM]: isDefault ? undefined : option.order,
        [PAGE_PARAM]: undefined,
      });
    },
    [commit],
  );

  return { values, setSearch, setFilters, clearFilters, setPage, correctPage, setSort };
}
