import { Database } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Where the figures on a screen came from — the platform's single answer.
 *
 * ## Why one component rather than a sentence per screen
 *
 * Home, Product Details and Booking each need to say the same thing: the
 * catalogue is demonstration data, the figures beside it are the platform's own
 * arithmetic, and the bank settles the terms. Written three times those three
 * sentences drift, and the drift is invisible until someone reads all three
 * screens in one sitting — which is exactly the journey a customer takes before
 * committing money. `SafetyNote` already establishes this pattern for deposit
 * coverage; this is its counterpart for provenance.
 *
 * ## The distinction it exists to make
 *
 * The product was mixing two kinds of statement that look alike and are not:
 *
 * | Kind | Example | True here? |
 * |---|---|---|
 * | Demonstration catalogue data | a bank's rate, its rating | present, unverified |
 * | Platform calculation | estimated maturity, interest earned | genuinely computed |
 * | Independent verification | "RBI verified", "bank-grade encryption" | **not true** |
 *
 * The first two are honest and worth showing. The third was being implied by
 * presentation — green ticks, shields, "100% Safe & Secure" — without anything
 * behind it. This component states the first two plainly so the third is never
 * needed to make a screen feel trustworthy.
 *
 * ## Why it names no regulator, insurer or certification
 *
 * Because the platform has checked with none of them. A sentence that mentions
 * RBI or DICGC in a reassuring tone reads as a claim about *this* deposit at
 * *this* bank, and nothing in this build establishes that. `SafetyNote` states
 * the coverage conditionality where coverage is genuinely the subject; this
 * says where the numbers came from and stops there.
 *
 * Server-rendered; it holds no state and takes no data.
 */
export interface DataProvenanceNoteProps {
  /**
   * `catalogue` — a screen showing bank and product information.
   * `booking` — a screen where the customer is about to commit.
   *
   * The difference is what the customer does next, not how honest the sentence
   * is. At booking the confirmation step is imminent, so the note names it.
   */
  tone?: 'catalogue' | 'booking';
  className?: string;
}

const TEXT: Record<'catalogue' | 'booking', string> = {
  catalogue:
    'Bank and product details come from a demonstration catalogue, and the figures beside them are calculated by this platform. Nothing here has been verified with the bank — confirm the current rate card and final terms before you invest.',
  booking:
    'Bank and product details come from a demonstration catalogue, and every figure shown is calculated by this platform. The bank confirms its rate, eligibility and final terms when the application is submitted.',
};

export function DataProvenanceNote({ tone = 'catalogue', className }: DataProvenanceNoteProps) {
  return (
    <p className={cn('text-caption text-content-muted flex items-start gap-2', className)}>
      <Database aria-hidden="true" className="text-content-muted mt-0.5 size-4 shrink-0" />
      <span>{TEXT[tone]}</span>
    </p>
  );
}
