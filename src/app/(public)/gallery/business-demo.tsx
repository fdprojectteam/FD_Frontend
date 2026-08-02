'use client';

import { useState } from 'react';

import { AmountDisplay } from '@/components/business/amount-display';
import { BankBadge } from '@/components/business/bank-badge';
import { InterestRateDisplay } from '@/components/business/interest-rate-display';
import { TrustIndicatorList } from '@/components/business/trust-indicator';
import { BenefitChipList } from '@/modules/marketplace/components/benefit-chip-list';
import { CategoryCard } from '@/modules/marketplace/components/category-card';
import { FDProductCard } from '@/modules/marketplace/components/fd-product-card';
import { PRODUCT_CATEGORIES } from '@/modules/marketplace/constants/categories';
import { MAX_COMPARE } from '@/modules/marketplace/constants/compare';
import type { ProductSummary } from '@/modules/marketplace/types';
import type { Bank, Benefit, TrustIndicator } from '@/types/finance';

/**
 * Dev-only demos for the marketplace business components (M2.2).
 *
 * Fixtures are static and local: the gallery renders without MSW, without
 * queries, and without the API — it exists to review components, not data.
 */
const BANKS: Bank[] = [
  {
    id: 'idfc-first',
    name: 'IDFC FIRST Bank',
    shortCode: 'IDFC',
    initials: 'IF',
    logoUrl: '/banks/idfc-first.svg',
    rating: 'AAA',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortCode: 'HDFC',
    initials: 'HB',
    logoUrl: '/banks/hdfc.svg',
    rating: 'AAA',
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortCode: 'KOTAK',
    initials: 'KM',
    logoUrl: '/banks/kotak.svg',
    rating: 'AAA',
  },
];

const BENEFITS: Benefit[] = [
  { id: 'senior', label: 'Senior citizen +0.5%' },
  { id: 'auto-renewal', label: 'Auto-renewal' },
  { id: 'loan', label: 'Loan against FD' },
  { id: 'premium', label: 'Premium support' },
];

const TRUST: TrustIndicator[] = [
  { id: 'rbi-regulated', label: 'RBI Regulated' },
  { id: 'dicgc-insured', label: '₹5L DICGC Insured' },
  { id: 'aaa-rating', label: 'AAA Rating' },
];

/** Mirrors the approved product cards, including their published returns. */
const PRODUCTS: ProductSummary[] = [
  {
    id: 'demo-1',
    bank: BANKS[0]!,
    name: 'IDFC FIRST Bank Fixed Deposit',
    interestRate: 7.75,
    tenureMonths: 12,
    minInvestment: 10_000,
    interestType: 'cumulative',
    payout: 'at-maturity',
    benefits: [BENEFITS[0]!, BENEFITS[1]!],
    categories: ['highest-rate'],
    flags: ['highest-rate'],
    estimatedReturns: { principal: 100_000, interestEarned: 7_978, maturityValue: 107_978 },
  },
  {
    id: 'demo-2',
    bank: BANKS[1]!,
    name: 'HDFC Bank Fixed Deposit',
    interestRate: 7.25,
    tenureMonths: 12,
    minInvestment: 10_000,
    interestType: 'cumulative',
    payout: 'at-maturity',
    benefits: [BENEFITS[2]!, BENEFITS[1]!, BENEFITS[3]!],
    categories: [],
    flags: [],
    estimatedReturns: { principal: 100_000, interestEarned: 7_450, maturityValue: 107_450 },
  },
  {
    id: 'demo-3',
    bank: BANKS[2]!,
    name: 'Kotak Mahindra Bank Fixed Deposit',
    interestRate: 7.4,
    tenureMonths: 24,
    minInvestment: 50_000,
    interestType: 'cumulative',
    payout: 'at-maturity',
    benefits: [BENEFITS[2]!, BENEFITS[3]!],
    categories: ['high-returns'],
    flags: ['high-returns'],
    estimatedReturns: { principal: 100_000, interestEarned: 15_795, maturityValue: 115_795 },
  },
];

export function BusinessPrimitivesDemo() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          BankBadge — monogram only, and with name (sm / md)
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <BankBadge bank={BANKS[0]!} size="sm" />
          <BankBadge bank={BANKS[1]!} />
          <BankBadge bank={BANKS[2]!} showName />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">TrustIndicatorList</span>
        <TrustIndicatorList indicators={TRUST} />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          AmountDisplay — sizes and tones
        </span>
        <div className="flex flex-wrap items-end gap-8">
          <AmountDisplay value={10_000} label="Min. investment" size="sm" />
          <AmountDisplay value={107_978} label="Maturity value" />
          <AmountDisplay value={107_978} label="Maturity value" size="lg" tone="brand" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          InterestRateDisplay — sizes, with and without caption
        </span>
        <div className="flex flex-wrap items-end gap-8">
          <InterestRateDisplay rate={7.4} size="sm" showCaption={false} />
          <InterestRateDisplay rate={7.75} />
          <InterestRateDisplay rate={8.25} size="lg" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          BenefitChipList — full list and overflow summary
        </span>
        <div className="flex flex-col gap-3">
          <BenefitChipList benefits={BENEFITS} />
          <BenefitChipList benefits={BENEFITS} max={2} />
        </div>
      </div>
    </div>
  );
}

export function ProductCardDemo() {
  const [comparing, setComparing] = useState<string[]>(['demo-1']);

  const toggle = (id: string) =>
    setComparing((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  return (
    <div className="flex flex-col gap-6">
      <span className="text-caption text-content-muted font-medium">
        Interactive — Compare toggles aria-pressed; the limit of {MAX_COMPARE} disables unselected
        cards
      </span>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PRODUCTS.map((product) => (
          <FDProductCard
            key={product.id}
            product={product}
            isComparing={comparing.includes(product.id)}
            compareDisabled={comparing.length >= MAX_COMPARE}
            onCompare={toggle}
          />
        ))}
      </div>
    </div>
  );
}

export function CategoryCardDemo() {
  const rates = [7.75, 8.25, 7, 6.8, 7.4];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {PRODUCT_CATEGORIES.map((category, index) => (
        <CategoryCard
          key={category.id}
          category={category}
          bankName={BANKS[index % BANKS.length]!.name}
          rate={rates[index] ?? 7}
          onSelect={index === 0 ? () => undefined : undefined}
        />
      ))}
    </div>
  );
}
