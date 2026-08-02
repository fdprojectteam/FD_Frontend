import { createApiBankRepository } from './api-bank-repository';
import { createApiProductRepository } from './api-product-repository';

export type { ProductRepository } from './product-repository';
export type { BankRepository } from './bank-repository';
export { createApiProductRepository } from './api-product-repository';
export { createApiBankRepository } from './api-bank-repository';

/**
 * Active repository wiring (M2.1).
 *
 * The single place that decides which implementation the module uses.
 * Changing transport later — a different REST shape, GraphQL, or a
 * server-side data source — is a change to these two lines only.
 */
export const productRepository = createApiProductRepository();
export const bankRepository = createApiBankRepository();
