/**
 * The commercial terms the customer saw when choosing a product. This is a
 * comparison snapshot, never a pricing authority: Booking always resolves the
 * current product record again before displaying or calculating a rate.
 */
export interface BookingTermsSnapshot {
  productId: string;
  bankId: string;
  tenureMonths: number;
  annualRate: number;
  customerCategory: 'regular' | 'senior';
  payout: 'at-maturity' | 'monthly' | 'quarterly';
  interestType: 'cumulative' | 'non-cumulative';
  compoundingFrequency: 'monthly' | 'quarterly' | 'annual' | null;
  principal: number;
}

/** Query key used only on Booking's entry route. */
export const BOOKING_SELECTION_PARAM = 'selection';

export function serialiseBookingTermsSnapshot(snapshot: BookingTermsSnapshot): string {
  return JSON.stringify(snapshot);
}

/** Reject malformed or repeated URL values rather than guessing a selection. */
export function parseBookingTermsSnapshot(
  raw: string | string[] | null | undefined,
): BookingTermsSnapshot | null {
  if (typeof raw !== 'string') return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const category = record.customerCategory;
    const payout = record.payout;
    const interestType = record.interestType;
    const compounding = record.compoundingFrequency;
    const tenureMonths = record.tenureMonths;
    const annualRate = record.annualRate;
    const principal = record.principal;

    if (
      typeof record.productId !== 'string' ||
      typeof record.bankId !== 'string' ||
      typeof tenureMonths !== 'number' ||
      !Number.isInteger(tenureMonths) ||
      typeof annualRate !== 'number' ||
      !Number.isFinite(annualRate) ||
      (category !== 'regular' && category !== 'senior') ||
      (payout !== 'at-maturity' && payout !== 'monthly' && payout !== 'quarterly') ||
      (interestType !== 'cumulative' && interestType !== 'non-cumulative') ||
      (compounding !== null &&
        compounding !== 'monthly' &&
        compounding !== 'quarterly' &&
        compounding !== 'annual') ||
      typeof principal !== 'number' ||
      !Number.isSafeInteger(principal) ||
      principal <= 0
    ) {
      return null;
    }

    return {
      productId: record.productId,
      bankId: record.bankId,
      tenureMonths,
      annualRate,
      customerCategory: category,
      payout,
      interestType,
      compoundingFrequency: compounding,
      principal,
    };
  } catch {
    return null;
  }
}
