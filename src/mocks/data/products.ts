import type {
  Benefit,
  ProductCategoryId,
  ProductDetailsDto,
  ProductFlagId,
  ProductSummaryDto,
  RateSlab,
} from '@/modules/marketplace/types';

import { banks } from './banks';
import { demoTenureCatalogue } from './demo-tenure-catalogue';
import { verifiedPartnerFdProducts } from './partner-fd-catalogue';

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
  /**
   * Suppresses the placeholder amount bands.
   *
   * Used only by products whose rate the client document states outright: a band
   * would shift the published figure at ₹5,00,000 and above, and the document's
   * rates are the point of those products.
   */
  noSlabs?: boolean;
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
  /*
    ⚠️ Sample data, from the client source document — Use Case 1, which names
    **Axis Bank, 2 years / 730 days, base rate 7.00%**, with the senior-citizen
    benefit applied on top.

    It exists because no 24-month deposit in this catalogue published a
    senior-citizen benefit, so the documented scenario had nothing to apply the
    uplift to and R-ELIG-001 could fire on no recommendation. Only the bank,
    tenure and base rate are taken from the document; the minimum is the
    catalogue's existing entry level and nothing else is invented.
  */
  {
    bankId: 'axis',
    rate: 7.0,
    tenureMonths: 24,
    minInvestment: 10_000,
    benefits: [BENEFITS.senior, BENEFITS.autoRenewal],
    categories: ['senior-citizen'],
    flags: [],
  },
  /*
    ⚠️ Sample data, from the client source document — Use Case 2, which names
    three whole-month deposits: **AU Small Finance Bank, 3 years, 7.20%**,
    **ICICI Bank, 3 years, 7.00%**, and **SBI, 10 years, 7.85%**.

    `noSlabs` on all three: the document states these rates outright, and the
    catalogue's placeholder amount bands would move them at the very amounts
    UC2 uses. Only bank, tenure and rate are taken; minimums are the catalogue's
    existing entry level and nothing else is invented.

    The fourth UC2 deposit — Equitas, **91 days** — is not here. It cannot be
    expressed in whole months, and the served catalogue and Marketplace UI are
    month-based. It is published separately as `UC2_DAY_BASED_PRODUCT` below.
  */
  {
    bankId: 'au-small-finance',
    rate: 7.2,
    tenureMonths: 36,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  {
    bankId: 'icici',
    rate: 7.0,
    tenureMonths: 36,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  {
    bankId: 'sbi',
    rate: 7.85,
    tenureMonths: 120,
    minInvestment: 10_000,
    benefits: [BENEFITS.senior, BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  /*
    ⚠️ Sample data, from the client source document — Use Case 3, whose
    recommendation table names **four** five-year deposits:

      Equitas Small Finance Bank   5 years   7.50%
      AU Small Finance Bank        5 years   7.50%
      Suryoday Small Finance Bank  5 years   7.50%
      IDFC FIRST Bank              5 years   7.20%

    All four are published here, at the document's own rates, with `noSlabs` so
    the catalogue's placeholder amount bands cannot move a figure the document
    states outright. Nothing else about them is invented: minimums are the
    catalogue's existing entry level, and no premature-withdrawal terms, maximum
    or partner copy are supplied.

    Three of them were missing until this pass, which is why the documented
    four-bank diversification had only one deposit to choose from.
  */
  {
    bankId: 'equitas',
    rate: 7.5,
    tenureMonths: 60,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  {
    bankId: 'au-small-finance',
    rate: 7.5,
    tenureMonths: 60,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  {
    bankId: 'suryoday',
    rate: 7.5,
    tenureMonths: 60,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  /*
    IDFC FIRST — the document's fourth five-year leg, "the next highest suitable
    sample rate for the remaining amount".

  */
  {
    bankId: 'idfc-first',
    rate: 7.2,
    tenureMonths: 60,
    minInvestment: 10_000,
    benefits: [BENEFITS.senior, BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  /*
    ⚠️ **DBS — demonstration rates.**

    The client's DBS form (`TDA_AOF/001/July25`) is the source for everything
    about these deposits **except the rate**: the form publishes none, and says
    so — *"Please refer the latest interest rate chart at the branch or visit
    www.dbsbank.com"*. The rates below are therefore this platform's own
    demonstration figures, exactly like every other rate in this fixture, and
    **nothing in the product, the application or the UI states that DBS
    published or confirmed them.** The DBS application template repeats that
    disclosure at the point the rate is shown.

    What *is* from the DBS document:

      • the five-year term of the Tax Saver deposit ("lock-in period of 5 years")
      • the ₹10,000 minimum, which the form states for its Flexi deposit
      • the 374-day Flexi term, published separately below because it cannot be
        expressed in whole months

    Deliberately **unspecified**, because the form does not establish them: any
    maximum other than the Tax Saver's ₹1,50,000 per financial year, premature
    withdrawal terms, senior-citizen uplift, and DICGC or tax-benefit claims.
    `noSlabs` keeps the catalogue's placeholder amount bands from moving a
    figure that is already a stand-in.
  */
  {
    bankId: 'dbs',
    rate: 7.15,
    tenureMonths: 12,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: [],
    flags: [],
    noSlabs: true,
  },
  {
    /* Five years — the lock-in the DBS form states for its Tax Saver deposit. */
    bankId: 'dbs',
    rate: 7.4,
    tenureMonths: 60,
    minInvestment: 10_000,
    benefits: [BENEFITS.autoRenewal],
    categories: ['tax-saving'],
    flags: [],
    noSlabs: true,
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

/**
 * The senior-citizen benefit, in percentage points.
 *
 * ⚠️ **Sample data, taken from the client source document** — not a production
 * financial rule and not invented here. `FD_PoC_Rule_Based_Use_Cases_for_
 * Founding_Tech_Team.pdf`, Use Case 1, states it directly:
 *
 * > Base rate 7.00% · Senior citizen benefit **0.50%** · Effective rate 7.50%
 *
 * It is applied only to products whose published benefits already advertise a
 * senior-citizen rate (`BENEFITS.senior`), so it does not silently appear on
 * products that never claimed one. Like every other rate in this file it is a
 * prototype figure: the document is explicit that eligibility and rates must be
 * verified from partner-bank sources before production.
 *
 * Confined to this file on purpose. The domain reads it through
 * `FixedDepositTerms.seniorCitizenDelta`, so replacing it with real per-bank
 * data touches no engine, service or UI code.
 */
const SENIOR_CITIZEN_DELTA = 0.5;

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
    rateSlabs: seed.noSlabs === true ? [] : buildRateSlabs(seed.rate),
    /*
      Published only where the product already advertises a senior-citizen rate.
      A product that makes no such claim carries no delta, rather than a zero.
    */
    ...(seed.benefits.includes(BENEFITS.senior)
      ? { seniorCitizenDelta: SENIOR_CITIZEN_DELTA }
      : {}),
    tenureMonths: seed.tenureMonths,
    minInvestment: seed.minInvestment,
    interestType: 'cumulative',
    payout: 'at-maturity',
    benefits: seed.benefits,
    categories: seed.categories,
    flags: seed.flags,
  };
}

/**
 * The fourth UC2 deposit — **Equitas Small Finance Bank, 91 days, 6.85%**.
 *
 * ⚠️ Sample data, from the client source document.
 *
 * ## It is served, and it is matched on days
 *
 * The engine now compares terms **within a unit**, so this deposit is a
 * candidate for a 91-day goal and for nothing else — no month-based goal can see
 * it, and it never becomes "3 months". It carries `tenureMonths: 0` because it
 * has no whole-month equivalent; `tenure` is the truth.
 *
 * No estimated maturity is produced for it. Compounding needs a month count, and
 * a day-count basis is something the bank publishes, not something the platform
 * decides.
 */
export const UC2_DAY_BASED_PRODUCT: ProductSummaryDto = {
  id: 'fd-uc2-equitas-91d',
  bank: banks.find((bank) => bank.id === 'equitas')!,
  name: 'Equitas Small Finance Bank Fixed Deposit',
  interestRate: 6.85,
  rateSlabs: [],
  /* Zero: the term is not expressible in whole months. `tenure` carries the truth. */
  tenureMonths: 0,
  tenure: { value: 91, unit: 'days' },
  minInvestment: 10_000,
  interestType: 'cumulative',
  payout: 'at-maturity',
  benefits: [BENEFITS.flexible],
  categories: ['short-term'],
  flags: [],
};

/**
 * DBS Flexi Fixed Deposit — **374 days**, as the DBS form states.
 *
 * The form is explicit: a Flexi deposit is created *"for tenure of 374 days"*,
 * with a *"minimum INR 10,000 & multiples of '000'"*, and *"simple Interest
 * will be paid on these fixed deposits"*. Both the term and the minimum are the
 * bank's; the rate, as everywhere else for DBS, is this platform's
 * demonstration figure and is never presented as published by DBS.
 *
 * Like the 91-day deposit above it cannot be expressed in whole months, so it
 * is appended rather than seeded and carries `tenureMonths: 0` — which is the
 * platform's honest way of saying *there is no month-based maturity date*, and
 * is exactly what the maturity, statement and tax-year screens then report.
 *
 * `interestType: 'non-cumulative'` follows the form's "simple interest will be
 * paid on these fixed deposits" statement for this product: the platform's
 * pricing rule keys off exactly that distinction, so a non-cumulative deposit
 * earns simple interest and returns the principal at maturity — which is what
 * the form describes.
 */
export const DBS_FLEXI_374D_PRODUCT: ProductSummaryDto = {
  id: 'fd-dbs-flexi-374d',
  bank: banks.find((bank) => bank.id === 'dbs')!,
  name: 'DBS Bank India Flexi Fixed Deposit',
  interestRate: 6.9,
  rateSlabs: [],
  /* Zero: the term is not expressible in whole months. `tenure` carries the truth. */
  tenureMonths: 0,
  tenure: { value: 374, unit: 'days' },
  minInvestment: 10_000,
  interestType: 'non-cumulative',
  payout: 'at-maturity',
  benefits: [BENEFITS.flexible],
  categories: ['short-term'],
  flags: [],
};

/**
 * JSON-backed synthetic products used only to exercise terms the PoC offers but
 * institution-named demonstration data does not publish. A product has one
 * exact band because the platform's current product model has one rate per
 * product/term; a missing term therefore has no rate to invent.
 */
export const demoTenureProducts: ProductSummaryDto[] = demoTenureCatalogue.products.map(
  (product) => {
    const bank = banks.find((candidate) => candidate.id === product.institutionId);
    if (!bank) {
      throw new Error(`Validated demonstration institution ${product.institutionId} is missing.`);
    }

    const [band] = product.tenureBands;
    if (!band || band.minMonths !== band.maxMonths) {
      throw new Error(
        `Demonstration product ${product.productId} must publish one exact month term.`,
      );
    }

    return {
      id: product.productId,
      bank,
      name: `Demonstration Fixed Deposit — ${String(band.minMonths)} months`,
      interestRate: band.annualRate,
      ...(band.seniorAnnualRate === null
        ? {}
        : { seniorCitizenDelta: band.seniorAnnualRate - band.annualRate }),
      tenureMonths: band.minMonths,
      minInvestment: product.minimumInvestment,
      interestType: product.payoutType === 'at-maturity' ? 'cumulative' : 'non-cumulative',
      payout: product.payoutType,
      compoundingFrequency: product.compoundingFrequency,
      benefits: [],
      categories: [],
      flags: [],
      rateSlabs: [],
    };
  },
);

/*
  The 91-day and 374-day deposits are appended rather than seeded, because they
  are the products whose terms the month-based `Seed` shape cannot express. The
  engine compares terms within a unit, so each is a candidate for a goal stated
  in days and invisible to every month-based one — 91 days is never "3 months",
  and 374 days is never "12 months".
*/
export const productSummaries: ProductSummaryDto[] = [
  ...buildSeeds().map(toSummary),
  UC2_DAY_BASED_PRODUCT,
  DBS_FLEXI_374D_PRODUCT,
  ...verifiedPartnerFdProducts,
];

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
      /*
        Was "Deposits are insured up to ₹5,00,000 by DICGC." — a flat statement
        about this deposit at this bank, which the catalogue does not model and
        this platform has not checked. `SafetyNote` is the platform's single
        wording on coverage; this term now points at the same conditionality
        rather than asserting a figure beside a product.
      */
      'Deposit insurance is subject to DICGC rules and the bank’s own conditions. Confirm coverage with the bank.',
    ],
  };
}
