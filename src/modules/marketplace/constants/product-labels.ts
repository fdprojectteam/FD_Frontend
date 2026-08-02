import type { InterestType, PayoutType } from '../types/product';

/**
 * Display labels for the product's enumerated fields (M2.6).
 *
 * The wording is taken from the approved product-details screen — "Cumulative",
 * "At maturity". Kept here rather than inline so the key-information grid, the
 * comparison table (M2.7), and any later summary all read the same, and so a
 * new payout type fails to compile until it is given a label.
 */
export const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  cumulative: 'Cumulative',
  'non-cumulative': 'Non-cumulative',
};

export const PAYOUT_LABELS: Record<PayoutType, string> = {
  'at-maturity': 'At maturity',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};
