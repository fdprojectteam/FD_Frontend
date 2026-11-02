'use client';

import { ArrowRight } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  currencyCaretPosition,
  formatCurrencyDigits,
  normaliseCurrencyDigits,
} from '../utils/currency-input';
/**
 * The last question — "Is there an amount you're aiming for?"
 *
 * ## Why it is optional, and why declining is a button rather than a blank
 *
 * `04-rule-engine.md` §12 runs the target rules **only when a target exists**.
 * Absent means the rules do not run; it does not mean a target of zero. A
 * customer who has no figure in mind must therefore be able to say so
 * explicitly, and `Skip this` is that answer — it advances the flow without
 * putting a number into the engine that the customer never chose.
 *
 * Leaving the field blank and pressing Continue does the same thing, so the two
 * paths agree.
 *
 * ## No calculation happens here
 *
 * The field collects a figure and nothing else. Whether it is reachable, by how
 * much it is missed and what might close the gap are all decided by
 * `assessTarget` and `TARGET_ADJUSTMENTS` in the engine. This screen does not
 * compare, does not project and does not advise.
 */
export interface TargetStepProps {
  /** One line saying why the question is being asked. */
  hint: string;
  initialValue?: number;
  /** The emergency-only system target. It is still completely editable. */
  suggestedValue?: number;
  initialSource?: 'suggested' | 'manual' | 'none';
  /** `undefined` when the customer declines to set one. */
  onSubmit: (targetAmount: number | undefined, source: 'suggested' | 'manual' | 'none') => void;
}

export function TargetStep({
  hint,
  initialValue,
  suggestedValue,
  initialSource,
  onSubmit,
}: TargetStepProps) {
  const fieldId = useId();
  const hintId = useId();
  const [digits, setDigits] = useState(initialValue ? String(initialValue) : '');
  const [source, setSource] = useState<'suggested' | 'manual' | 'none'>(
    initialSource ?? (suggestedValue === undefined ? 'none' : 'suggested'),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const amount = digits === '' ? 0 : Number(digits);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(amount > 0 ? amount : undefined, amount > 0 ? source : 'none');
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-h2 text-content">
          Is there a maturity amount you&apos;re aiming for?
        </label>
        <p id={hintId} className="text-body text-content-muted">
          {hint}
        </p>
      </div>

      <Input
        id={fieldId}
        aria-describedby={hintId}
        inputMode="numeric"
        autoComplete="off"
        placeholder="27,00,000"
        prefix="₹"
        className="max-w-sm"
        ref={inputRef}
        value={formatCurrencyDigits(digits)}
        onChange={(event) => {
          const caretDigits = normaliseCurrencyDigits(
            event.target.value.slice(0, event.target.selectionStart ?? 0),
          ).length;
          const nextDigits = normaliseCurrencyDigits(event.target.value);
          setDigits(nextDigits);
          setSource('manual');
          queueMicrotask(() => {
            const input = inputRef.current;
            if (!input) return;
            const nextDisplay = formatCurrencyDigits(nextDigits);
            const caret = currencyCaretPosition(nextDisplay, caretDigits);
            input.setSelectionRange(caret, caret);
          });
        }}
      />

      {suggestedValue !== undefined ? (
        <div className="text-caption text-content-muted flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Suggested emergency target: ₹{formatCurrencyDigits(String(suggestedValue))}.</span>
          <span>This is a planning assumption, not a promised return.</span>
          {source === 'manual' ? (
            <button
              type="button"
              className="focus-ring text-content-brand rounded-md font-medium"
              onClick={() => {
                setDigits(String(suggestedValue));
                setSource('suggested');
              }}
            >
              Reset to suggested target
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" className="w-fit">
          {amount > 0 ? 'See my recommendation' : 'Continue'}
          <span aria-hidden="true" className="inline-flex shrink-0">
            <ArrowRight className="size-4" />
          </span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-fit"
          onClick={() => {
            onSubmit(undefined, 'none');
          }}
        >
          Skip this
        </Button>
      </div>
    </form>
  );
}
