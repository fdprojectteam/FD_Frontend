'use client';

import { useQuery } from '@tanstack/react-query';

import { getBanks } from '@/services/banks';

const BANKS_STALE_TIME_MS = 10 * 60_000;

/** One cache-backed query for the API-provided bank catalogue. */
export function useBanks() {
  return useQuery({
    queryKey: ['banks'] as const,
    queryFn: getBanks,
    staleTime: BANKS_STALE_TIME_MS,
  });
}
