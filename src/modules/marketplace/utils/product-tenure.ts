import { formatTenureExact, publishedTenure } from '@/utils/finance';

/**
 * A product's term, printed in the unit the bank published it in.
 *
 * ## Why this exists
 *
 * Every product surface used to read `formatTenure(product.tenureMonths)`, which
 * is correct for a deposit published in months and wrong for one published in
 * days: a 91-day deposit carries `tenureMonths: 0` — it has no whole-month
 * equivalent — and would have rendered as **"0 months"**.
 *
 * Rounding it to "3 months" was the alternative, and it is the one thing the
 * platform must not do: 91 days is what the bank published, and restating it is
 * the same class of error as rounding a rate.
 *
 * Month-based products are unaffected — `formatTenureExact` prints "12 months"
 * exactly as `formatTenure` did, so no approved screen changes.
 */
export function formatProductTenure(product: {
  tenure?: { value: number; unit: 'days' | 'months' | 'years' };
  tenureMonths: number;
}): string {
  return formatTenureExact(publishedTenure(product));
}
