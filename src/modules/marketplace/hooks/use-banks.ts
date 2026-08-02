'use client';

import { useQuery } from '@tanstack/react-query';

import { bankService } from '../services';
import { marketplaceKeys } from './query-keys';

/**
 * useBanks — partner banks for the featured strip and bank filter (M2.1).
 *
 * Banks change far less often than rates, so this query overrides the
 * platform 60s stale time with a longer window (approved deviation).
 */
const BANKS_STALE_TIME_MS = 10 * 60_000;

export function useBanks() {
  return useQuery({
    queryKey: marketplaceKeys.banks.list(),
    queryFn: () => bankService.getBanks(),
    staleTime: BANKS_STALE_TIME_MS,
  });
}
