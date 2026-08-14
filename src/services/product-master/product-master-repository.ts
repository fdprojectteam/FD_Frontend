import { isNotFoundError } from '@/services/api';
import { createApiReadRepository } from '@/services/repository';
import type { ProductMaster } from '@/types/product-master';

import { parseProductMaster, parseProductMasters } from './product-master-mapper';

/**
 * `ProductMasterRepository` — the platform's read access to bank products.
 *
 * Two methods, because two are what the approved consumers need:
 *
 * - **`findAll`** — Goal-Based FD's candidate set. The rule engine filters in
 *   its own rules layer, which *is* the engine; server-side filtering here would
 *   duplicate Marketplace's `toProductListParams` for a consumer that does not
 *   use it.
 * - **`findById`** — Booking's eventual resolution path.
 *
 * No create, update, delete, pagination or query parameters. Adding them now
 * would be building an admin API nobody has asked for.
 *
 * ## It consumes the same endpoint Marketplace does
 *
 * `/api/v1/products`, through the existing generic `createApiReadRepository`.
 * That is what keeps this additive: no new endpoint, no MSW change, no
 * Marketplace change. Two independent clients of one HTTP contract, each parsing
 * the subset it needs.
 *
 * ## Failure posture
 *
 * A record that does not parse is **dropped**, not thrown. One malformed product
 * costs that product; it does not deny a recommendation engine the whole
 * catalogue. `findById` returns `null` for both "not found" and "did not parse",
 * because to a caller they mean the same thing: no usable product under that id.
 */
export interface ProductMasterRepository {
  /** Every product the catalogue serves that this platform can express. */
  findAll(): Promise<ProductMaster[]>;
  /** One product by id, or `null` when it does not exist or cannot be parsed. */
  findById(productId: string): Promise<ProductMaster | null>;
}

/** The resource path, matching the existing product endpoints. */
const PRODUCTS_RESOURCE = '/products';

/**
 * The HTTP implementation.
 *
 * A factory rather than a singleton so tests and a future server-side caller can
 * each hold their own, and so nothing imports a live instance at module load.
 */
export function createProductMasterRepository(): ProductMasterRepository {
  /*
    Typed `unknown` on purpose: the transport is not trusted to have the shape
    this consumer wants, and `parseProductMaster` is the only thing entitled to
    decide that it does.
  */
  const source = createApiReadRepository<unknown>(PRODUCTS_RESOURCE);

  return {
    async findAll(): Promise<ProductMaster[]> {
      const { items } = await source.list();
      return parseProductMasters(items);
    },

    async findById(productId: string): Promise<ProductMaster | null> {
      /*
        The documented contract is `null` for both "not found" and "did not
        parse", because to a caller they mean the same thing: no usable product
        under that id.

        A 404 was reaching callers as a thrown `ApiError` instead, so Booking's
        not-found boundary never ran and an unknown id surfaced as a runtime
        error. Only *not found* is converted — a 500, a timeout or an offline
        transport still throws, because those mean "ask again", not "no such
        product".
      */
      try {
        const record = await source.getById(productId);
        return parseProductMaster(record);
      } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
      }
    },
  };
}
