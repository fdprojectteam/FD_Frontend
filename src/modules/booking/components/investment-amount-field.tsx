'use client';

import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { formatAmount, formatCurrency } from '@/utils/format';

/**
 * InvestmentAmountField — the primary input of the Investment Details screen
 * (T3.2.8).
 *
 * **Presentation-only** (invariant I3). It renders a value, reports what was
 * typed, and shows an error it was handed. It validates nothing: `validateAmount`
 * owns BR-INV-001/002/003 and produces the message, so the rule and its wording
 * live in one pure function rather than in a component that must be rendered to
 * be tested.
 *
 * ## Digits in, grouped digits out
 *
 * The field displays `5,00,000` and reports `500000`. Grouping as the user types
 * is what makes a seven-digit figure legible — the difference between ₹50,00,000
 * and ₹5,00,000 is one character in an ungrouped string and a factor of ten in
 * the deposit.
 *
 * Non-digits are stripped on the way in rather than rejected, so a pasted
 * "₹5,00,000" becomes 500000 instead of an error. A user pasting a formatted
 * figure has done nothing wrong.
 *
 * ## Errors appear after the field is left, not while it is being typed
 *
 * FR-CONF-001 requires validation immediately after a change, and it is: the
 * value is validated on every keystroke, the summary and returns update from it,
 * and Continue is gated on it. What is deferred is only the *message*.
 *
 * Typing "5" on the way to "5,00,000" would otherwise be met with *"Increase
 * your investment by ₹4,99,995"* — technically true, and exactly the kind of
 * thing Founder Vision §4's senior-usability standard is asking us not to do.
 * The message appears once the field has been left, and from then on it updates
 * live, which is the point at which it is help rather than interruption.
 *
 * ## Accessibility
 *
 * `inputMode="numeric"` for a numeric keypad on mobile, but `type="text"` — a
 * `type="number"` field discards the grouping separators, exposes spinners
 * nobody wants on a deposit, and scrolls the value on a trackpad.
 *
 * The bounds are permanently visible and referenced by `aria-describedby`, so a
 * screen-reader user hears the limits with the field rather than having to hunt
 * for them. When an error is showing it is announced through `role="alert"` and
 * joins the same description.
 */
export interface InvestmentAmountFieldProps {
  value: number | null;
  /** Reports the parsed digits, or `null` when the field is emptied. */
  onChange: (amount: number | null) => void;
  onBlur?: () => void;
  minInvestment: number;
  maxInvestment: number;
  /**
   * Whether `maxInvestment` is a published bank limit.
   *
   * Absent or `true` means published — the approved deposit's behaviour, which
   * is unchanged. `false` states the bound rather than printing a figure the
   * bank has not agreed to, while still enforcing it as a guard rail.
   */
  maxInvestmentPublished?: boolean;
  /** Supplied by the screen from `validateAmount`; `null` when valid or untouched. */
  error?: string | null;
}

export function InvestmentAmountField({
  value,
  onChange,
  onBlur,
  minInvestment,
  maxInvestment,
  maxInvestmentPublished = true,
  error = null,
}: InvestmentAmountFieldProps) {
  const fieldId = useId();
  const inputId = `${fieldId}-amount`;
  const boundsId = `${fieldId}-bounds`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="sr-only">
        Investment amount
      </label>

      <Input
        id={inputId}
        size="lg"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        prefix="₹"
        placeholder={formatAmount(minInvestment)}
        value={value === null ? '' : formatAmount(value)}
        invalid={error !== null}
        aria-describedby={error ? `${boundsId} ${errorId}` : boundsId}
        onBlur={onBlur}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          onChange(digits === '' ? null : Number(digits));
        }}
      />

      {/*
        Minimum left, maximum right — the approved layout. Stacked below `md`
        so neither is truncated on a narrow screen; a bound the user cannot
        read is a bound they will breach.
      */}
      <p
        id={boundsId}
        className="text-caption text-content-muted flex flex-col gap-1 md:flex-row md:justify-between"
      >
        <span>Minimum: {formatCurrency(minInvestment)}</span>
        <span>
          {maxInvestmentPublished
            ? `Maximum: ${formatCurrency(maxInvestment)}`
            : 'Maximum: confirmed with the bank'}
        </span>
      </p>

      {error ? (
        <p id={errorId} role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
