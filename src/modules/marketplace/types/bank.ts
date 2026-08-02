/**
 * Bank types for the Marketplace module (M2.1, refactored in M2.2).
 *
 * The domain models (`Bank`, `TrustIndicator`) are platform-shared and now
 * live in `@/types` so cross-module components can consume them without
 * importing a feature module. Only the transport shape (DTO) belongs here,
 * beside the endpoint that returns it.
 */
export type { Bank, TrustIndicator, TrustIndicatorId } from '@/types/finance';

export interface BankDto {
  id: string;
  name: string;
  shortCode: string;
  initials: string;
  /** Logo path served by the API; `null` when the bank has none. */
  logoUrl: string | null;
  rating: string | null;
}
