import type { Bank, Benefit, TrustIndicator } from '@/types/finance';

import type { BankDto } from './bank';

/**
 * Product domain types (M2.1).
 *
 * Split by use, per the approved adjustment:
 *   ProductSummary — everything a product card needs
 *   ProductDetails — the full product page payload (extends the summary)
 *
 * This block previously said the summary was everything "a card or comparison
 * column" needs. That was true until the comparison screen was designed in
 * detail: its Eligibility row reads `eligibility`, which lives on
 * ProductDetails. The comparison batch is therefore detail-level (T2.7.1a),
 * and the summary remains the card's shape.
 *
 * Rate slabs are deliberately not modelled: the approved UI shows one rate
 * per product plus a senior-citizen bonus benefit. Slabs are introduced
 * only when a screen requires them.
 */

export type InterestType = 'cumulative' | 'non-cumulative';
export type PayoutType = 'at-maturity' | 'monthly' | 'quarterly';

export type ProductCategoryId =
  'highest-rate' | 'senior-citizen' | 'tax-saving' | 'short-term' | 'high-returns';

/** Flags rendered as highlight badges on cards (approved UI). */
export type ProductFlagId = 'highest-rate' | 'high-returns' | 'short-term' | 'limited-time';

export type { Benefit };

export interface Eligibility {
  /** Sentence shown on the product page (approved UI). */
  summary: string;
  minAge: number;
  residency: string;
  panRequired: boolean;
}

/* ------------------------------- DTO ------------------------------- */

export interface ProductSummaryDto {
  id: string;
  bank: BankDto;
  name: string;
  interestRate: number;
  tenureMonths: number;
  minInvestment: number;
  interestType: InterestType;
  payout: PayoutType;
  benefits: Benefit[];
  categories: ProductCategoryId[];
  flags: ProductFlagId[];
}

export interface ProductDetailsDto extends ProductSummaryDto {
  trustIndicators: TrustIndicator[];
  eligibility: Eligibility;
  interestBreakdown: string;
  faqs: { question: string; answer: string }[];
  terms: string[];
}

/* ----------------------------- Domain ------------------------------ */

export interface ProductSummary {
  id: string;
  bank: Bank;
  name: string;
  /** Annual interest rate as a percentage number, e.g. 7.75. */
  interestRate: number;
  tenureMonths: number;
  minInvestment: number;
  interestType: InterestType;
  payout: PayoutType;
  benefits: Benefit[];
  categories: ProductCategoryId[];
  flags: ProductFlagId[];
  /**
   * Returns on the reference amount, derived by ProductService — never
   * sent by the API and never computed in a component.
   */
  estimatedReturns: {
    principal: number;
    interestEarned: number;
    maturityValue: number;
  };
}

export interface ProductDetails extends ProductSummary {
  trustIndicators: TrustIndicator[];
  eligibility: Eligibility;
  interestBreakdown: string;
  faqs: { question: string; answer: string }[];
  terms: string[];
}
