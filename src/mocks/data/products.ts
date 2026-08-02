import type {
  Benefit,
  ProductCategoryId,
  ProductDetailsDto,
  ProductFlagId,
  ProductSummaryDto,
  RateSlab,
} from '@/modules/marketplace/types';

import { banks } from './banks';

/**
 * Product fixtures (M2.1).
 *
 * Deterministic factory producing 24 products across six banks — matching
 * the approved UI's "Showing 1–6 of 24 products". The first six reproduce
 * the exact bank, rate, tenure, and minimum investment shown in the
 * approved screens; the remaining 18 are generated from fixed rate/tenure
 * cycles so results never change between reloads.
 */
const BENEFITS = {
  senior: { id: 'senior-citizen-bonus', label: 'Senior citizen +0.5%' },
  autoRenewal: { id: 'auto-renewal', label: 'Auto-renewal' },
  loan: { id: 'loan-against-fd', label: 'Loan against FD' },
  premium: { id: 'premium-support', label: 'Premium support' },
  flexible: { id: 'flexible-tenure', label: 'Flexible tenure' },
} satisfies Record<string, Benefit>;

interface Seed {
  bankId: string;
  rate: number;
  tenureMonths: number;
  minInvestment: number;
  benefits: Benefit[];
  categories: ProductCategoryId[];
  flags: ProductFlagId[];
}

/** The six products visible in the approved Marketplace Home. */
const APPROVED_SEEDS: Seed[] = [
  {
    bankId: 'idfc-first',
    rate: 7.75,
    tenureMonths: 12,
    minInvestment: 10_000,
    benefits: [BENEFITS.senior, BENEFITS.autoRenewal],
    categories: ['highest-rate', 'senior-citizen'],
    flags: ['highest-rate'],
  },
  {
    bankId: 'hdfc',
    rate: 7.25,
    tenureMonths: 12,
    minInvestment: 10_000,
    benefits: [BENEFITS.loan, BENEFITS.autoRenewal],
    categories: ['tax-saving'],
    flags: [],
  },
  {
    bankId: 'kotak',
    rate: 7.4,
    tenureMonths: 24,
    minInvestment: 50_000,
    benefits: [BENEFITS.loan, BENEFITS.premium],
    categories: ['high-returns'],
    flags: ['high-returns'],
  },
  {
    bankId: 'sbi',
    rate: 7.1,
    tenureMonths: 12,
    minInvestment: 5_000,
    benefits: [BENEFITS.senior, BENEFITS.autoRenewal],
    categories: ['senior-citizen'],
    flags: [],
  },
  {
    bankId: 'icici',
    rate: 6.95,
    tenureMonths: 18,
    minInvestment: 25_000,
    benefits: [BENEFITS.loan],
    categories: [],
    flags: [],
  },
  {
    bankId: 'axis',
    rate: 6.8,
    tenureMonths: 9,
    minInvestment: 10_000,
    benefits: [BENEFITS.flexible],
    categories: ['short-term'],
    flags: ['short-term'],
  },
];

/**
 * Rate-card shape shared by every fixture (change request, 2026-08-02).
 *
 * ⚠️ **Placeholder figures.** The bands and the deltas below are plausible, not
 * published — real bank rate cards should replace them before this reaches
 * anyone's money. The *structure* is what the platform is being built against;
 * the numbers are a stand-in, and are confined to this file precisely so that
 * swapping them touches no domain, service, or UI code.
 *
 * Two properties are deliberate rather than incidental:
 *
 *   • **The first band starts at ₹5,00,000, not ₹0.** Below it no band applies
 *     and `resolveApplicableRate` falls back to the headline rate — which is
 *     what keeps every existing figure on Home and Product Details unchanged,
 *     since all of them are calculated on the ₹1,00,000 reference.
 *
 *   • **The ₹2 crore band pays *less*.** Bulk deposits are commonly priced below
 *     retail, and encoding that here means the resolver is exercised against a
 *     rate card that does not simply increase — the case a "highest rate wins"
 *     shortcut would silently get wrong.
 */
