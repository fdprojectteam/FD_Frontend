'use client';

import { ArrowRight } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  /** `undefined` when the customer declines to set one. */
  onSubmit: (targetAmount: number | undefined) => void;
}

/** Digits only — the field is money, and a stray character is a silent NaN later. */
function toDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

export function TargetStep({ hint, initialValue, onSubmit }: TargetStepProps) {
  const fieldId = useId();
  const hintId = useId();
  const [digits, setDigits] = useState(initialValue ? String(initialValue) : '');

  const amount = digits === '' ? 0 : Number(digits);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(amount > 0 ? amount : undefined);
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-h2 text-content">
          Is there an amount you&apos;re aiming for?
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
        /*
          Grouped as the customer types — Indian grouping, through the platform
          formatter — while the state stays digits. Two representations of one
          number, and only one of them is ever parsed.
        */
        value={digits === '' ? '' : new Intl.NumberFormat('en-IN').format(amount)}
        onChange={(event) => {
          setDigits(toDigits(event.target.value));
        }}
      />

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
            onSubmit(undefined);
          }}
        >
          Skip this
        </Button>
      </div>
    </form>
  );
}
