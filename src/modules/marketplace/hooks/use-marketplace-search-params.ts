'use client';

import { useMemo } from 'react';

import { useMarketplaceUrlState } from './use-marketplace-url-state';
import type { MarketplaceSearchValues } from '../types/filters';

/**
 * useMarketplaceSearchParams — a **read-only** selector over the single
 * URL-state owner.
 *
 * It exposes no setter. Invariant I2a says only HomeScreen mutates
 * Marketplace URL state; the audit found that SearchBar was writing through
 * this hook's `commit`, which made the invariant unenforceable by
 * inspection. Removing the setter makes `useMarketplaceUrlState` the only
 * route to a write, and HomeScreen its only caller — so the invariant is now
 * a property of the code rather than a convention.
 *
 * A selector must also be identity-stable, not merely value-correct: the
 * projection is memoised on its primitives so a consumer effect keyed on it
 * converges (M2.4 audit, defect C1).
 *
 * Read seam only. If M2.5 introduces no search component that needs to read
 * URL state without owning it, this hook should be deleted rather than kept
 * for symmetry.
 */
export type { MarketplaceSearchValues };

export function useMarketplaceSearchParams(): { values: MarketplaceSearchValues } {
  const { values } = useMarketplaceUrlState();
  const { q, amount, tenure } = values;

  const searchValues = useMemo<MarketplaceSearchValues>(
    () => ({ q, amount, tenure }),
    [q, amount, tenure],
  );

  return useMemo(() => ({ values: searchValues }), [searchValues]);
}
