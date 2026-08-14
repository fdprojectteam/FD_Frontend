import type { BankDto } from '@/modules/marketplace/types';

/**
 * Bank fixtures (M2.1) — the partner banks shown in the approved UI.
 * Deterministic: no randomness, so screenshots and tests stay stable.
 */
export const banks: BankDto[] = [
  {
    id: 'idfc-first',
    name: 'IDFC FIRST Bank',
    shortCode: 'IDFC',
    initials: 'IF',
    logoUrl: '/banks/idfc-bank-logo.svg',
    rating: 'AAA',
    category: 'universal',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortCode: 'HDFC',
    initials: 'HB',
    logoUrl: '/banks/HDFC-Bank-logo.svg',
    rating: 'AAA',
    category: 'universal',
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortCode: 'KOTAK',
    initials: 'KM',
    logoUrl: '/banks/kotak-mahindra-bank-logo.svg',
    rating: 'AAA',
    category: 'universal',
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortCode: 'SBI',
    initials: 'SB',
    logoUrl: '/banks/SBI-logo.svg',
    rating: 'AAA',
    category: 'universal',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortCode: 'ICICI',
    initials: 'IB',
    logoUrl: '/banks/ICICI-bank-logo.svg',
    rating: 'AAA',
    category: 'universal',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortCode: 'AXIS',
    initials: 'AB',
    logoUrl: '/banks/AXIS-bank-logo.svg',
    rating: 'AA+',
    category: 'universal',
  },
  {
    id: 'equitas',
    name: 'Equitas Small Finance Bank',
    shortCode: 'EQUITAS',
    initials: 'EQ',
    logoUrl: null,
    rating: null,
    category: 'small-finance',
  },
  {
    id: 'au-small-finance',
    name: 'AU Small Finance Bank',
    shortCode: 'AU',
    initials: 'AU',
    logoUrl: null,
    rating: null,
    category: 'small-finance',
  },
  {
    id: 'suryoday',
    name: 'Suryoday Small Finance Bank',
    shortCode: 'SURYODAY',
    initials: 'SU',
    logoUrl: null,
    rating: null,
    category: 'small-finance',
  },
];

/*
  ⚠️ Sample data, from the client source document — Use Case 2 names **Equitas
  Small Finance Bank** and **AU Small Finance Bank**; Use Case 3 adds **Suryoday
  Small Finance Bank**. The document requires the recommendation to disclose that
  they are Small Finance Banks.

  Only what the document states is taken: the names and the fact that they are
  SFBs. Ratings are `null` because the document publishes none and a rating is
  not something to guess. `category` is disclosure metadata and carries no rule —
  nothing caps, limits or ranks by it, because §11.diversification remains
  undefined by the client.
*/
export const SMALL_FINANCE_BANK_IDS: readonly string[] = [
  'equitas',
  'au-small-finance',
  'suryoday',
] as const;

export function findBank(id: string): BankDto | undefined {
  return banks.find((bank) => bank.id === id);
}
