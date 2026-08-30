import type { Bank } from '@/types/finance';

/**
 * What the platform can honestly say about tax.
 *
 * ## The one thing this module computes
 *
 * **FD interest attributable to a Tax Year.** Not taxable income, not tax
 * payable, not TDS. Those three need information this platform does not have —
 * the investor's other income, the applicable regime and slab, and what the
 * bank actually deducted — and a type that cannot represent them cannot
 * accidentally display one.
 *
 * ```
 * FD interest  ≠  taxable income  ≠  tax liability  ≠  TDS
 * ```
 *
 * There is no `taxPayable`, no `taxRate`, no `tdsAmount` and no `netInterest`
 * field anywhere below. That absence is the design.
 *
 * ## Tax Year, not Assessment Year
 *
 * A Tax Year is the twelve months from 1 April to 31 March, and income arising
 * in that window belongs to it. The label lives in the `TaxYear` model rather
 * than in components, so the vocabulary is stated once and a future year is
 * data rather than a code change.
 */

/**
 * One tax year.
 *
 * `startDate` is inclusive and `endDate` is the **exclusive** end — 1 April of
 * the following year. Half-open intervals are what make two consecutive years
 * tile the calendar without a shared day, which is exactly what an allocation
 * must not double-count.
 */
export interface TaxYear {
  /** `2026-27` — stable, sortable, and safe in a URL. */
  id: string;
  /** `Tax Year 2026–27` — the customer-facing form, written once. */
  label: string;
  /** `2026–27` — the short form for a selector. */
  shortLabel: string;
  /** 1 April, inclusive. */
  startDate: Date;
  /** 1 April of the next year, **exclusive**. */
  endDate: Date;
}

/**
 * What happened when the platform tried to attribute interest to a year.
 *
 * A discriminated union, because "no interest this year" and "we cannot tell"
 * are different answers and a number cannot express the second. A deposit whose
 * term the bank publishes in days has no maturity date, and the honest output
 * is a stated reason rather than a zero that reads as a measurement.
 */
export type TaxAllocation =
  | {
      status: 'allocated';
      /** Rupees of interest attributable to the period. */
      interest: number;
      /** The part of the deposit's term that falls inside the period. */
      periodStart: Date;
      /** Inclusive last day of the overlap, for display. */
      periodEnd: Date;
      overlapDays: number;
      termDays: number;
    }
  /** The deposit's term does not touch this period at all. */
  | { status: 'outside-period' }
  /** The platform cannot allocate, and says why. */
  | { status: 'unavailable'; reason: string };

/**
 * One deposit's contribution to a tax year.
 *
 * Holds a **reference** to the deposit plus the few figures the row displays —
 * never the `PortfolioHolding` itself. Portfolio stays authoritative for what
 * the investor owns.
 */
export interface TaxDepositContribution {
  /** The bank's reference for the deposit. The row's identity. */
  reference: string;
  bank: Bank;
  productName: string;
  principal: number;
  annualRate: number;
  isCumulative: boolean;
  allocation: TaxAllocation;
}

export interface TaxYearSummary {
  taxYear: TaxYear;
  /** Deposits that contributed something, plus those that could not be allocated. */
  contributions: readonly TaxDepositContribution[];
  /** How many deposits contributed interest to this year. */
  contributingDeposits: number;
  /** Sum of every allocated contribution. Platform-derived. */
  totalInterest: number;
  /** Deposits the platform could not allocate, and therefore did not count. */
  unavailableCount: number;
  /** When this projection was derived. */
  generatedAt: number;
}

/**
 * Whether a tax-related fact is connected to anything.
 *
 * Only two members, and neither is "calculated": a figure this build cannot
 * source is `not-connected`, with the reason stated. There is deliberately no
 * `estimated` member — an estimate of a bank's TDS is a number nobody
 * deducted.
 */
export type TaxDataAvailability =
  { status: 'available' } | { status: 'not-connected'; reason: string };

/**
 * A tax document, and where it comes from.
 *
 * `platform` documents are produced by the existing Reports & Statements
 * engine; `bank` documents are the bank's to issue and this build has no
 * connection to any bank's document systems. Tax Center **links** to Reports —
 * it does not generate anything.
 */
export interface TaxDocumentEntry {
  id: string;
  title: string;
  description: string;
  issuer: 'platform' | 'bank';
  availability: TaxDataAvailability;
  /** Where the document lives, when the platform can produce it. */
  href: string | null;
}
