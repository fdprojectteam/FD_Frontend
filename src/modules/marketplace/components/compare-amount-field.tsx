import type { Ref } from 'react';

import { Input } from '@/components/ui/input';

import { PreferenceField } from './preference-field';

/**
 * CompareAmountField — the Deposit Amount preference (client change request,
 * 2026-08-02).
 *
 * **It owns nothing.** The value, the error and the change handler all arrive
 * as props; `CompareScreen` holds the state, validates, and decides what a valid
 * amount means (I3, the same split as every other section on this route).
 *
 * **What it is now one of.** It renders through `PreferenceField`, the shell
 * every Investment Preference shares, rather than laying out its own label and
 * error. That is what makes Tenure or Interest Payout a new file next to this
 * one instead of a copied block — and what stops the fourth preference shipping
 * with a label bound to nothing.
 *
 * **What this changes.** Everything derived from the deposit: the Interest Rate
 * (the applicable slab is resolved from the amount), Interest Earned, Maturity
 * Value, and with them the best-value highlight, since the winner is computed
 * from the same figures. All of it is derived by `ProductService` — this field
 * reports a keystroke and nothing more.
 *
 * **The amount is deliberately not in the URL.** `/compare`'s approved parameter
 * set is closed at one key, and the Product Details calculator already keeps its
 * amount local (decision D3). A shared link therefore carries the *selection*,
 * not the visitor's deposit — which is also the more sensible default for a
 * figure someone types about their own money.
 */
export interface CompareAmountFieldProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  /**
   * Enter — the keyboard equivalent of the section's apply action (Comparison
   * Experience Refinement, 2026-08-02).
   *
   * Named for the *gesture*, not for what the screen does with it. The field
   * reports that the user pressed Enter in it; whether that applies a
   * comparison, a filter, or nothing at all is the caller's business, exactly as
   * `onChange` reports a keystroke without knowing it re-prices four banks.
   */
  onSubmit?: () => void;
  /** Escape — discard the edit. The caller decides what "the last value" was. */
  onRevert?: () => void;
  /**
   * Exposes the control so the caller can restore focus to it.
   *
   * Needed because the apply action *leaves* once it has been used, and focus
   * would otherwise fall to `<body>` — a keyboard user would finish applying and
   * find their next Tab starting from the top of the page. Handing the ref
   * upward keeps the decision with the screen that owns the action; the field
   * still decides nothing.
   */
  inputRef?: Ref<HTMLInputElement>;
}

export function CompareAmountField({
  value,
  error,
  onChange,
  onSubmit,
  onRevert,
  inputRef,
}: CompareAmountFieldProps) {
  return (
    <PreferenceField id="compare-amount" label="Deposit Amount" error={error}>
      {({ id, describedBy }) => (
        <Input
          ref={inputRef}
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          /*
            `preventDefault` on both: Enter inside a form would submit it, and
            Escape in some browsers reverts the input to its last committed
            value — which would fight the caller's own revert.
          */
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit?.();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onRevert?.();
            }
          }}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="w-full tabular-nums"
        />
      )}
    </PreferenceField>
  );
}
