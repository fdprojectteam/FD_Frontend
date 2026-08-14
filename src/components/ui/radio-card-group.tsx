'use client';

import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * RadioCardGroup — single choice from a small set of described options (T3.2.3).
 *
 * Purpose: the pattern where each option needs an icon, a title and a line of
 * explanation, and a plain radio list would not carry enough. Booking's interest
 * payout options are the first consumer; payment method, plan selection and
 * renewal preference are the obvious next ones. Domain-agnostic — it takes
 * `{ id, title, description, icon }` and knows nothing about deposits.
 *
 * A platform primitive rather than a Booking component, for the reason in
 * CLAUDE.md: `Button`, not `MarketplaceButton`.
 *
 * ## Native radios, restyled
 *
 * A `<fieldset>` with a `<legend>` and real `input[type=radio]` elements, each
 * wrapped in its `<label>`. That gives, at no cost:
 *
 * - **Roving focus** — the group is one tab stop, arrows move within it. This is
 *   the behaviour a div-based implementation most often gets wrong
 * - Correct `radiogroup` semantics, with the legend as the group's accessible
 *   name — no `aria-*` attributes required anywhere in this file
 * - Click-on-label, form participation, reset and submit
 *
 * The radio itself is visually replaced but never hidden from assistive
 * technology: it keeps its box and receives focus, and the focus ring is drawn
 * on the card through `:focus-visible` on the input, so keyboard users see the
 * whole option highlighted rather than a 16px circle.
 *
 * ## Layout
 *
 * Options share a row from `md` and stack below it, each card full-width, which
 * keeps the touch target well past the 44px rule. Selection is signalled by
 * border, fill *and* a tick — never by colour alone (Document 14).
 */
export interface RadioCardOption<TId extends string = string> {
  id: TId;
  title: string;
  description?: string;
  /** Decorative — the title carries the meaning. */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface RadioCardGroupProps<TId extends string = string> {
  /** Names the group. Rendered as the fieldset's legend. */
  label: ReactNode;
  /** Hides the legend visually; it remains the group's accessible name. */
  labelHidden?: boolean;
  options: readonly RadioCardOption<TId>[];
  value: TId | null;
  onChange: (value: TId) => void;
  /** Shared radio `name`. Defaults to a generated, stable id. */
  name?: string;
  /** Trailing content beside the legend — e.g. an info affordance. */
  labelAdornment?: ReactNode;
  className?: string;
}

export function RadioCardGroup<TId extends string = string>({
  label,
  labelHidden = false,
  options,
  value,
  onChange,
  name,
  labelAdornment,
  className,
}: RadioCardGroupProps<TId>) {
  const generatedId = useId();
  const groupName = name ?? `${generatedId}-radio-card-group`;

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-3', className)}>
      <legend
        className={cn(
          'text-body-lg text-content mb-3 flex items-center gap-2 font-semibold',
          labelHidden && 'sr-only',
        )}
      >
        {label}
        {labelAdornment}
      </legend>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map((option) => {
          const selected = option.id === value;

          return (
            <label
              key={option.id}
              data-selected={selected}
              className={cn(
                'rounded-card flex cursor-pointer items-start gap-3 border p-4 transition',
                'duration-fast ease-out',
                /*
                  The ring is drawn here from the input's focus state, so the
                  whole card is the visible focus target rather than a 20px
                  circle inside it. Same mechanism and same token shorthand
                  `Input` already uses for `focus-within` — not an arbitrary
                  value, which components are not permitted.
                */
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                'has-[:focus-visible]:outline-(--ds-focus-ring-color)',
                selected
                  ? 'border-border-primary bg-surface-brand-subtle'
                  : 'border-border-default bg-surface-card hover:bg-surface-muted',
                option.disabled && 'pointer-events-none opacity-70',
              )}
            >
              {/*
                The native control. `appearance-none` removes the platform
                widget; `sr-only` would remove it from the layout and take the
                focus ring with it, so it is sized and drawn instead.
              */}
              <span className="relative flex size-5 shrink-0 items-center justify-center">
                <input
                  type="radio"
                  name={groupName}
                  value={option.id}
                  checked={selected}
                  disabled={option.disabled}
                  onChange={() => onChange(option.id)}
                  className={cn(
                    'size-5 cursor-pointer appearance-none rounded-full border transition',
                    'duration-fast ease-out',
                    selected
                      ? 'border-border-primary bg-surface-brand'
                      : 'border-border-strong bg-surface-card',
                  )}
                />
                {selected ? (
                  <Check
                    aria-hidden="true"
                    className="text-content-on-brand pointer-events-none absolute size-3"
                  />
                ) : null}
              </span>

              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-2">
                  {option.icon ? (
                    <span
                      aria-hidden="true"
                      className="bg-surface-brand-subtle text-content-brand flex size-8 shrink-0 items-center justify-center rounded-md"
                    >
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="text-body text-content font-semibold">{option.title}</span>
                </span>

                {option.description ? (
                  <span className="text-caption text-content-muted">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
