'use client';

import { Check, CircleAlert, Pencil } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

import type { ApplicationFieldSource, ResolvedApplicationField } from '../types/application';

/**
 * One field of a bank's application, rendered from its schema.
 *
 * ## Prefilled is not read-only — and getting that wrong was a real bug
 *
 * This component used to render an **input only while the field was
 * outstanding**, and static text once it had a value. Since typing one
 * character gives a field a value, the input was replaced by a `<span>` on the
 * first keystroke: the customer could type exactly one character into the AU
 * nominee address and then had no field left to type into. Editing one value
 * appeared to lock the next.
 *
 * A customer field is now **always an input**. The tick means *"we already knew
 * this"*, never *"you cannot change it"* — and an edit simply becomes the
 * application's value.
 *
 * ## Three kinds of field, and only one of them is a question
 *
 * | Kind | Treatment |
 * |---|---|
 * | Customer (identity, nominee, funding, manual) | An editable input, prefilled where known |
 * | Booking-managed (amount, tenure, rate) | Stated, with a way back to Investment Details |
 * | Bank-only | Named, marked "Completed by the bank", never an input |
 *
 * Booking-managed values are deliberately not editable *here*. They were chosen
 * on Investment Details and everything downstream — the returns strip, the
 * summary rail, Review — is derived from them. A second amount field inside the
 * bank form would be a second investment configuration, which is exactly the
 * duplicate source of truth this module exists to avoid.
 *
 * ## No institution appears in this file
 *
 * It receives a resolved field and renders it by kind, type and status. Bank
 * differences live entirely in the template.
 */

/** Values the booking owns; the application states them rather than asking. */
const BOOKING_MANAGED: readonly ApplicationFieldSource[] = ['investment', 'deposit'];

export interface ApplicationFieldControlProps {
  entry: ResolvedApplicationField;
  onChange: (value: string) => void;
  /** Takes the customer to the step that owns a booking-managed value. */
  onEditInvestment?: () => void;
}

export function ApplicationFieldControl({
  entry,
  onChange,
  onEditInvestment,
}: ApplicationFieldControlProps) {
  const { field, value, status, message, source } = entry;

  const hintId = `${field.id}-hint`;
  const errorId = `${field.id}-error`;
  const describedBy = message ? errorId : field.hint ? hintId : undefined;

  /* The bank fills this in. Named so the customer knows it is handled. */
  if (source === 'bank-only') {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-caption text-content-muted">{field.label}</span>
        <span className="text-body text-content-muted">Completed by the bank</span>
      </div>
    );
  }

  /* Chosen during booking. Stated here, changed where it belongs. */
  if (BOOKING_MANAGED.includes(source)) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-caption text-content-muted">{field.label}</span>
        <span className="text-body text-content flex flex-wrap items-center gap-2 font-semibold">
          {value ?? <span className="text-content-muted font-normal">Not set</span>}
          {value === null ? null : (
            <>
              <Check aria-hidden="true" className="text-success size-4 shrink-0" />
              <span className="sr-only">Taken from your investment details</span>
            </>
          )}
          {onEditInvestment ? (
            <button
              type="button"
              onClick={onEditInvestment}
              className="focus-ring text-content-brand inline-flex items-center gap-1 rounded-md text-xs font-medium"
            >
              <Pencil aria-hidden="true" className="size-3" />
              Change
            </button>
          ) : null}
        </span>
      </div>
    );
  }

  /*
    A customer field. Always editable, whether or not we already know it —
    which is both the correct behaviour and the fix for the typing bug.

    The tick sits in the input's suffix and is shown only for a value the
    platform supplied, so it reads as "we knew this" rather than as validation
    of whatever the customer has just typed.
  */
  const isKnownFromPlatform = source !== 'manual' && value !== null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={field.id} className="text-caption text-content-muted flex items-center gap-1">
        {field.label}
        {field.required ? null : <span className="text-content-placeholder">(optional)</span>}
      </label>

      {field.type === 'select' ? (
        <Select
          value={value ?? ''}
          options={[...(field.options ?? [])].map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          placeholder={`Choose ${field.label.toLowerCase()}`}
          aria-label={field.label}
          aria-describedby={describedBy}
          onValueChange={onChange}
        />
      ) : (
        <Input
          id={field.id}
          type={field.type === 'date' ? 'date' : 'text'}
          inputMode={field.type === 'currency' ? 'numeric' : undefined}
          prefix={field.type === 'currency' ? '₹' : undefined}
          suffix={
            isKnownFromPlatform ? (
              <>
                <Check aria-hidden="true" className="text-success size-4" />
                <span className="sr-only">We already had this</span>
              </>
            ) : undefined
          }
          autoComplete="off"
          value={value ?? ''}
          invalid={status === 'invalid'}
          aria-describedby={describedBy}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}

      {message ? (
        <p id={errorId} role="alert" className="text-caption text-error flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {message}
        </p>
      ) : field.hint ? (
        <p id={hintId} className="text-caption text-content-muted">
          {field.hint}
        </p>
      ) : null}
    </div>
  );
}
