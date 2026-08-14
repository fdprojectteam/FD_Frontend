import type { Tenure } from '@/types/finance';

/**
 * The horizons a multi-goal plan offers, **in their published units**.
 *
 * ## Why days appear here and nowhere else
 *
 * The client source document's Use Case 2 states a 91-day emergency horizon
 * alongside 3-year and 10-year ones. 91 days is not a whole number of months, so
 * offering it as "3 months" would change the customer's own stated timeline
 * before the engine ever saw it.
 *
 * Terms are compared within a unit, so choosing 91 days matches deposits
 * published in days and nothing else — which is why this list can mix units
 * safely.
 *
 * ## Why the list is not capped at what the catalogue serves
 *
 * The same reason `HORIZON_PRESETS` is not: a customer who needs money in ten
 * years has that need whether or not a deposit reaches it, and the honest
 * response is to show them the gap. The engine already emits that warning.
 */
export const PLAN_HORIZON_PRESETS: readonly { label: string; tenure: Tenure }[] = [
  { label: '91 days', tenure: { value: 91, unit: 'days' } },
  { label: '6 months', tenure: { value: 6, unit: 'months' } },
  { label: '1 year', tenure: { value: 1, unit: 'years' } },
  { label: '2 years', tenure: { value: 2, unit: 'years' } },
  { label: '3 years', tenure: { value: 3, unit: 'years' } },
  { label: '5 years', tenure: { value: 5, unit: 'years' } },
  { label: '10 years', tenure: { value: 10, unit: 'years' } },
] as const;

/** The preset matching a tenure, for rendering a saved selection. */
export function planHorizonLabel(tenure: Tenure): string {
  const preset = PLAN_HORIZON_PRESETS.find(
    (entry) => entry.tenure.value === tenure.value && entry.tenure.unit === tenure.unit,
  );

  return preset?.label ?? `${String(tenure.value)} ${tenure.unit}`;
}
