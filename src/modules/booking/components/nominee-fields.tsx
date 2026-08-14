'use client';

import { Trash2 } from 'lucide-react';
import { useId } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

import { SUPPORTED_RELATIONSHIPS } from '../constants/nominee';
import type { Nominee } from '../types/nominee';
import type { NomineeField } from '../utils/nominee-schema';

/**
 * NomineeFields — one nominee's row of inputs (T3.3.3).
 *
 * **Presentation-only** (invariant I3). It renders values, reports edits, and
 * displays errors it was handed. It validates nothing: `nominee-schema.ts` owns
 * every rule and produces every message, so a rule lives in one pure function
 * rather than in a component that must be rendered to be tested.
 *
 * ## Layout, from the approved artwork
 *
 * Two columns from `md`, one below it. Full Name beside Relationship; Date of
 * Birth beside Guardian Name; Share of Proceeds alone on its own row with the
 * `%` suffix inside the field. The header carries "Nominee N", the "Primary
 * Nominee" badge on the first, and Remove on the right.
 *
 * ## Notes on two controls
 *
 * **Date of birth is a native `<input type="date">`.** It is the simplest
 * accessible option already available: real keyboard support, the platform's own
 * picker on mobile, and correct assistive-technology semantics with no
 * dependency and no custom component. `max` is set to today so the browser
 * itself discourages a future date — the schema still rejects one, because a
 * browser control is a convenience and never the rule.
 *
 * **Relationship options come from `SUPPORTED_RELATIONSHIPS`**, never from a
 * list declared here. That constant is the single source of truth and is
 * currently a marked POC assumption; replacing it changes this dropdown, the
 * validation and the error message together.
 */
export interface NomineeFieldsProps {
  nominee: Nominee;
  /** 1-based, for the "Nominee N" heading the artwork shows. */
  position: number;
  /** The artwork badges the first nominee as primary. */
  isPrimary: boolean;
  /** Hidden when only one nominee remains — there must always be one. */
  canRemove: boolean;
  onChange: (patch: Partial<Omit<Nominee, 'id'>>) => void;
  onRemove: () => void;
  /** Messages from `validateNominee`, keyed by field. Empty when untouched. */
  errors: Partial<Record<NomineeField, string>>;
}

export function NomineeFields({
  nominee,
  position,
  isPrimary,
  canRemove,
  onChange,
  onRemove,
  errors,
}: NomineeFieldsProps) {
  const fieldId = useId();
  const id = (field: string) => `${fieldId}-${field}`;
  const errorId = (field: string) => `${fieldId}-${field}-error`;

  /** Today, so the native control discourages a future date of birth. */
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section
      aria-labelledby={id('heading')}
      data-nominee-id={nominee.id}
      className="border-border-default rounded-card flex flex-col gap-4 border p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 id={id('heading')} className="text-body-lg text-content font-semibold">
            Nominee {position}
          </h3>
          {isPrimary ? <Badge size="sm">Primary Nominee</Badge> : null}
        </div>

        {/*
          Hidden rather than disabled when only one nominee remains: a control
          that can never be used is noise, and the rule ("there is always at
          least one nominee") is already stated by the validator.
        */}
        {canRemove ? (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remove
            <span className="sr-only"> nominee {position}</span>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Field
          id={id('fullName')}
          label="Full Name (as per ID proof)"
          error={errors.fullName}
          errorId={errorId('fullName')}
        >
          <Input
            id={id('fullName')}
            value={nominee.fullName}
            invalid={Boolean(errors.fullName)}
            autoComplete="off"
            aria-describedby={errors.fullName ? errorId('fullName') : undefined}
            onChange={(event) => onChange({ fullName: event.target.value })}
          />
        </Field>

        <Field
          id={id('relationship')}
          label="Relationship with Applicant"
          error={errors.relationship}
          errorId={errorId('relationship')}
        >
          <Select
            id={id('relationship')}
            placeholder="Select relationship"
            value={nominee.relationship}
            invalid={Boolean(errors.relationship)}
            aria-describedby={errors.relationship ? errorId('relationship') : undefined}
            options={SUPPORTED_RELATIONSHIPS.map((relationship) => ({
              value: relationship,
              label: relationship,
            }))}
            onValueChange={(relationship) => onChange({ relationship })}
          />
        </Field>

        <Field
          id={id('dateOfBirth')}
          label="Date of Birth"
          error={errors.dateOfBirth}
          errorId={errorId('dateOfBirth')}
        >
          <Input
            id={id('dateOfBirth')}
            type="date"
            max={today}
            value={nominee.dateOfBirth}
            invalid={Boolean(errors.dateOfBirth)}
            aria-describedby={errors.dateOfBirth ? errorId('dateOfBirth') : undefined}
            onChange={(event) => onChange({ dateOfBirth: event.target.value })}
          />
        </Field>

        {/*
          Rendered unconditionally, exactly as the artwork draws it, with the
          condition carried in the label. No minor-age rule exists in any source
          document, and inventing one would make this field mandatory at an age
          nobody has agreed to.
        */}
        <Field
          id={id('guardianName')}
          label="Guardian Name (if nominee is minor)"
          error={errors.guardianName}
          errorId={errorId('guardianName')}
        >
          <Input
            id={id('guardianName')}
            placeholder="Enter guardian name"
            value={nominee.guardianName}
            autoComplete="off"
            aria-describedby={errors.guardianName ? errorId('guardianName') : undefined}
            onChange={(event) => onChange({ guardianName: event.target.value })}
          />
        </Field>
      </div>

      <div className="md:max-w-xs">
        <Field
          id={id('sharePercent')}
          label="Share of Proceeds"
          error={errors.sharePercent}
          errorId={errorId('sharePercent')}
        >
          <Input
            id={id('sharePercent')}
            inputMode="numeric"
            suffix="%"
            value={nominee.sharePercent}
            invalid={Boolean(errors.sharePercent)}
            aria-describedby={errors.sharePercent ? errorId('sharePercent') : undefined}
            /*
              Digits only, as the amount field does. A share is a whole
              percentage on the approved screen, and stripping here means the
              schema never sees a value the user could not have meant.
            */
            onChange={(event) => onChange({ sharePercent: event.target.value.replace(/\D/g, '') })}
          />
        </Field>
      </div>
    </section>
  );
}

/**
 * Label, control, error — the trio every field on this screen repeats.
 *
 * Local to this file because it means nothing outside it, and extracting it any
 * further would be a shared component with one consumer.
 */
function Field({
  id,
  label,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-caption text-content-muted font-medium">
        {label}
      </label>

      {children}

      {error ? (
        <p id={errorId} role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
