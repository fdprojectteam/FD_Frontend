import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The deposit-coverage note, shown with the recommendation.
 *
 * ## One note, both places
 *
 * The client document requires the coverage note **at recommendation and at
 * booking**. Those are different modules and module → module is forbidden, so
 * the note lives here in shared components and both render the same component.
 * Two copies of a compliance sentence is one copy too many: they would drift,
 * and the drift would be silent.
 *
 * ## Why this exists
 *
 * The client source document requires it, twice:
 *
 * > *"Deposit insurance and product terms are subject to applicable rules and
 * > bank-specific conditions. The platform should display the coverage note
 * > clearly **at the time of recommendation and booking**."*
 *
 * > *"…the recommendation should clearly show the applicable deposit-insurance
 * > note and concentration logic."*
 *
 * The platform showed DICGC indicators on Home, Marketplace and Booking, and
 * **not** on the recommendation — so the note appeared at booking and not at
 * the moment the customer is deciding. This closes that gap
 * (`12-client-source-conformance.md` §5).
 *
 * ## Why it never animates
 *
 * Every other part of the recommendation reveals in sequence. This does not.
 * A mandatory disclosure that arrives after the call to action is a disclosure
 * the customer can act past, so it is present at the recommendation's first
 * paint with no delay, no stagger and no entrance. That is a deliberate
 * exception to the reveal, recorded in `motion-architecture.md` §2.3.
 *
 * ## What it does not claim
 *
 * It states the conditionality the client document states, and no figure. A
 * specific coverage amount here would be a claim about *this* deposit at *this*
 * bank, which the catalogue does not model per-bank — and the document is
 * explicit that DICGC treatment must be verified from official sources before
 * production. So the note says the terms apply and are subject to conditions,
 * which is exactly what is known.
 */
export function SafetyNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-caption text-content-muted flex items-start gap-2', className)}>
      <ShieldCheck aria-hidden="true" className="text-content-muted mt-0.5 size-4 shrink-0" />
      <span>
        Deposit insurance and product terms are subject to applicable rules and bank-specific
        conditions. Coverage is confirmed with the bank at the time of booking.
      </span>
    </p>
  );
}
