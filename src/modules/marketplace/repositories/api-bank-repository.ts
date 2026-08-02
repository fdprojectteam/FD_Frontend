import { request } from '@/services/api';

import type { BankRepository } from './bank-repository';
import type { BankDto } from '../types/bank';

/** HTTP implementation of BankRepository (M2.1). */
const RESOURCE = '/banks';

export function createApiBankRepository(): BankRepository {
  return {
    list: () => request<BankDto[]>({ method: 'GET', url: RESOURCE }),
  };
}
