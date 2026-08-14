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

/**
 * ₹5L · ₹10L · ₹1.5Cr — Indian short form for compact labels (T3.2.8).
 *
 * Exists because a quick-amount chip has room for "₹10L" and not for
 * "₹10,00,000", and the approved artwork sets them exactly this way. Platform
 * level rather than Booking's, because Portfolio's holding cards and the FD
 * Ladder's rungs face the same constraint.
 *
 * **Lakh and crore, not million.** `Intl`'s `notation: 'compact'` renders
 * en-IN as "10L"/"1.5Cr" in modern runtimes but silently falls back to
 * "1M"/"10L" inconsistencies across engines and polyfills, and a deposit
 * labelled ₹1M in an Indian product is wrong rather than merely unusual. The
 * thresholds are explicit here for that reason.
 *
 * Trailing zeros are trimmed — ₹5L, not ₹5.0L — matching `formatPercentage`'s
 * rule and the artwork.
 *
 * **Labels only.** Never use this where a user must read an exact figure: the
 * summary rail, the returns strip and every confirmation use `formatCurrency`,
 * because "₹5.5L" is not a number anyone can reconcile against a bank
 * statement.
 */
const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);

  if (abs >= CRORE) return `₹${trim(value / CRORE)}Cr`;
  if (abs >= LAKH) return `₹${trim(value / LAKH)}L`;
  if (abs >= THOUSAND) return `₹${trim(value / THOUSAND)}K`;

  return formatCurrency(value);
}

/** 5 → "5", 1.5 → "1.5", 1.50 → "1.5" — at most two decimals, no trailing zeros. */
function trim(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** ₹7,978 — interest component, rendered as currency. */
export function formatInterest(value: number): string {
  return formatCurrency(value);
}

/** "12 months" / "9 months" (approved UI). */
export function formatTenure(tenureMonths: number): string {
  return `${tenureMonths} ${tenureMonths === 1 ? 'month' : 'months'}`;
}
