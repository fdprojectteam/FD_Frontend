import type { Paginated } from '@/services/repository';

import type { ProductListParams } from '../types/filters';
import type { ProductDetailsDto, ProductSummaryDto } from '../types/product';

/**
 * ProductRepository — the transport contract for FD products (M2.1).
 *
 * Transport-only: it returns DTOs exactly as the API delivers them and
 * performs no calculation, mapping, or business logic (those belong to
 * ProductService). Swapping MSW → REST → GraphQL means providing another
 * implementation of this interface; nothing above it changes.
 */
export interface ProductRepository {
  list(params?: ProductListParams): Promise<Paginated<ProductSummaryDto>>;
  getById(id: string): Promise<ProductDetailsDto>;
  /**
   * Batch fetch for the comparison screen (up to four ids).
   *
   * **Detail-level, not summary-level** (T2.7.1a). The approved comparison
   * screen has an Eligibility row, and `eligibility` exists only on the
   * details payload — so a summary batch cannot render the approved screen.
   * `eligibility` is the only field the screen needs beyond the summary;
   * reusing `ProductDetailsDto` delivers it without adding a third product
   * shape, at the cost of four fields the comparison does not read.
   */
  listByIds(ids: string[]): Promise<ProductDetailsDto[]>;
}
