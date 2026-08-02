/**
 * Shared financial domain types (promoted in M2.2).
 *
 * These describe concepts the whole platform speaks — banks, trust
 * signals, and product benefits — not marketplace-specific ones. They live
 * here so cross-module components (`components/business`) can consume them
 * without importing from a feature module, and so Portfolio, Booking, and
 * Reports inherit the same vocabulary.
 *
 * Transport shapes (DTOs) stay inside the module that owns the endpoint.
 */

export type TrustIndicatorId = 'rbi-regulated' | 'dicgc-insured' | 'aaa-rating';

export interface TrustIndicator {
  id: TrustIndicatorId;
  label: string;
}

export interface Bank {
  id: string;
  name: string;
  shortCode: string;
  /** Two-letter monogram shown in the circular badge (approved UI). */
  initials: string;
  /**
   * Path to the bank's logo, or `null` when none is licensed/available.
   *
   * Nullable rather than optional on purpose: every `Bank` must state whether
   * it has a logo, so the monogram fallback is a modelled case rather than an
   * accident of a missing field. Components never build this path themselves.
   */
  logoUrl: string | null;
  rating: string | null;
}

export interface Benefit {
  id: string;
  label: string;
}