const SLAB_DELTAS: readonly { minAmount: number; delta: number }[] = [
  { minAmount: 500_000, delta: 0.1 },
  { minAmount: 2_500_000, delta: 0.2 },
  { minAmount: 20_000_000, delta: -0.25 },
];

/**
 * Rounded to two decimals: `7.75 + 0.1` is `7.850000000000001` in binary
 * floating point, and an unrounded rate reaches the comparison as "7.85%" but
 * loses ties against a literal 7.85 that should have drawn.
 */
function buildRateSlabs(baseRate: number): RateSlab[] {
  return SLAB_DELTAS.map(({ minAmount, delta }) => ({
    minAmount,
    annualRate: Math.round((baseRate + delta) * 100) / 100,
  }));
}

const RATE_CYCLE = [7.6, 7.35, 7.15, 6.9, 6.75, 7.05];
const TENURE_CYCLE = [6, 12, 18, 24, 36, 9];
const MIN_CYCLE = [5_000, 10_000, 25_000, 50_000, 10_000, 15_000];
const TOTAL_PRODUCTS = 24;

function buildSeeds(): Seed[] {
  const seeds = [...APPROVED_SEEDS];

  for (let index = seeds.length; index < TOTAL_PRODUCTS; index += 1) {
    const bank = banks[index % banks.length]!;
    const tenureMonths = TENURE_CYCLE[index % TENURE_CYCLE.length]!;
    const categories: ProductCategoryId[] = tenureMonths <= 9 ? ['short-term'] : [];

    seeds.push({
      bankId: bank.id,
      rate: RATE_CYCLE[index % RATE_CYCLE.length]!,
      tenureMonths,
      minInvestment: MIN_CYCLE[index % MIN_CYCLE.length]!,
      benefits: index % 2 === 0 ? [BENEFITS.autoRenewal] : [BENEFITS.loan, BENEFITS.senior],
      categories,
      flags: [],
    });
  }

  return seeds;
}

function toSummary(seed: Seed, index: number): ProductSummaryDto {
  const bank = banks.find((item) => item.id === seed.bankId)!;

  return {
    id: `fd-${String(index + 1).padStart(3, '0')}`,
    bank,
    name: `${bank.name} Fixed Deposit`,
    interestRate: seed.rate,
    rateSlabs: buildRateSlabs(seed.rate),
    tenureMonths: seed.tenureMonths,
    minInvestment: seed.minInvestment,
    interestType: 'cumulative',
    payout: 'at-maturity',
    benefits: seed.benefits,
    categories: seed.categories,
    flags: seed.flags,
  };
}

export const productSummaries: ProductSummaryDto[] = buildSeeds().map(toSummary);

export function findProductSummary(id: string): ProductSummaryDto | undefined {
  return productSummaries.find((product) => product.id === id);
}

/** Detail payload for a product page (approved Product Details screen). */
export function buildProductDetails(summary: ProductSummaryDto): ProductDetailsDto {
  return {
    ...summary,
    trustIndicators: [
      { id: 'rbi-regulated', label: 'RBI Regulated' },
      { id: 'dicgc-insured', label: '₹5L DICGC Insured' },
      ...(summary.bank.rating === 'AAA'
        ? ([{ id: 'aaa-rating', label: 'AAA Rating' }] as const)
        : []),
    ],
    eligibility: {
      summary: 'Resident individuals, age 18 and above, with a valid PAN card.',
      minAge: 18,
      // "Resident" (not "Resident individual") so the approved comparison cell
      // reads "Resident, 18+" (T2.7.1a). The long form survives in `summary`,
      // which is what the details page renders.
      residency: 'Resident',
      panRequired: true,
    },
    interestBreakdown:
      'Interest is compounded quarterly and paid at maturity along with the principal.',
    faqs: [
      {
        question: 'How is interest calculated?',
        answer: 'Interest compounds quarterly and is paid according to the selected payout option.',
      },
      {
        question: 'Can I withdraw before maturity?',
        answer:
          'Premature withdrawal is available, subject to a rate adjustment defined in the terms.',
      },
    ],
    terms: [
      'Rates are subject to change until the deposit is booked.',
      'Premature withdrawal may attract a penalty on the applicable rate.',
      'Deposits are insured up to ₹5,00,000 by DICGC.',
    ],
  };
}
