import type { Paginated } from '@/services/repository';

import type { ProductSummary } from '../types/product';

/**
 * Product preview selection (M2.6, decision D1 = A′).
 *
 * The product-details screen renders its header, rate, and key-information
 * grid the instant it opens. Until M2.6 that was achieved by *writing* a
 * `ProductSummary` into the detail cache under a key typed `ProductDetails`,
 * which left `eligibility`, `faqs`, `terms`, `interestBreakdown`, and
 * `trustIndicators` undefined for one paint while TypeScript insisted they
 * existed (M2.4 risk R3).
 *
 * The summary is already cached — the listing page the user clicked from holds
 * it. So the preview is *read* rather than written. Consequences worth stating,
 * because they are the reason for the design:
 *
 *   • no cache entry is ever written with a value that does not match its
 *     key's type;
 *   • no new query key is introduced (invariant I5);
 *   • `ProductDetails extends ProductSummary`, so a consumer reads
 *     `details ?? preview` and holds a correctly typed `ProductSummary`
 *     either way;
 *   • a cold load has no list cache, so the preview is `undefined` and the
 *     screen shows a skeleton — the honest answer, since nothing is known yet.
 *
 * Pure and React-free so the selection rule is assertable without rendering:
 * the parameter is the *data* of every cached list page, not a QueryClient.
 * The hook that supplies those pages is `useProductPreview`.
 */
export function selectProductPreview(
  pages: readonly (Paginated<ProductSummary> | undefined)[],
  id: string,
): ProductSummary | undefined {
  if (!id) return undefined;

  for (const page of pages) {
    const match = page?.items.find((product) => product.id === id);
    // Returns the cached object itself, not a copy: identity stays stable
    // across renders, so a consumer's useMemo keyed on it converges.
    if (match) return match;
  }

  return undefined;
}
