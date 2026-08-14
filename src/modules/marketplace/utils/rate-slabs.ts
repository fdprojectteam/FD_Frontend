/**
 * Rate-slab resolution — **moved to the platform layer** (R1, step 2 · partial).
 *
 * The implementation now lives in `@/utils/finance/rates.ts`, unchanged. Only
 * its address moved: Goal-Based FD may import `utils` but may not import
 * Marketplace (`eslint.config.mjs`), so a rule kept inside a feature module was
 * a rule the platform could not reach. See
 * `docs/engineering/shared-finance-layer.md` §5.
 *
 * This file is a re-export so that Marketplace's existing import paths keep
 * working. There is **no second implementation** — nothing here to drift.
 *
 * Safe to delete once `../utils/index.ts` and `../services/product-service.ts`
 * are the only readers and both already point at `@/utils/finance`.
 */
export { resolveApplicableRate } from '@/utils/finance';
