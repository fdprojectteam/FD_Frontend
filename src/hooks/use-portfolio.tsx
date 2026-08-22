'use client';

import { useCallback, useEffect, useState } from 'react';

import { readHoldings, recordHolding } from '@/services/portfolio';
import type { PortfolioHolding } from '@/types/portfolio';

/**
 * The investor's confirmed deposits.
 *
 * ## One reader, one writer, no second store
 *
 * Booking records a holding when the bank confirms; Portfolio reads them. Both
 * go through this hook and the store beneath it, so there is one answer to
 * "what does this investor hold" and no module owns a copy.
 *
 * ## Hydration is deferred, deliberately
 *
 * `sessionStorage` does not exist on the server, so seeding state from it during
 * render produces a hydration mismatch. The list therefore starts empty and is
 * replaced in an effect — the same pattern the booking draft follows, and the
 * reason `isLoaded` exists: an empty list before hydration is not the same
 * statement as "this investor holds nothing", and the empty state must not
 * flash for someone who has deposits.
 */
export interface PortfolioState {
  holdings: readonly PortfolioHolding[];
  /** False until the store has been read. Screens branch on this, not on length. */
  isLoaded: boolean;
  /** Records a confirmed deposit. Idempotent on the bank's reference. */
  record: (holding: PortfolioHolding) => void;
  /**
   * Re-reads the store.
   *
   * The refresh control on the dashboard calls this. There is no server to ask,
   * so it does the honest version of refreshing: it reads the source again.
   */
  reload: () => void;
}

export function usePortfolio(): PortfolioState {
  const [holdings, setHoldings] = useState<readonly PortfolioHolding[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHoldings(readHoldings());
    setIsLoaded(true);
  }, []);

  const record = useCallback((holding: PortfolioHolding) => {
    setHoldings(recordHolding(holding));
  }, []);

  const reload = useCallback(() => {
    setHoldings(readHoldings());
  }, []);

  return { holdings, isLoaded, record, reload };
}
