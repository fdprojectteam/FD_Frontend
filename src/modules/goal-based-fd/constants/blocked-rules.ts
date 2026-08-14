import type { BlockedRule } from '../types/rule';

/**
 * Rules the approved documents define that this engine **cannot** evaluate.
 *
 * ## Why this file exists
 *
 * `04-rule-engine.md` §16 lists what the engine must not do: invent rates, bank
 * products, customer benefits or diversification limits. Every entry below is a
 * rule whose required input is one of those. The choice was therefore between
 * fabricating the data and declaring the gap, and this is the declaration.
 *
 * Carrying them as **data** rather than as comments means the gap travels with
 * the result. A screen can list "not evaluated: senior-citizen benefit" instead
 * of silently implying it was considered — which is the failure mode a
 * recommendation engine is most prone to, because a missing consideration looks
 * exactly like a consideration that found nothing.
 *
 * Each entry is deleted — not defaulted — when the data arrives.
 *
 * ## R-ELIG-001 was deleted, not defaulted (2026-08-13)
 *
 * It was blocked because the catalogue published the senior-citizen benefit as a
 * display label rather than a rate delta, and §16 forbids inventing one. The
 * client source document then supplied the figure directly — Use Case 1, base
 * 7.00% + benefit **0.50%** = effective 7.50% — so the delta is now *sourced*
 * catalogue data (`seniorCitizenDelta`), the planner asks whether the depositor
 * qualifies, and the rule runs. Nothing was defaulted to make that happen: a
 * product publishing no benefit still has none.
 */
export const BLOCKED_RULES: readonly BlockedRule[] = [
  {
    ruleId: 'R-ELIG-002',
    intent: 'Recommend only products the customer is eligible for.',
    missingData:
      'Eligibility exists only on the product details payload and is identical for every product, so it cannot discriminate between candidates.',
  },
  {
    ruleId: 'R-GOAL-004',
    intent: 'Consider eligible products matching the horizon for capital-protection goals.',
    missingData:
      'Depends on the customer eligibility data above, which the catalogue does not publish.',
  },
  {
    ruleId: 'R-TENURE-002',
    intent: 'Where no exact tenure match exists, evaluate the product’s other available tenures.',
    missingData:
      'The catalogue publishes one tenure per product and no tenure rate card. Evaluating an unpublished tenure would require interpolating a rate, which §16 forbids.',
  },
  {
    ruleId: '§8.availability',
    intent: 'Filter out products that are not currently available.',
    missingData: 'No product status or availability field is served by the catalogue.',
  },
  {
    ruleId: '§8.maximum-investment',
    intent: 'Filter out products whose maximum investment the allocation would exceed.',
    missingData: 'No maximum investment is published for catalogue products.',
  },
  {
    ruleId: '§11.diversification',
    intent: 'Spread an investment across banks rather than concentrating it in one.',
    missingData:
      'The client has not confirmed a maximum amount per bank — no value, basis or scope. The platform applies a deposit-insurance consideration using published DICGC cover, which prefers to keep exposure insured but never refuses a placement. That is not the same as a concentration limit, and this entry stays until the limit is defined.',
  },
] as const;
