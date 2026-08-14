'use client';

import { useId } from 'react';

import { Chip } from '@/components/ui/chip';
import { formatCompactCurrency, formatCurrency } from '@/utils/format';

/**
 * QuickAmountChips — the "Quick Select" row beside the amount field (T3.2.8).
 *
 * **Absolute, not additive** (decision C3a). Pressing a chip *sets* the
 * investment amount. The approved artwork labels these `+ ₹5L`; the `+` is
 * omitted here and logged as a UI inconsistency, because a plus sign on a
 * control that replaces the value is a wrong instruction on a money field, not
 * a styling preference.
 *
 * **Presentation-only.** It renders the amounts it is given and reports which
 * one was pressed. Deciding *which* amounts may be offered is `resolveQuickAmounts`
 * (C3b), so the rule that no chip may be invalid is enforced in a pure function
 * the suite can assert rather than in a component the suite must render.
 *
 * ## Selection is a match, not a mode
 *
 * A chip reads as selected when its value equals the current amount. It is not
 * a toggle — pressing the selected chip again sets the same value, which is a
 * no-op rather than a deselection, because there is no such thing as "no
 * amount" once one has been typed.
 *
 * `Chip` exposes this as `aria-pressed`, which is the right role for a control
 * whose state is "this is the current value". The group is labelled so the
 * chips are not three unexplained buttons in the tab order.
 *
 * ## Accessibility
 *
 * The visible label is compact ("₹5L") because the row was designed for three
 * of them; the accessible name is the full figure ("Set investment amount to
 * ₹5,00,000"), because "five L" is not what a screen reader should say about
 * half a million rupees.
 */
export interface QuickAmountChipsProps {
  /** Already filtered to values this product accepts — see `resolveQuickAmounts`. */
  amounts: number[];
  /** The current amount, used only to mark a chip as the active value. */
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  label?: string;
}

export function QuickAmountChips({
  amounts,
  selectedAmount,
  onSelect,
  label = 'Quick Select',
}: QuickAmountChipsProps) {
  const labelId = useId();

  /*
    A product whose limits exclude every candidate renders nothing at all,
    rather than an empty labelled group. C3b's rule taken to its conclusion: if
    no chip is valid, there is no Quick Select.
  */
  if (amounts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-caption text-content-muted font-medium">
        {label}
      </span>

      <div role="group" aria-labelledby={labelId} className="flex flex-wrap items-center gap-3">
        {amounts.map((amount) => (
          <Chip
            key={amount}
            size="md"
            selected={amount === selectedAmount}
            aria-label={`Set investment amount to ${formatCurrency(amount)}`}
            onClick={() => onSelect(amount)}
          >
            {formatCompactCurrency(amount)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
