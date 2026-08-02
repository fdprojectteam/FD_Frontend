import type { Bank } from '@/types/finance';

import { formatCurrency, formatTenure } from './format';
import { RATE_BANDS } from '../constants/filters';
import type { MarketplaceUrlValues } from '../types/filters';

/**
 * Filter labelling (M2.5) — one place that turns URL values into human text.
 *
 * `FilterBar` and `ActiveFilters` both need to say what "minRate=7" means. If
 * each derived its own wording they would drift, and the chip row would
 * eventually disagree with the removable pill describing the same filter.
 * Pure functions, so the wording is assertable without rendering anything.
 */
export type MarketplaceFilterKey = 'q' | 'bank' | 'tenure' | 'minRate' | 'amount';

export interface ActiveFilterDescriptor {
  key: MarketplaceFilterKey;
  /** Facet name as it appears on the approved chip row. */
  facet: string;
  /** Human-readable value, e.g. "HDFC Bank", "12 months", "7% and above". */
  value: string;
}

const FACET_LABELS: Record<MarketplaceFilterKey, string> = {
  q: 'Search',
  bank: 'Bank',
  tenure: 'Tenure',
  minRate: 'Interest Rate',
  amount: 'Amount',
};

export function facetLabel(key: MarketplaceFilterKey): string {
  return FACET_LABELS[key];
}

/**
 * The value as shown *inside* a chip — short, because the chip row is
 * horizontal and space-constrained on mobile.
 */
export function facetValueLabel(
  key: MarketplaceFilterKey,
  value: string,
  banks: readonly Bank[],
): string {
  if (!value) return '';

  switch (key) {
    case 'bank':
      // A well-formed but unknown id can reach us from a hand-edited URL; show
      // the id rather than pretending the filter isn't there.
      return banks.find((bank) => bank.id === value)?.name ?? value;
    case 'tenure':
      return formatTenure(Number(value));
    case 'minRate':
      return `${value}%+`;
    case 'amount':
      return formatCurrency(Number(value));
    case 'q':
      return value;
  }
}

/** The fuller wording used on removable pills, where there is room for it. */
export function facetValueLongLabel(
  key: MarketplaceFilterKey,
  value: string,
  banks: readonly Bank[],
): string {
  if (key === 'minRate') {
    return RATE_BANDS.find((band) => String(band.value) === value)?.label ?? `${value}%+`;
  }
  return facetValueLabel(key, value, banks);
}

/**
 * Every filter currently applied, in the approved chip order with the search
 * query first. Returns an empty array when nothing is applied, so callers can
 * render nothing rather than an empty row.
 */
export function describeActiveFilters(
  values: MarketplaceUrlValues,
  banks: readonly Bank[],
): ActiveFilterDescriptor[] {
  const keys: MarketplaceFilterKey[] = ['q', 'bank', 'tenure', 'minRate', 'amount'];

  return keys.flatMap((key) => {
    const raw = values[key];
    if (!raw) return [];
    return [{ key, facet: FACET_LABELS[key], value: facetValueLongLabel(key, raw, banks) }];
  });
}
