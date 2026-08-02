import { request, requestWithMeta } from '@/services/api';
import type { PaginationMeta } from '@/types/pagination';

import type { CollectionParams, Paginated, ReadRepository } from './types';

/**
 * createApiReadRepository — the HTTP implementation pattern for
 * ReadRepository (T1.14).
 *
 * A module supplies its resource path and its own DTO type; this factory
 * supplies the transport. Swapping to a different transport later means
 * writing another factory that satisfies the same interface — services and
 * hooks above are untouched.
 *
 * Domain-agnostic: no business resource is registered here. The first
 * concrete repository is created by the Marketplace module in Phase 2.
 */
const EMPTY_META: PaginationMeta = { page: 1, limit: 0, total: 0, totalPages: 0 };

export function createApiReadRepository<T>(resourcePath: string): ReadRepository<T> {
  return {
    async list(params?: CollectionParams): Promise<Paginated<T>> {
      const { filters, ...pagination } = params ?? {};
      const { data, meta } = await requestWithMeta<T[]>({
        method: 'GET',
        url: resourcePath,
        params: { ...pagination, ...filters },
      });
      return { items: data, meta: meta ?? { ...EMPTY_META, total: data.length } };
    },

    async getById(id: string): Promise<T> {
      return request<T>({ method: 'GET', url: `${resourcePath}/${id}` });
    },
  };
}
