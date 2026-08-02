'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { MAX_COMPARE } from '../constants/compare';

/**
 * Compare selection — Marketplace **feature state** (M2.6, decision D6).
 *
 * Document 09 §3 classifies the compare list as feature state ("shared within a
 * single business module") and §4 assigns feature state to a custom hook or
 * context. Zustand is reserved for global application state, and §5 is explicit
 * that the global store must not hold marketplace data — so this is a
 * module-scoped context, and no dependency was added.
 *
 * **Ids only.** The store never holds product objects: `useCompareProducts`
 * already resolves ids through `marketplaceKeys.products.compare(ids)`. Two
 * copies of a product would be two things to keep in step (invariant I1).
 *
 * **Authority is per route** (T2.7.2a, contract C4). This store is where the
 * selection lives on Home and Details, which carry nothing about it in their
 * URLs. On `/compare` the URL *is* the selection: intent writes `?ids=`, and
 * this store is synchronised from it through `replaceAll` — which is what makes
 * Back and Forward restore columns there.
 *
 * **The cap lives here**, not in the UI. Enforcing `MAX_COMPARE` in each
 * consumer is how two consumers come to disagree about it.
 *
 * Not persisted: a refresh clears the selection. The approved screens show no
 * persistence affordance, and storage is an M2.7 decision.
 */
export interface CompareSelection {
  ids: string[];
  count: number;
  max: number;
  /** True once `max` products are selected. */
  isFull: boolean;
  has: (productId: string) => boolean;
  /** No-op when already selected or already full — the cap is enforced here. */
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  clear: () => void;
  /**
   * Replaces the whole selection, capped (M2.7, T2.7.2).
   *
   * Exists for one job: letting the `/compare` URL become the selection under
   * contract C4, where history navigation can *shorten* the list. Not `addMany`
   * under another name — looping `add` produces the same result as `addMany`,
   * but it cannot express a removal, and a removal is exactly what a shorter
   * `?ids=` and every Back press require.
   *
   * Exactly one caller, `useCompareUrlState`. A component reaching for this
   * would silently take authority away from the URL.
   */
  replaceAll: (ids: string[]) => void;
}

const CompareSelectionContext = createContext<CompareSelection | null>(null);

export function CompareSelectionProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const add = useCallback((productId: string) => {
    setIds((current) =>
      current.includes(productId) || current.length >= MAX_COMPARE
        ? current
        : [...current, productId],
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((current) => current.filter((id) => id !== productId));
  }, []);

  const toggle = useCallback((productId: string) => {
    setIds((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId);
      return current.length >= MAX_COMPARE ? current : [...current, productId];
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  /**
   * Caps here, like every other mutator, so the rule stays in one module (C2).
   * Returns the existing array when the value is unchanged, so a synchronised
   * write that changes nothing does not re-render the tree.
   */
  const replaceAll = useCallback((next: string[]) => {
    setIds((current) => {
      const capped = next.slice(0, MAX_COMPARE);
      const unchanged =
        capped.length === current.length && capped.every((id, index) => id === current[index]);
      return unchanged ? current : capped;
    });
  }, []);

  const value = useMemo<CompareSelection>(
    () => ({
      ids,
      count: ids.length,
      max: MAX_COMPARE,
      isFull: ids.length >= MAX_COMPARE,
      has: (productId) => ids.includes(productId),
      add,
      remove,
      toggle,
      clear,
      replaceAll,
    }),
    [add, clear, ids, remove, replaceAll, toggle],
  );

  return (
    <CompareSelectionContext.Provider value={value}>{children}</CompareSelectionContext.Provider>
  );
}

/**
 * Throws when the provider is missing rather than returning a silent empty
 * selection: a component that quietly cannot select anything is far harder to
 * diagnose than one that fails on mount.
 */
export function useCompareSelection(): CompareSelection {
  const selection = useContext(CompareSelectionContext);

  if (!selection) {
    throw new Error(
      'useCompareSelection must be used within <CompareSelectionProvider> (mounted in app/(public)/layout.tsx).',
    );
  }

  return selection;
}
