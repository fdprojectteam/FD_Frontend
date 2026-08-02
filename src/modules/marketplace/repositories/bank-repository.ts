import type { BankDto } from '../types/bank';

/**
 * BankRepository — transport contract for partner banks (M2.1).
 * Used by the featured-banks strip and the bank filter.
 */
export interface BankRepository {
  list(): Promise<BankDto[]>;
}
