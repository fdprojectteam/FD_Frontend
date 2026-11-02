import { z } from 'zod';

import type { ProductMaster } from '@/types/product-master';

/**
 * The wire → `ProductMaster` mapping, and the **only** place that conversion
 * happens.
 *
 * ## Why the wire shape is declared here rather than imported
 *
 * `ProductSummaryDto` lives in `src/modules/marketplace/types/product.ts`, and
 * `src/services` may not import from `src/modules` — the boundary is
 * ESLint-enforced (`eslint.config.mjs`, `services → services|lib|config|
 * constants|types|utils`). Marketplace must not be modified either.
 *
 * So this file declares the **subset of the HTTP payload it actually maps**.
 * That is not a second opinion about the domain: the wire format is owned by the
 * API, and Marketplace's DTO is one client's view of it. This is another client's
 * view, deliberately narrower.
 *
 * ## Why Zod rather than a cast
 *
 * A type-only import would give compile-time coupling and no runtime safety. A
 * declared-and-parsed schema gives the opposite, which is the more useful half:
 * if the payload ever drifts from what this mapper expects, the parse **fails
 * closed and says so** instead of producing a `ProductMaster` with `undefined`
 * where a rate should be.
 *
 * The same reasoning, and the same failure posture, as `draft-storage.ts`.
 */

/** Bank fields the mapper needs — matches the platform `Bank` exactly. */
const bankSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortCode: z.string(),
  initials: z.string(),
  logoUrl: z.string().nullable(),
  rating: z.string().nullable(),
  /*
    Optional because a bank may be unclassified, but it must survive the wire:
    the client document requires Small Finance Banks to be identified at the
    recommendation, and the schema was stripping the field that says so.
  */
  category: z.enum(['universal', 'small-finance']).optional(),
});

const rateBandSchema = z.object({
  minAmount: z.number().nonnegative().finite(),
  annualRate: z.number().positive().finite(),
});

/**
 * The payload subset this mapper reads.
 *
 * Unknown keys are **stripped**, not rejected: the endpoint legitimately serves
 * `benefits`, `categories` and `flags` for Marketplace, and this consumer has no
 * business failing because another consumer's fields are present.
 */
export const productWireSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  bank: bankSchema,
  /** The published base rate. Required: a product that priced nothing could not be sold. */
  interestRate: z.number().positive().finite(),
  /**
   * Whole months, or **`0` when the published term is not a whole number of
   * months** — a 91-day deposit, for instance. Zero is already the value the
   * candidate filters and the rate resolver reject, so such a product is
   * excluded from the month-based engine rather than rounded into it.
   */
  tenureMonths: z.number().int().nonnegative(),
  /** The term in its published unit. Optional on the wire; defaulted to months below. */
  tenure: z
    .object({ value: z.number().positive(), unit: z.enum(['days', 'months', 'years']) })
    .optional(),
  minInvestment: z.number().positive().finite(),
  dataStatus: z.enum(['verified-live', 'illustrative']).optional(),
  rateSource: z
    .object({
      url: z.string().url(),
      effectiveFrom: z.string().min(1),
      tenureLabel: z.string().min(1),
    })
    .optional(),
  interestType: z.enum(['cumulative', 'non-cumulative']),
  payout: z.enum(['at-maturity', 'monthly', 'quarterly']),
  compoundingFrequency: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  rateSlabs: z.array(rateBandSchema).optional(),
  /** The senior-citizen uplift in percentage points, where the product publishes one. */
  seniorCitizenDelta: z.number().positive().finite().optional(),
});

export type ProductWireRecord = z.infer<typeof productWireSchema>;

/**
 * Maps one validated payload record to a `ProductMaster`.
 *
 * Four transformations, and nothing else:
 *
 * 1. `id` → `productId` — a rename, same value.
 * 2. `interestRate` → `terms.baseRate` — a rename, same value (decision D1).
 *    The wire name reads as "the rate this product pays", which stops being true
 *    the moment `rateSlabs` exists; `baseRate` states what the field actually
 *    governs — the rate that applies when no band does.
 * 3. `rateSlabs?` → `terms.rateSlabs` — `undefined` normalises to `[]`. Absent
 *    legitimately means "no published bands; the base rate applies at every
 *    amount", and one shape spares every consumer an optional check.
 * 4. `productType: 'fixed-deposit'` — a **literal discriminant**, not business
 *    data. The endpoint serves fixed deposits and nothing else; when it serves a
 *    second product type this becomes a real branch.
 *
 * No value is computed, defaulted or invented. In particular no *effective* rate
 * is produced here: that is `resolveProductRate`'s answer, and it depends on an
 * amount this mapper does not have.
 */
export function toProductMaster(record: ProductWireRecord): ProductMaster {
  return {
    productId: record.id,
    name: record.name,
    bank: record.bank,
    minInvestment: record.minInvestment,
    ...(record.dataStatus === undefined ? {} : { dataStatus: record.dataStatus }),
    ...(record.rateSource === undefined ? {} : { rateSource: record.rateSource }),
    productType: 'fixed-deposit',
    terms: {
      tenureMonths: record.tenureMonths,
      /*
        A payload that omits `tenure` is stating a term in whole months — which
        is what every existing product does — so the published unit is months and
        the two fields agree. It is a normalisation, not a conversion: nothing is
        rounded, and a day-based term must send `tenure` explicitly.
      */
      tenure: record.tenure ?? { value: record.tenureMonths, unit: 'months' },
      baseRate: record.interestRate,
      rateSlabs: record.rateSlabs ?? [],
      /*
        Spread rather than defaulted: absent means the product publishes no
        senior-citizen benefit, which is a different statement from a benefit of
        zero — and `??  0` here would make the two indistinguishable downstream.
      */
      ...(record.seniorCitizenDelta === undefined
        ? {}
        : { seniorCitizenDelta: record.seniorCitizenDelta }),
      interestType: record.interestType,
      payout: record.payout,
      ...(record.compoundingFrequency === undefined
        ? {}
        : { compoundingFrequency: record.compoundingFrequency }),
    },
  };
}

/**
 * Parses and maps one record, or returns `null` when the payload does not match.
 *
 * Fails closed per record rather than throwing for the whole page: one
 * malformed product should cost that product, not the entire catalogue a
 * recommendation engine is about to reason over.
 */
export function parseProductMaster(record: unknown): ProductMaster | null {
  const parsed = productWireSchema.safeParse(record);

  return parsed.success ? toProductMaster(parsed.data) : null;
}

/** Parses a collection, dropping records that do not match. */
export function parseProductMasters(records: readonly unknown[]): ProductMaster[] {
  return records
    .map(parseProductMaster)
    .filter((product): product is ProductMaster => product !== null);
}
