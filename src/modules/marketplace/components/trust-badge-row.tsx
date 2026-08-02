import { TrustIndicatorList } from '@/components/business/trust-indicator';
import type { TrustIndicator, TrustIndicatorId } from '@/types/finance';

/**
 * TrustBadgeRow — the approved trust signals on the product-details screen
 * (M2.6, T2.6.4).
 *
 * Presentation-only. The indicators are the **product's own**
 * (`ProductDetails.trustIndicators`), never the platform's static Home list —
 * otherwise an AA+ bank would display an AAA badge (M2.6, gap G5).
 *
 * **This is the one place the approved screens differ in content, not layout**
 * (plan §2.7.2). Desktop shows three badges including "AAA Rating", and spells
 * the insurance cover in full: "₹5L DICGC Insured". Mobile shows two and drops
 * the "₹5L" qualifier.
 *
 * Withheld means withheld: the mobile list is a different list, and the two are
 * swapped with `hidden` / `md:hidden`. `display: none` removes an element from
 * the accessibility tree, so a screen-reader user on a narrow viewport is not
 * handed a badge the design deliberately hides — which is what would happen if
 * the third badge were merely clipped or visually shrunk.
 */
export interface TrustBadgeRowProps {
  indicators: TrustIndicator[];
}

/** Ids the approved mobile screen omits. */
const HIDDEN_ON_MOBILE: readonly TrustIndicatorId[] = ['aaa-rating'];

/** Labels the approved mobile screen shortens. */
const MOBILE_LABELS: Partial<Record<TrustIndicatorId, string>> = {
  'dicgc-insured': 'DICGC Insured',
};

function toMobileIndicators(indicators: TrustIndicator[]): TrustIndicator[] {
  return indicators
    .filter((indicator) => !HIDDEN_ON_MOBILE.includes(indicator.id))
    .map((indicator) => ({ ...indicator, label: MOBILE_LABELS[indicator.id] ?? indicator.label }));
}

export function TrustBadgeRow({ indicators }: TrustBadgeRowProps) {
  if (indicators.length === 0) return null;

  return (
    <>
      <TrustIndicatorList indicators={indicators} className="hidden md:flex" />
      <TrustIndicatorList indicators={toMobileIndicators(indicators)} className="flex md:hidden" />
    </>
  );
}
