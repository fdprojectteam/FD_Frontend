import type { Paginated } from '@/services/repository';
import type { MaturityResult } from '@/types/finance';
import { publishedTenure, resolveApplicableRate, toWholeMonths } from '@/utils/finance';

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
 *
 * As of the 2026-08-02 change request that ownership extends to the **rate**.
 * The comparison screen calculates on a user-entered deposit, and the rate that
 * deposit earns is drawn from the product's slabs rather than from its headline
 * figure. Resolving it here — one line above the call that consumes it — is what
 * guarantees `appliedRate` and `maturityValue` can never describe different
 * rates. Had the rate been resolved in a hook or a component, the two would be
 * one refactor apart from disagreeing, and the disagreement would render
 * perfectly: a plausible rate above a maturity value computed from another.
 */
/**
 * The returns a given amount earns on a product — rate resolution and maturity
 * in one place.
 *
 * ## Why it is here and not on the screen
 *
 * The Product Details calculator recomputed both when the user typed an amount,
 * which put a second implementation of the pricing rule in a component. Two
 * implementations of one rule are one refactor apart from disagreeing, and the
 * disagreement renders perfectly: a plausible rate above a maturity computed
 * from another.
 *
 * `toSummary` below and this function now share the one resolver, so the
 * reference figure on arrival and the figure after typing come from the same
 * rule by construction.
 *
 * Returns `null` when the product's term is not expressible in whole months —
 * a deposit published in days has no month count to compound over, and the
 * platform does not assume a day-count basis.
 */
export function estimateReturnsFor(
  product: Pick<ProductSummary, 'interestRate' | 'rateSlabs' | 'tenureMonths' | 'tenure'>,
  amount: number,
): (MaturityResult & { appliedRate: number }) | null {
  const tenureMonths = toWholeMonths(publishedTenure(product));
  if (tenureMonths === null) return null;

  const appliedRate = resolveApplicableRate(product.interestRate, amount, product.rateSlabs);

  return {
    appliedRate,
    ...calculateMaturity({ principal: amount, annualRate: appliedRate, tenureMonths }),
  };
}

function toSummary(dto: ProductSummaryDto, referenceAmount: number): ProductSummary {
  const appliedRate = resolveApplicableRate(dto.interestRate, referenceAmount, dto.rateSlabs);

  return {
    ...dto,
    estimatedReturns: {
      ...calculateMaturity({
        principal: referenceAmount,
        annualRate: appliedRate,
        tenureMonths: dto.tenureMonths,
        /* Passed through so the display layer can print the published unit. */
        ...(dto.tenure === undefined ? {} : { tenure: dto.tenure }),
      }),
      appliedRate,
    },
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
