import type { Paginated } from '@/services/repository';

import { REFERENCE_AMOUNT } from '../constants/filters';
import { productRepository, type ProductRepository } from '../repositories';
import type { ProductListParams } from '../types/filters';
import type {
  ProductDetails,
  ProductDetailsDto,
  ProductSummary,
  ProductSummaryDto,
} from '../types/product';
import { calculateMaturity } from '../utils/maturity';

/**
 * ProductService — business operations for FD products (M2.1).
 *
 * Owns every derived value: DTO → domain mapping and the estimated
 * returns shown on cards and comparison rows. Repositories stay
 * transport-only; components and hooks never calculate anything
 * (Document 10 §15, Document 12 §5).
 */
function toSummary(dto: ProductSummaryDto, referenceAmount: number): ProductSummary {
  return {
    ...dto,
    estimatedReturns: calculateMaturity({
      principal: referenceAmount,
      annualRate: dto.interestRate,
      tenureMonths: dto.tenureMonths,
    }),
  };
}

function toDetails(dto: ProductDetailsDto, referenceAmount: number): ProductDetails {
  return {
    ...toSummary(dto, referenceAmount),
    trustIndicators: dto.trustIndicators,
    eligibility: dto.eligibility,
    interestBreakdown: dto.interestBreakdown,
    faqs: dto.faqs,
    terms: dto.terms,
  };
}

export function createProductService(repository: ProductRepository = productRepository) {
  return {
    /** Paginated list; estimated returns computed on the reference amount. */
    async getProducts(
      params?: ProductListParams,
      referenceAmount: number = REFERENCE_AMOUNT,
    ): Promise<Paginated<ProductSummary>> {
      const page = await repository.list(params);
      return {
        items: page.items.map((dto) => toSummary(dto, referenceAmount)),
        meta: page.meta,
      };
    },

    async getProduct(
      id: string,
      referenceAmount: number = REFERENCE_AMOUNT,
    ): Promise<ProductDetails> {
      const dto = await repository.getById(id);
      return toDetails(dto, referenceAmount);
    },

    /**
     * The comparison batch — **detail-level** (T2.7.1a).
     *
     * `toDetails` rather than `toSummary`, because the approved comparison
     * screen has an Eligibility row and `eligibility` lives only on the
     * details payload. `toDetails` delegates to `toSummary`, so the maturity
     * calculation still happens exactly once, in exactly this place.
     */
    async getProductsByIds(
      ids: string[],
      referenceAmount: number = REFERENCE_AMOUNT,
    ): Promise<ProductDetails[]> {
      if (ids.length === 0) return [];
      const dtos = await repository.listByIds(ids);
      return dtos.map((dto) => toDetails(dto, referenceAmount));
    },
  };
}

export const productService = createProductService();
export type ProductService = ReturnType<typeof createProductService>;
