'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import type { CompareSelection } from './use-compare-selection';
import { mergeCompareParams, parseCompareIds } from '../utils/compare-url';

/**
 * useCompareUrlState — the sole owner of `?ids=` on `/compare` (M2.7, T2.7.2).
 *
 * Contract: `docs/engineering/marketplace-compare-state.md` C4 (governing) and
 * `marketplace-url-state.md` (I1–I8).
 *
 * **On this route the URL is the selection.** Intent — adding or removing a
 * product — writes the URL and nothing else; the store follows. That single
 * direction is what makes Back and Forward work here: history moves the URL,
 * the URL is the selection, the table follows. It is also why there is no
 * window in which the store and the URL disagree, which a write to both would
 * create.
 *
 * The module's **second** URL writer, permitted by I2a because each writer owns
 * a disjoint parameter set on a distinct route. The hazard of a second writer
 * is divergence, not collision, so this deliberately mirrors
 * `useMarketplaceUrlState` step for step: read-then-merge, serialise from
 * parsed values, one navigation per interaction, `scroll: false`, and one
 * `as Route` cast for a runtime query string.
 *
 * **I8** — add and remove are intent and `push`; dropping an unknown id, once
 * the batch reveals it, is a correction and `replace`. Synchronising the store
 * is neither: it performs no navigation at all.
 *
 * The selection is passed in rather than read from context here, so the
 * dependency is explicit and the hook stays usable — and testable — without
 * reaching for a provider it does not own.
 */
export function useCompareUrlState(selection: CompareSelection) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ids = useMemo(
    () => parseCompareIds(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  /**
   * The only place `?ids=` is written. Reads the current params, merges the
   * intended list, canonicalises (I7), and performs exactly one navigation —
   * pushing or replacing according to I8.
   */
  const navigate = useCallback(
    (next: string[], mode: 'push' | 'replace') => {
      const query = mergeCompareParams(new URLSearchParams(searchParams.toString()), next);
      // typedRoutes cannot statically check a runtime query string; the
      // composed URL is typed once here rather than loosening route typing.
      const href = (query ? `${pathname}?${query}` : pathname) as Route;
      if (mode === 'push') {
        router.push(href, { scroll: false });
      } else {
        router.replace(href, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  /** A URL the user asked for — it becomes a history entry (I8). */
  const commit = useCallback((next: string[]) => navigate(next, 'push'), [navigate]);

  /** A URL the application produced on its own — it must not (I8). */
  const correct = useCallback((next: string[]) => navigate(next, 'replace'), [navigate]);

  /**
   * Adding does not consult the cap: that is the store's rule, and enforcing it
   * here would be a second owner of it. An over-cap URL renders the capped
   * selection and is canonicalised at the next write.
   */
  const addId = useCallback(
    (productId: string) => {
      if (ids.includes(productId)) return;
      commit([...ids, productId]);
    },
    [commit, ids],
  );

  const removeId = useCallback(
    (productId: string) => commit(ids.filter((id) => id !== productId)),
    [commit, ids],
  );

  /** Ids the batch could not resolve — a correction, never a history entry. */
  const correctIds = useCallback((next: string[]) => correct(next), [correct]);

  const { ids: selectedIds, max, replaceAll } = selection;

  /**
   * URL → store synchronisation (C4 rule 2). Writes React state; never the
   * router, so a cold load still performs zero navigations (I7).
   *
   * Compared **by value**, and against the **capped** list. Both matter:
   *
   *   • by value, because a fresh array is never reference-equal and an
   *     identity comparison would re-render forever;
   *   • capped, because an over-cap URL disagrees with the store permanently
   *     and by design — `?ids=` with five renders four, and I7 forbids
   *     rewriting the URL on load. An effect firing on any difference would
   *     fire on every render (risk R13).
   *
   * The limit comes from `selection.max` — what the store declares about
   * itself — so the cap is still owned by one module and nothing here imports
   * it.
   *
   * The value comparison also makes this idempotent under StrictMode's
   * double-invoked effects, without a ref, a guard, or a once-flag.
   */
  useEffect(() => {
    const capped = ids.slice(0, max);
    const unchanged =
      capped.length === selectedIds.length &&
      capped.every((id, index) => id === selectedIds[index]);

    if (unchanged) return;

    replaceAll(capped);
  }, [ids, max, replaceAll, selectedIds]);

  return { ids, addId, removeId, correctIds };
}
