import type { Eligibility } from '../types/product';

/**
 * EligibilityPanel — the approved eligibility statement (M2.6, T2.6.6).
 *
 * Presentation-only: it receives an `Eligibility` and renders it.
 *
 * **Only `summary` is shown.** The domain type also carries `minAge`,
 * `residency`, and `panRequired`, but the approved screen displays a single
 * sentence — which already contains all three. Rendering them as extra rows
 * would be inventing UI the design does not have, and would say the same thing
 * twice.
 *
 * A muted surface with no border and no shadow, so it reads as an inset note
 * rather than a `Card` (plan §2.7.4).
 */
export interface EligibilityPanelProps {
  eligibility: Eligibility;
}

export function EligibilityPanel({ eligibility }: EligibilityPanelProps) {
  return (
    <div className="bg-surface-muted rounded-card p-6">
      <p className="text-body text-content-muted font-medium">{eligibility.summary}</p>
    </div>
  );
}
