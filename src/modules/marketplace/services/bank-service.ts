import { bankRepository, type BankRepository } from '../repositories';
import type { Bank, BankDto } from '../types/bank';

/**
 * BankService — business operations for partner banks (M2.1).
 * Maps DTOs to domain models; no transport logic.
 */
function toBank(dto: BankDto): Bank {
  return { ...dto };
}

export function createBankService(repository: BankRepository = bankRepository) {
  return {
    async getBanks(): Promise<Bank[]> {
      const dtos = await repository.list();
      return dtos.map(toBank);
    },
  };
}

export const bankService = createBankService();
export type BankService = ReturnType<typeof createBankService>;
