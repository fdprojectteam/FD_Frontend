'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * "Are you investing as a senior citizen?"
 *
 * ## Why the platform asks
 *
 * Several deposits publish a higher rate for senior citizens, and the engine
 * cannot apply a benefit it was never told the depositor qualifies for. Asking
 * is the difference between R-ELIG-001 running and being reported as a rule that
 * could not be evaluated.
 *
 * ## Why it is two buttons and not a checkbox
 *
 * A checkbox has one explicit state and one absent one, so "no" and "not
 * answered" look identical — and the flow needs to distinguish them to know
 * whether the question has been dealt with. Two buttons make both answers
 * deliberate.
 *
 * ## What it does not collect
 *
 * A date of birth. The rate card the platform prices against publishes one
 * senior-citizen rate, so the only thing any rule reads is whether the benefit
 * applies. Collecting an age would gather personal data no rule consumes.
 *
 * Eligibility is confirmed by the bank at booking; nothing here is a
 * determination of it.
 */
export interface InvestorStepProps {
  value?: boolean;
  /** One line saying why the question is being asked. */
  hint: string;
  onChange: (isSeniorCitizen: boolean) => void;
}

const OPTIONS: readonly { value: boolean; label: string; description: string }[] = [
  {
    value: true,
    label: 'Yes',
    description: 'Apply senior-citizen rates where a deposit publishes them',
  },
  { value: false, label: 'No', description: 'Show standard published rates' },
];

export function InvestorStep({ value, hint, onChange }: InvestorStepProps) {
  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="flex flex-col gap-1">
        <span className="text-h2 text-content">Are you investing as a senior citizen?</span>
        <span className="text-body text-content-muted font-normal">{hint}</span>
      </legend>

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onChange(option.value);
              }}
              className={cn(
                'focus-ring rounded-card duration-fast relative flex flex-col items-start gap-1 border p-5 text-left transition ease-out',
                selected
                  ? 'border-border-primary bg-surface-brand-subtle'
                  : 'border-border-default bg-surface-card hover:border-border-primary',
              )}
            >
              {selected ? (
                <span
                  aria-hidden="true"
                  className="bg-surface-brand text-content-on-brand absolute top-4 right-4 inline-flex size-5 items-center justify-center rounded-full"
                >
                  <Check className="size-3" />
                </span>
              ) : null}

              <span className="text-h3 text-content">{option.label}</span>
              <span className="text-body text-content-muted">{option.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
