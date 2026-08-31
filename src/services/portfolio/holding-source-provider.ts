import type { Bank } from '@/types/finance';

import type { ExternalFDInput, ExternalHoldingSource } from './external-holding-normalizer';

/**
 * Replaceable seam for a source of an existing FD. The POC implementations are
 * deliberately simulated; neither represents a bank connection, OCR, or file
 * storage service.
 */
export interface HoldingSourceProvider {
  source: Exclude<ExternalHoldingSource, 'manually-added'>;
  isSimulated: true;
  createDemoInput: (bank: Bank, id: string) => ExternalFDInput;
}

export const CONNECTED_HOLDING_PROVIDER: HoldingSourceProvider = {
  source: 'connected',
  isSimulated: true,
  createDemoInput: (bank, id) => ({
    id,
    source: 'connected',
    bank,
    productName: 'Fixed Deposit',
    principal: 250_000,
    startedAt: new Date('2025-09-01T00:00:00Z').getTime(),
    tenureMonths: 24,
    annualRate: 7.1,
    isCumulative: true,
    payoutLabel: 'At maturity',
    maturityInstruction: null,
    externalReference: null,
  }),
};

export const IMPORTED_HOLDING_PROVIDER: HoldingSourceProvider = {
  source: 'imported',
  isSimulated: true,
  createDemoInput: (bank, id) => ({
    id,
    source: 'imported',
    bank,
    productName: 'Fixed Deposit',
    principal: 150_000,
    startedAt: new Date('2026-01-15T00:00:00Z').getTime(),
    tenureMonths: 12,
    annualRate: 6.9,
    isCumulative: false,
    payoutLabel: 'Paid out periodically',
    maturityInstruction: null,
    externalReference: null,
  }),
};
