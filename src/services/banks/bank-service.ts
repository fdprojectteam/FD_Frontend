import { request } from '@/services/api';
import type { Bank } from '@/types/finance';

/** Shared read-only catalogue client used wherever a bank needs to be selected. */
export async function getBanks(): Promise<Bank[]> {
  return request<Bank[]>({ method: 'GET', url: '/banks' });
}
