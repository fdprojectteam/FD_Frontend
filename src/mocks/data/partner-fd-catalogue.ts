import type { ProductSummaryDto } from '@/modules/marketplace/types';

import { banks } from './banks';

/**
 * Verified retail-FD comparison catalogue for the three banks whose
 * applications exist in this PoC. The bank-published range is retained on each
 * record, so the interface never presents a selected display term as a new,
 * exact bank product when the bank actually publishes a wider slab.
 *
 * Rates are time-sensitive. Refresh this single catalogue from the cited source
 * before any live use; no UI component contains a rate or rate band.
 */
const RATE_SOURCES = {
  sbi: {
    url: 'https://sbi.co.in/web/interest-rates/deposit-rates/retail-domestic-term-deposits',
    effectiveFrom: '2025-07-15',
  },
  au: {
    url: 'https://www.au.bank.in/interest-rates/fixed-deposit-interest-rates',
    effectiveFrom: '2026-09-01',
  },
  dbs: {
    url: 'https://www.dbs.com/in/treasures/common/interest-rates.page',
    effectiveFrom: '2026-05-06',
  },
} as const;

type BankRate = {
  months: number;
  rate: number;
  seniorRate?: number;
  tenureLabel: string;
};

const BANK_RATE_BANDS: Record<'sbi' | 'au-small-finance' | 'dbs', readonly BankRate[]> = {
  sbi: [
    { months: 3, rate: 4.9, seniorRate: 5.4, tenureLabel: '46 days to 179 days' },
    { months: 6, rate: 5.65, seniorRate: 6.15, tenureLabel: '180 days to 210 days' },
    { months: 9, rate: 5.9, seniorRate: 6.4, tenureLabel: '211 days to less than 1 year' },
    { months: 12, rate: 6.25, seniorRate: 6.75, tenureLabel: '1 year to less than 2 years' },
    { months: 18, rate: 6.25, seniorRate: 6.75, tenureLabel: '1 year to less than 2 years' },
    { months: 24, rate: 6.45, seniorRate: 6.95, tenureLabel: '2 years to less than 3 years' },
    { months: 36, rate: 6.3, seniorRate: 6.8, tenureLabel: '3 years to less than 5 years' },
    { months: 48, rate: 6.3, seniorRate: 6.8, tenureLabel: '3 years to less than 5 years' },
    { months: 60, rate: 6.05, seniorRate: 7.05, tenureLabel: '5 years and up to 10 years' },
  ],
  'au-small-finance': [
    { months: 3, rate: 4.75, seniorRate: 5.25, tenureLabel: '1 month 16 days to 3 months' },
    { months: 6, rate: 5.25, seniorRate: 5.75, tenureLabel: '3 months 1 day to 6 months' },
    { months: 9, rate: 6.35, seniorRate: 6.85, tenureLabel: '6 months 1 day to 12 months' },
    { months: 12, rate: 6.35, seniorRate: 6.85, tenureLabel: '6 months 1 day to 12 months' },
    { months: 18, rate: 7, seniorRate: 7.5, tenureLabel: '15 months 1 day to 18 months' },
    { months: 24, rate: 7, seniorRate: 7.5, tenureLabel: '18 months 1 day to 24 months' },
    { months: 36, rate: 7.4, seniorRate: 7.9, tenureLabel: '30 months 1 day to 36 months' },
    {
      months: 48,
      rate: 6.75,
      seniorRate: 7.25,
      tenureLabel: '45 months 1 day to less than 60 months',
    },
    { months: 60, rate: 6.75, seniorRate: 7.25, tenureLabel: '60 months to 120 months' },
  ],
  dbs: [
    { months: 3, rate: 4.25, tenureLabel: '91 days to 180 days' },
    { months: 6, rate: 5.8, tenureLabel: '182 days to 189 days' },
    { months: 9, rate: 6, tenureLabel: '270 days to less than 1 year' },
    { months: 12, rate: 6.3, tenureLabel: '1 year to 375 days' },
    { months: 18, rate: 6.5, tenureLabel: '601 days to less than 2 years' },
    { months: 24, rate: 6.4, tenureLabel: '2 years to less than 2 years 6 months' },
    { months: 36, rate: 6.4, tenureLabel: '3 years to less than 4 years' },
    { months: 48, rate: 6.4, tenureLabel: '4 years to less than 5 years' },
    { months: 60, rate: 6.25, tenureLabel: '5 years and above' },
  ],
};

function sourceFor(bankId: keyof typeof BANK_RATE_BANDS, tenureLabel: string) {
  const source = bankId === 'au-small-finance' ? RATE_SOURCES.au : RATE_SOURCES[bankId];
  return { ...source, tenureLabel };
}

export const verifiedPartnerFdProducts: ProductSummaryDto[] = (
  Object.entries(BANK_RATE_BANDS) as [keyof typeof BANK_RATE_BANDS, readonly BankRate[]][]
).flatMap(([bankId, rates]) => {
  const bank = banks.find((candidate) => candidate.id === bankId);
  if (!bank) throw new Error(`Verified partner bank ${bankId} is missing.`);

  return rates.map((band) => ({
    id: `verified-${bankId}-${String(band.months).padStart(3, '0')}m`,
    bank,
    name: `${bank.name} Fixed Deposit`,
    interestRate: band.rate,
    ...(band.seniorRate === undefined ? {} : { seniorCitizenDelta: band.seniorRate - band.rate }),
    tenureMonths: band.months,
    minInvestment: 10_000,
    interestType: 'cumulative' as const,
    payout: 'at-maturity' as const,
    compoundingFrequency: 'quarterly' as const,
    benefits: [],
    categories: [],
    flags: [],
    rateSlabs: [],
    dataStatus: 'verified-live' as const,
    rateSource: sourceFor(bankId, band.tenureLabel),
  }));
});
