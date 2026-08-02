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
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortCode: 'HDFC',
    initials: 'HB',
    logoUrl: '/banks/HDFC-Bank-logo.svg',
    rating: 'AAA',
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortCode: 'KOTAK',
    initials: 'KM',
    logoUrl: '/banks/kotak-mahindra-bank-logo.svg',
    rating: 'AAA',
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortCode: 'SBI',
    initials: 'SB',
    logoUrl: '/banks/SBI-logo.svg',
    rating: 'AAA',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortCode: 'ICICI',
    initials: 'IB',
    logoUrl: '/banks/ICICI-bank-logo.svg',
    rating: 'AAA',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortCode: 'AXIS',
    initials: 'AB',
    logoUrl: '/banks/AXIS-bank-logo.svg',
    rating: 'AA+',
  },
];

export function findBank(id: string): BankDto | undefined {
  return banks.find((bank) => bank.id === id);
}
