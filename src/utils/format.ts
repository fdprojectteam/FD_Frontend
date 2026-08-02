import { CURRENCY, LOCALE } from '@/constants/app';

/**
 * Shared formatting utilities (promoted in M2.2).
 *
 * One place for every money, rate, and tenure string so Indian digit
 * grouping (₹1,07,978) and rate rendering can never diverge between
 * components or modules. Pure functions, locale-driven by the platform
 * constants.
 */

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** ₹1,07,978 — currency with symbol, no decimals (approved UI). */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** 1,07,978 — grouped number without the currency symbol. */
export function formatAmount(value: number): string {
  return numberFormatter.format(value);
}

/**
 * 7.75% / 7.4% — trailing zeros trimmed, matching the approved UI where
 * rates appear as both "7.75%" and "7.4%".
 */
export function formatPercentage(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

/** Alias for rate-specific call sites; identical rendering rule. */
export function formatRate(value: number): string {
  return formatPercentage(value);
}

/** ₹7,978 — interest component, rendered as currency. */
export function formatInterest(value: number): string {
  return formatCurrency(value);
}

/** "12 months" / "9 months" (approved UI). */
export function formatTenure(tenureMonths: number): string {
  return `${tenureMonths} ${tenureMonths === 1 ? 'month' : 'months'}`;
}
