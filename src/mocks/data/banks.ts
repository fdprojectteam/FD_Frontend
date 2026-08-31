import type { Bank } from '@/types/finance';

/** Fixture data served by the mock bank API. Consumers use the shared bank query. */
export const banks: readonly Bank[] = [
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
    id: 'dbs',
    name: 'DBS Bank India',
    shortCode: 'DBS',
    initials: 'DB',
    logoUrl: null,
    rating: null,
    category: 'universal',
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

export const SMALL_FINANCE_BANK_IDS: readonly string[] = [
  'equitas',
  'au-small-finance',
  'suryoday',
];

export function findBank(id: string): Bank | undefined {
  return banks.find((bank) => bank.id === id);
}
