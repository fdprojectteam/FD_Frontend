import { MAX_COMPARE_PRODUCTS } from '@/constants/app';

/**
 * Comparison limit — re-exported from the platform constant so the module
 * has one import surface while the value stays defined once (approved UI:
 * "Comparing 3 of 4 Products").
 */
export const MAX_COMPARE = MAX_COMPARE_PRODUCTS;

/**
 * How many products the "Add another FD" picker requests (M2.7, T2.7.6).
 *
 * Sized so today's catalogue arrives in one page: a scrollable list inside the
 * dialog, with no pager and no focus management beyond Radix's own. The picker
 * still renders `Pagination` when the response reports `totalPages > 1`, so a
 * larger catalogue stays correct rather than silently truncated — that path is
 * dormant today and recorded as such (plan D-O3).
 */
export const PICKER_PAGE_SIZE = 24;

/**
 * How many products must be selected before the Home entry affordance appears
 * (M2.7, T2.7.3b / R15a).
 *
 * Not a domain rule: a one-product comparison is valid and renders (decision
 * D5). This is only about when offering the shortcut is useful — named rather
 * than written inline so the threshold has an owner instead of living in a
 * component where only grep can find it.
 */
export const MIN_COMPARE = 2;
