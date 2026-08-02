import type { PaginationMeta, PaginationParams } from '@/types/pagination';

/**
 * Repository foundation — transport-agnostic contracts (T1.14).
 *
 * Repositories are the only seam that knows how data is fetched. Services
 * depend on these interfaces, never on a concrete implementation, so the
 * transport can change (MSW → REST → GraphQL → a future backend) without
 * touching services, hooks, or components.
 *
 * Domain-agnostic by design: no product, bank, or other business type
 * appears here. Concrete repositories are created by their own module when
 * that module exists (Phase 2).
 */

/** A page of results plus the metadata needed to render pagination. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Query parameters accepted by collection endpoints (Document 10 §8–9). */
export interface CollectionParams extends PaginationParams {
  /** Combinable filters; each module declares its own filter shape. */
  filters?: Record<string, string | number | boolean | undefined>;
}

/** Read access to a collection of `T` identified by `TId`. */
export interface ReadRepository<T, TId = string> {
  list(params?: CollectionParams): Promise<Paginated<T>>;
  getById(id: TId): Promise<T>;
}

/** Write access; compose with ReadRepository for full CRUD contracts. */
export interface WriteRepository<T, TCreate = T, TUpdate = Partial<T>, TId = string> {
  create(payload: TCreate): Promise<T>;
  update(id: TId, payload: TUpdate): Promise<T>;
  remove(id: TId): Promise<void>;
}

/** Convenience contract for resources needing both reads and writes. */
export type Repository<T, TCreate = T, TUpdate = Partial<T>, TId = string> = ReadRepository<
  T,
  TId
> &
  WriteRepository<T, TCreate, TUpdate, TId>;
