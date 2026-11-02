'use client';

import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils';

import {
  currencyCaretPosition,
  formatCurrencyDigits,
  normaliseCurrencyDigits,
} from '../utils/currency-input';

const QUICK_AMOUNTS = [
  {
    value: 100_000,
    label: '₹1 lakh',
    description: 'Starter amount',
  },
  {
    value: 500_000,
    label: '₹5 lakh',
    description: 'Popular choice',
  },
  {
    value: 1_000_000,
    label: '₹10 lakh',
    description: 'Larger investment',
  },
] as const;

export interface AmountStepProps {
  /** One line saying why the question is being asked. */
  hint: string;
  /** The smallest minimum investment across the loaded catalogue, when known. */
  lowestMinimum?: number;
  initialValue?: number;
  onSubmit: (principal: number) => void;
}

export function AmountStep({ hint, lowestMinimum, initialValue, onSubmit }: AmountStepProps) {
  const fieldId = useId();
  const hintId = useId();
  const [digits, setDigits] = useState(initialValue ? String(initialValue) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  const amount = digits === '' ? 0 : Number(digits);

  const canContinue = amount > 0;

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={(event) => {
        event.preventDefault();

        if (canContinue) {
          onSubmit(amount);
        }
      }}
    >
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Investment amount
        </span>

        <label htmlFor={fieldId} className="text-h2 text-content">
          How much are you planning to invest?
        </label>

        <p id={hintId} className="text-body-lg text-content-muted max-w-2xl">
          {hint}
        </p>
      </div>

      {/* Amount input */}
      <div className="border-border-default bg-surface-card focus-within:border-border-primary relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 focus-within:shadow-lg sm:p-6">
        {/* Background glow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-purple-300/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-content text-sm font-semibold">Investment amount</span>

            {lowestMinimum !== undefined ? (
              <span className="text-content-muted text-xs">
                From {formatCurrency(lowestMinimum)}
              </span>
            ) : null}
          </div>

          <Input
            id={fieldId}
            aria-describedby={hintId}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1,00,000"
            prefix="₹"
            className="h-16 max-w-full rounded-2xl text-2xl font-semibold sm:text-3xl"
            ref={inputRef}
            value={formatCurrencyDigits(digits)}
            onChange={(event) => {
              const caretDigits = normaliseCurrencyDigits(
                event.target.value.slice(0, event.target.selectionStart ?? 0),
              ).length;
              const nextDigits = normaliseCurrencyDigits(event.target.value);
              setDigits(nextDigits);
              queueMicrotask(() => {
                const input = inputRef.current;
                if (!input) return;
                const nextDisplay = formatCurrencyDigits(nextDigits);
                const caret = currencyCaretPosition(nextDisplay, caretDigits);
                input.setSelectionRange(caret, caret);
              });
            }}
          />

          <div className="text-content-muted flex items-center gap-2 text-xs">
            <span className="bg-surface-brand-subtle text-content-brand flex size-5 items-center justify-center rounded-full">
              <Check className="size-3" />
            </span>

            <span>We’ll use this amount to compare relevant FD options.</span>
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-content text-sm font-semibold">Choose a quick amount</p>

          <p className="text-content-muted mt-1 text-xs">Or enter any amount above.</p>
        </div>

        {/* `grid-cols-1` bounds the track — see the note in `planner-results.tsx`. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_AMOUNTS.map((quick) => {
            const selected = amount === quick.value;

            return (
              <button
                key={quick.value}
                type="button"
                onClick={() => {
                  setDigits(String(quick.value));
                }}
                className={`group relative flex min-h-20 flex-col items-start justify-center rounded-2xl border px-4 py-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md ${
                  selected
                    ? 'border-border-primary bg-surface-brand-subtle shadow-sm'
                    : 'border-border-default bg-surface-card hover:border-border-primary'
                } `}
              >
                {selected ? (
                  <span className="bg-surface-brand text-content-on-brand absolute top-3 right-3 flex size-5 items-center justify-center rounded-full">
                    <Check className="size-3" />
                  </span>
                ) : null}

                <span className="text-body text-content font-semibold">{quick.label}</span>

                <span className="text-content-muted mt-0.5 text-xs">{quick.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendation explanation */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"
        >
          <Sparkles className="size-4" />
        </span>

        <div>
          <p className="text-content text-sm font-semibold">Why does the amount matter?</p>

          <p className="text-content-muted mt-1 text-sm leading-5">
            Your investment amount helps us check FD minimums, compare suitable options and build a
            recommendation around your plan.
          </p>
        </div>
      </div>

      {/* Continue */}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="lg" disabled={!canContinue} className="w-full sm:w-auto">
          Continue
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </form>
  );
}
