import { z } from 'zod';

import rawCatalogue from './demo-tenure-catalogue.json';

/**
 * Synthetic coverage for the demonstration catalogue.
 *
 * These records are intentionally separate from the institution-named fixtures:
 * their rates are test data, never bank offers. Every rendered name includes
 * "Demonstration" and `verified: false` remains in the source payload.
 */
const tenureBandSchema = z
  .object({
    minMonths: z.number().int().positive(),
    maxMonths: z.number().int().positive(),
    annualRate: z.number().nonnegative().finite(),
    seniorAnnualRate: z.number().nonnegative().finite().nullable(),
  })
  .superRefine((band, context) => {
    if (band.maxMonths < band.minMonths) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'maxMonths must be at least minMonths.',
      });
    }
    if (band.seniorAnnualRate !== null && band.seniorAnnualRate < band.annualRate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'seniorAnnualRate cannot be below annualRate.',
      });
    }
  });

const productSchema = z
  .object({
    productId: z.string().min(1),
    institutionId: z.string().min(1),
    minimumInvestment: z.number().positive().finite(),
    maximumInvestment: z.number().positive().finite().nullable(),
    tenureBands: z.array(tenureBandSchema).min(1),
    compoundingFrequency: z.enum(['monthly', 'quarterly', 'annual']),
    payoutType: z.enum(['at-maturity', 'monthly', 'quarterly']),
  })
  .superRefine((product, context) => {
    if (
      product.maximumInvestment !== null &&
      product.maximumInvestment < product.minimumInvestment
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'maximumInvestment cannot be below minimumInvestment.',
      });
    }

    const bands = [...product.tenureBands].sort((a, b) => a.minMonths - b.minMonths);
    for (let index = 1; index < bands.length; index += 1) {
      const previous = bands[index - 1]!;
      const current = bands[index]!;
      if (current.minMonths <= previous.maxMonths) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'tenureBands cannot overlap.' });
      }
    }
  });

export const demoTenureCatalogueSchema = z
  .object({
    dataSource: z.literal('demonstration-synthetic'),
    verified: z.literal(false),
    currency: z.literal('INR'),
    institutions: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })).min(1),
    products: z.array(productSchema).min(1),
  })
  .superRefine((catalogue, context) => {
    const institutionIds = new Set<string>();
    catalogue.institutions.forEach((institution) => {
      if (institutionIds.has(institution.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate institution id: ${institution.id}.`,
        });
      }
      institutionIds.add(institution.id);
    });

    const productIds = new Set<string>();
    catalogue.products.forEach((product) => {
      if (productIds.has(product.productId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate product id: ${product.productId}.`,
        });
      }
      productIds.add(product.productId);
      if (!institutionIds.has(product.institutionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown institution id: ${product.institutionId}.`,
        });
      }
    });
  });

export type DemoTenureCatalogue = z.infer<typeof demoTenureCatalogueSchema>;

/** Validates an arbitrary fixture with actionable Zod issues for tests and import checks. */
export function validateDemoTenureCatalogue(input: unknown): DemoTenureCatalogue {
  return demoTenureCatalogueSchema.parse(input);
}

/** The checked JSON is the only source used by the synthetic tenure products. */
export const demoTenureCatalogue = validateDemoTenureCatalogue(rawCatalogue);
