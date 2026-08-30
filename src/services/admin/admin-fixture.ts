import type { AdminApplicationStatus, AdminIdentity, AdminRole } from '@/types/admin';
import type { PortfolioHolding } from '@/types/portfolio';

/**
 * The operations demonstration.
 *
 * ## ⚠ Demo data, and unambiguously so
 *
 * This build has one investor — the person using the customer portal — and no
 * authentication, no database and no second customer. An operations console
 * with one row would demonstrate nothing, so this file supplies **synthetic
 * customers and a synthetic application queue**, every record marked
 * `isDemo` and labelled as such on screen.
 *
 * The session's own investor is **not** in here. That customer is assembled at
 * render time from the canonical identity and portfolio, so the console shows
 * one real record beside the synthetic ones and says which is which — the same
 * split the Family Dashboard uses.
 *
 * ## No real personal data
 *
 * Names are invented, ids are synthetic and stable, and there is no PAN,
 * Aadhaar, date of birth, address, email, phone number or account number
 * anywhere in this file. An operations console needs to identify a customer,
 * not to hold their identity documents.
 *
 * Shaped as an admin API response would be and read through one function, so a
 * real service replaces this file's body and nothing else.
 */

/** The operator, as far as this build knows. Nobody has signed in. */
export const DEMO_ADMINS: Readonly<Record<AdminRole, AdminIdentity>> = {
  operations: {
    id: 'ADM-001',
    displayName: 'Operations Admin',
    role: 'operations',
    isSimulated: true,
  },
  product: { id: 'ADM-002', displayName: 'Product Admin', role: 'product', isSimulated: true },
  support: { id: 'ADM-003', displayName: 'Support Admin', role: 'support', isSimulated: true },
  auditor: { id: 'ADM-004', displayName: 'Auditor', role: 'auditor', isSimulated: true },
};

/** How far a customer has got with verification, in operational terms. */
export type DemoKycState = 'verified' | 'pending' | 'needs-attention';

export interface DemoCustomer {
  id: string;
  displayName: string;
  /** City only. Enough to tell two customers apart; not an address. */
  location: string;
  joinedAt: number;
  kycState: DemoKycState;
  /** Why verification needs a decision, when it does. */
  kycNote: string | null;
  /**
   * Their deposits, as real `PortfolioHolding` records.
   *
   * Real records so every figure the console shows about a demo customer is
   * produced by the platform's own calculators — there is no second interest
   * rule or maturity rule for demonstration data.
   */
  holdings: readonly PortfolioHolding[];
  isDemo: true;
}

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;

function demoHolding(
  reference: string,
  bankId: string,
  bankName: string,
  initials: string,
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startedAt: number,
): PortfolioHolding {
  return {
    reference,
    productType: 'fixed-deposit',
    productId: `fd-${bankId}`,
    productName: `${bankName} Fixed Deposit`,
    bank: {
      id: bankId,
      name: bankName,
      shortCode: initials,
      initials,
      logoUrl: null,
      rating: 'AAA',
      category: 'universal',
    },
    principal,
    annualRate,
    tenureMonths,
    isCumulative: true,
    payoutLabel: 'At maturity',
    startedAt,
    maturityInstruction: 'renew-principal-and-interest',
    fundingAccountId: null,
    status: 'active',
  };
}

export function demoCustomers(now: number): DemoCustomer[] {
  return [
    {
      id: 'CUS-1024',
      displayName: 'Meera Iyer',
      location: 'Chennai',
      joinedAt: now - 14 * MONTH,
      kycState: 'verified',
      kycNote: null,
      holdings: [
        demoHolding(
          'FD-2026-0102',
          'sbi',
          'State Bank of India',
          'SB',
          750_000,
          7.1,
          24,
          now - 9 * MONTH,
        ),
        demoHolding('FD-2026-0118', 'hdfc', 'HDFC Bank', 'HB', 250_000, 7.35, 12, now - 4 * MONTH),
      ],
      isDemo: true,
    },
    {
      id: 'CUS-1031',
      displayName: 'Rohan Desai',
      location: 'Pune',
      joinedAt: now - 7 * MONTH,
      kycState: 'needs-attention',
      kycNote:
        'The name on the customer’s funding account does not match the name on their identity record. A person needs to decide whether it is the same customer.',
      holdings: [
        demoHolding('FD-2026-0140', 'axis', 'Axis Bank', 'AB', 400_000, 7.25, 18, now - 3 * MONTH),
      ],
      isDemo: true,
    },
    {
      id: 'CUS-1047',
      displayName: 'Anjali Nair',
      location: 'Kochi',
      joinedAt: now - 2 * MONTH,
      kycState: 'pending',
      kycNote:
        'Verification has been started but not completed. No deposit can be opened until it is.',
      holdings: [],
      isDemo: true,
    },
  ];
}

/**
 * The application queue.
 *
 * Applications that are still in flight cannot come from anywhere real: this
 * build records a deposit only once its booking is **confirmed**, and an
 * unfinished booking lives in the customer's own session. These are therefore
 * synthetic, and the queue says so.
 *
 * Completed applications are not in here — those are derived from the deposits
 * customers actually hold, which is the one part of the queue the platform can
 * observe for itself.
 */
export interface DemoApplication {
  id: string;
  customerId: string;
  productId: string;
  /** The bank the product belongs to. Display only; the product is authoritative. */
  bankName: string;
  amount: number;
  submittedAt: number;
  /** Where it starts. An operator's decision moves it on, and is journalled. */
  initialStatus: AdminApplicationStatus;
  isDemo: true;
}

export function demoApplications(now: number): DemoApplication[] {
  return [
    {
      id: 'APP-1042',
      customerId: 'CUS-1024',
      productId: 'fd-002',
      bankName: 'HDFC Bank',
      amount: 500_000,
      submittedAt: now - 2 * DAY,
      initialStatus: 'pending',
      isDemo: true,
    },
    {
      id: 'APP-1043',
      customerId: 'CUS-1031',
      productId: 'fd-004',
      bankName: 'State Bank of India',
      amount: 300_000,
      submittedAt: now - 4 * DAY,
      initialStatus: 'in-review',
      isDemo: true,
    },
    {
      id: 'APP-1044',
      customerId: 'CUS-1047',
      productId: 'fd-001',
      bankName: 'IDFC FIRST Bank',
      amount: 150_000,
      submittedAt: now - 6 * DAY,
      initialStatus: 'pending',
      isDemo: true,
    },
  ];
}

/** The id the console gives the session's own investor. */
export const SESSION_CUSTOMER_ID = 'CUS-1001';
