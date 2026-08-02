import { request } from '@/services/api';
import { createApiReadRepository } from '@/services/repository';

import type { ProductRepository } from './product-repository';
import type { ProductListParams } from '../types/filters';
import type { ProductDetailsDto, ProductSummaryDto } from '../types/product';

/**
 * HTTP implementation of ProductRepository (M2.1).
 *
 * Composes the generic read repository from T1.14 for list/getById and
 * adds the batch method the comparison screen needs. All traffic goes
 * through the shared API client — axios is never imported here.
 */
const RESOURCE = '/products';

export function createApiProductRepository(): ProductRepository {
  const base = createApiReadRepository<ProductSummaryDto>(RESOURCE);

  return {
    list: (params?: ProductListParams) => base.list(params),

    getById: (id: string) =>
      request<ProductDetailsDto>({ method: 'GET', url: `${RESOURCE}/${id}` }),

    listByIds: (ids: string[]) =>
      request<ProductDetailsDto[]>({
        method: 'GET',
        url: RESOURCE,
        params: { ids: ids.join(',') },
      }),
  };
}
