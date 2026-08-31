import type { FamilyComposition, FamilyGoal, FamilyMember } from '@/types/family';
import type { PortfolioHolding } from '@/types/portfolio';

/**
 * The demonstration family.
 *
 * ## ⚠ Demo data, and unambiguously so
 *
 * There is no authentication in this build, no second customer and no family
 * account infrastructure. Everything here other than the primary member is
 * **invented for the demonstration**, marked `isDemo`, and labelled as such on
 * every screen that renders it.
 *
 * It is shaped exactly as a real family service response would be and read
 * through one function, so introducing `GET /family` replaces this file's body
 * and nothing else — the dashboard already reads a composition.
 *
 * ## Why the demo member's deposits are not in the portfolio store
 *
 * They are returned here, separately, and never written to
 * `fd:portfolio-holdings`. The portfolio store answers *"what do I own"* for
 * the authenticated investor; putting a demonstration spouse's deposits into it
 * would make the Portfolio dashboard, the maturity screen, the statements and
 * the notification centre all report deposits the investor does not hold. The
 * family view is the only place the two are ever added together, and it says
 * where each part came from.
 *
 * ## What is deliberately absent
 *
 * No PAN, no date of birth, no address, no bank account, no KYC record for any
 * member. `FamilyMember` has no field for them. A family view is a summary of
 * *financial position*, not a directory of identity documents.
 */

const PRIMARY_MEMBER: FamilyMember = {
  id: 'fam-you',
  displayName: 'You',
  relationship: 'self',
  role: 'primary',
  source: 'primary-portfolio',
  isDemo: false,
};

const DEMO_SPOUSE: FamilyMember = {
  id: 'fam-spouse',
  displayName: 'Spouse',
  relationship: 'spouse',
  role: 'member',
  source: 'demo',
  isDemo: true,
};

/** Members, primary first. The order the dashboard reads them in. */
export const DEMO_FAMILY_MEMBERS: readonly FamilyMember[] = [PRIMARY_MEMBER, DEMO_SPOUSE];

/**
 * The demonstration member's deposits.
 *
 * Real `PortfolioHolding` records, so every figure the family view shows about
 * them is produced by the same calculators the investor's own deposits go
 * through — there is no second maturity rule and no second interest formula for
 * demonstration data.
 *
 * Started eight months ago on a two-year term, so the deposit is genuinely
 * mid-life and its maturity date lands in the future without being pinned to a
 * hard-coded calendar date that would go stale.
 */
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function demoHoldingsFor(memberId: string, now: number): PortfolioHolding[] {
  if (memberId !== DEMO_SPOUSE.id) return [];

  return [
    {
      reference: 'FD-DEMO-SPOUSE-01',
      source: 'platform-booked',
      externalReference: null,
      productType: 'fixed-deposit',
      productId: 'fd-004',
      productName: 'State Bank of India Fixed Deposit',
      bank: {
        id: 'sbi',
        name: 'State Bank of India',
        shortCode: 'SBI',
        initials: 'SB',
        logoUrl: null,
        rating: 'AAA',
        category: 'universal',
      },
      principal: 500_000,
      annualRate: 7.1,
      tenureMonths: 24,
      isCumulative: true,
      payoutLabel: 'At maturity',
      startedAt: now - 8 * MONTH_MS,
      maturityInstruction: 'renew-principal-and-interest',
      /* No funding account: a demonstration member has no vault of their own. */
      fundingAccountId: null,
      status: 'active',
    },
  ];
}

/**
 * The family's goals.
 *
 * Targets are declared — a family decides what it is aiming for. Progress is
 * **not** declared: it is the sum of the deposits named in
 * `contributingReferences`, read from canonical holdings.
 *
 * Only the demonstration member's deposit can be named, because it is the only
 * one whose reference is known in advance. The investor's own deposits carry
 * references minted at booking, and **Booking never records which goal a
 * deposit was opened for** — so nothing here attributes them to one. That gap
 * is real, it is stated on screen, and closing it is a change to Booking rather
 * than a calculation this module could make.
 */
export const DEMO_FAMILY_GOALS: readonly FamilyGoal[] = [
  {
    id: 'fam-goal-emergency',
    label: 'Emergency fund',
    targetAmount: 800_000,
    memberId: null,
    contributingReferences: [],
    isDemo: true,
  },
  {
    id: 'fam-goal-education',
    label: "Children's education",
    targetAmount: 1_500_000,
    memberId: DEMO_SPOUSE.id,
    contributingReferences: ['FD-DEMO-SPOUSE-01'],
    isDemo: true,
  },
  {
    id: 'fam-goal-retirement',
    label: 'Retirement',
    targetAmount: 5_000_000,
    memberId: null,
    contributingReferences: [],
    isDemo: true,
  },
];

/**
 * The family this build knows about.
 *
 * One function, so a real family service replaces it without any screen
 * changing. Returns a fresh object each call; nothing here is stored, because a
 * composition the customer cannot yet edit has nothing to persist.
 */
export function readFamilyComposition(): FamilyComposition {
  return { members: DEMO_FAMILY_MEMBERS, goals: DEMO_FAMILY_GOALS };
}
