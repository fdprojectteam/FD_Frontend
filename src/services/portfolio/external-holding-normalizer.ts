import type { Bank } from '@/types/finance';
import {
  HOLDING_SOURCE_LABEL,
  HOLDING_SOURCE_PROVENANCE,
  type MaturityInstruction,
  type HoldingSource,
  type PortfolioHolding,
} from '@/types/portfolio';

export { HOLDING_SOURCE_LABEL, HOLDING_SOURCE_PROVENANCE };

export type ExternalHoldingSource = Exclude<HoldingSource, 'platform-booked'>;

/**
 * Temporary input at an external-FD boundary. It never becomes a second store:
 * `normalizeExternalHolding` turns it into the canonical PortfolioHolding before
 * persistence or calculation.
 */
export interface ExternalFDInput {
  /** Opaque client-generated identity, never a bank reference or URL value. */
  id: string;
  source: ExternalHoldingSource;
  bank: Bank;
  productName: string;
  principal: number;
  startedAt: number;
  tenureMonths: number;
  annualRate: number;
  isCumulative: boolean;
  payoutLabel: string;
  maturityInstruction: MaturityInstruction | null;
  /** Customer-entered optional reference; retained locally and never put in a route. */
  externalReference: string | null;
}

/**
 * Pure normalization boundary for every FD that was not booked in this app.
 * Values that are derived elsewhere (interest, maturity value and date) are
 * intentionally absent: the established portfolio engine remains their owner.
 */
export function normalizeExternalHolding(input: ExternalFDInput): PortfolioHolding {
  return {
    reference: `external:${input.source}:${input.id}`,
    source: input.source,
    externalReference: input.externalReference,
    productType: 'fixed-deposit',
    /* External terms are recorded as given; they are not substituted with a current catalogue offer. */
    productId: `external:${input.source}:${input.bank.id}:${input.id}`,
    productName: input.productName,
    bank: input.bank,
    principal: input.principal,
    annualRate: input.annualRate,
    tenureMonths: input.tenureMonths,
    isCumulative: input.isCumulative,
    payoutLabel: input.payoutLabel,
    startedAt: input.startedAt,
    maturityInstruction: input.maturityInstruction,
    fundingAccountId: null,
    status: 'active',
  };
}

/** Stable comparison key for an FD when no customer reference was provided. */
export function externalHoldingFingerprint(
  holding: Pick<
    PortfolioHolding,
    | 'bank'
    | 'productName'
    | 'principal'
    | 'startedAt'
    | 'tenureMonths'
    | 'annualRate'
    | 'isCumulative'
  >,
): string {
  return [
    holding.bank.id.trim().toLowerCase(),
    holding.productName.trim().toLowerCase(),
    holding.principal,
    holding.startedAt,
    holding.tenureMonths,
    holding.annualRate,
    holding.isCumulative ? 'cumulative' : 'payout',
  ].join('|');
}

/**
 * Deterministic duplicate detection. It returns a candidate for the customer to
 * decide about; it never merges, suppresses, or mutates a holding.
 */
export function findPotentialDuplicate(
  candidate: PortfolioHolding,
  holdings: readonly PortfolioHolding[],
): PortfolioHolding | undefined {
  const suppliedReference = candidate.externalReference?.trim().toLowerCase();
  if (suppliedReference) {
    const sameReference = holdings.find(
      (holding) =>
        holding.bank.id === candidate.bank.id &&
        holding.externalReference?.trim().toLowerCase() === suppliedReference,
    );
    if (sameReference) return sameReference;
  }

  const fingerprint = externalHoldingFingerprint(candidate);
  return holdings.find((holding) => externalHoldingFingerprint(holding) === fingerprint);
}
