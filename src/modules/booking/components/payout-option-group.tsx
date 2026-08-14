'use client';

import { CalendarDays } from 'lucide-react';

import { RadioCardGroup } from '@/components/ui/radio-card-group';

import type { PayoutOptionId } from '../types/draft';
import type { PayoutOption } from '../utils/payout-options';

/**
 * PayoutOptionGroup — how the user chooses to receive their interest (T3.2.9).
 *
 * **Presentation-only** (invariant I3). It renders the options it is given and
 * reports which was chosen. Which options exist for a product is
 * `resolvePayoutOptions`; what each one does to the money is `calculateReturns`.
 * Neither decision is repeated here — this component's entire job is that the
 * choice is legible and operable.
 *
 * ## Built on the platform primitive
 *
 * `RadioCardGroup` (T3.2.3) already provides the whole control: a real
 * `<fieldset>`/`<legend>` with real radios, so the group is **one tab stop**
 * with arrow-key movement inside it, and no `aria-*` attribute is needed
 * anywhere. This file adds the domain — the icon, and the mapping from a payout
 * id to a card.
 *
 * A `BookingRadioGroup` would have been the mistake CLAUDE.md names in the other
 * direction; the primitive was built for exactly this and the tenure control
 * will not need a second one.
 *
 * ## The icon
 *
 * One glyph for every option, and deliberately so. The approved artwork draws
 * the same calendar tile on all three cards: what differs between At Maturity
 * and Monthly is *when*, not *what*, and giving each a distinct icon would
 * invent a visual taxonomy the design does not have. It is `aria-hidden` —
 * the label and description carry the meaning.
 */
export interface PayoutOptionGroupProps {
  /** Already narrowed to what this product offers — see `resolvePayoutOptions`. */
  options: PayoutOption[];
  value: PayoutOptionId | null;
  onChange: (payoutOption: PayoutOptionId) => void;
  /** Trailing content beside the legend, e.g. the artwork's info affordance. */
  labelAdornment?: React.ReactNode;
  /** The screen already renders the approved heading, so the legend is hidden by default. */
  labelHidden?: boolean;
}

export function PayoutOptionGroup({
  options,
  value,
  onChange,
  labelAdornment,
  labelHidden = true,
}: PayoutOptionGroupProps) {
  /*
    A product offering nothing renders nothing rather than an empty fieldset.
    `defaultPayoutOption` returns null for the same product, so the returns strip
    stays in its awaiting state — the two agree without either checking the
    other.
  */
  if (options.length === 0) return null;

  return (
    <RadioCardGroup<PayoutOptionId>
      label="Interest Payout Options"
      labelHidden={labelHidden}
      labelAdornment={labelAdornment}
      value={value}
      onChange={onChange}
      options={options.map((option) => ({
        id: option.id,
        title: option.label,
        description: option.description,
        icon: <CalendarDays className="size-4" />,
      }))}
    />
  );
}
