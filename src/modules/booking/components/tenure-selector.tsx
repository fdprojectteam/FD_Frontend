'use client';

import { useId, useRef, type KeyboardEvent } from 'react';

import { cn } from '@/lib/utils';
import type { TenureRate } from '@/types/finance';
import { formatTenure } from '@/utils/format';

/**
 * TenureSelector — how long the money is committed for (T3.2.10).
 *
 * **Presentation-only** (invariant I3). It renders the tenures it is given and
 * reports which was pressed. Which tenures exist is `selectableTenures`; what
 * each one earns is `resolveTenureRate`; whether the choice is valid is
 * `validateTenure`. None of those decisions is repeated here.
 *
 * ## A radiogroup, not a row of toggles
 *
 * Tenure is **one** value chosen from a set, so the group carries
 * `role="radiogroup"` and each chip `role="radio"` with `aria-checked`. The
 * alternative — the `aria-pressed` toggle `Chip` exposes natively — would
 * announce five independent on/off buttons and let a screen-reader user believe
 * two tenures could be selected at once.
 *
 * That is also why this composes the chip *styling* rather than the `Chip`
 * component: `Chip` hard-codes `aria-pressed`, and a control cannot be both a
 * toggle and a radio. The visual treatment is identical — same tokens, same
 * sizes, same selected state — so the approved design is unchanged while the
 * semantics are correct.
 *
 * Roving tabindex: the selected chip is the group's single tab stop and arrow
 * keys move between options, which is the expected behaviour for a radiogroup
 * and what `RadioCardGroup` gets from native radios. Here the markup is
 * buttons, so the behaviour is implemented explicitly.
 *
 * ## What is deliberately absent
 *
 * **No slider.** The approved artwork draws one, but a slider needs a decision
 * about its domain against a sparse rate card that Design has not made, and with
 * a single published tenure it is a control that cannot move.
 *
 * **No Custom tenure.** `resolveTenureRate` is an exact match against the rate
 * card and must not invent a rate, so a free-entry month field can only succeed
 * when the user happens to type a published value.
 *
 * **No invented tenures.** The chips are exactly the product's priced rows. With
 * today's fixture that is one chip; supplying more rows renders more chips with
 * no change to this file.
 */
export interface TenureSelectorProps {
  /** The product's priced tenures, ascending — see `selectableTenures`. */
  tenures: TenureRate[];
  value: number | null;
  onChange: (tenureMonths: number) => void;
  /** Names the group for assistive technology when the heading is elsewhere. */
  label?: string;
  /** The screen already renders the approved heading, so the label is hidden by default. */
  labelHidden?: boolean;
}

export function TenureSelector({
  tenures,
  value,
  onChange,
  label = 'Tenure',
  labelHidden = true,
}: TenureSelectorProps) {
  const labelId = useId();

  /**
   * The rendered radios, so an arrow key can move **focus** as well as
   * selection.
   *
   * Without this, selection moved and focus did not: the newly selected chip
   * took `tabIndex={0}` while the browser's focus — and the visible focus ring —
   * stayed on the chip the user had just left. A radiogroup is required to move
   * both together (WAI-ARIA APG), and a focus ring pointing at one option while
   * another is checked is exactly the confusion the pattern exists to prevent.
   *
   * A `Map` keyed by tenure rather than an array: the entries are registered by
   * a ref callback whose identity is the tenure, so a rate card gaining or
   * losing rows cannot leave a stale index pointing at the wrong chip.
   */
  const radios = useRef(new Map<number, HTMLButtonElement>());

  /*
    A product pricing nothing renders nothing rather than an empty group: a
    labelled radiogroup with no options in it is a control that cannot be used.

    Note that **nothing on this screen currently renders a tenure error**.
    `validateTenure` produces the copy for this case ("This FD has no tenures
    available right now"), but the screen wires no tenure message, so the region
    would show its heading and nothing else. Unreachable with the current data —
    a seeded default is always valid — and recorded here rather than implied
    away.
  */
  if (tenures.length === 0) return null;

  const selectedIndex = tenures.findIndex((tenure) => tenure.tenureMonths === value);

  /*
    Arrow keys move the selection, wrapping at both ends — the behaviour a
    radiogroup is expected to have and the reason this is not a row of
    independent buttons. Home and End jump to the shortest and longest tenure.
  */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = tenures.length - 1;
    const current = selectedIndex === -1 ? 0 : selectedIndex;

    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;

    if (next === null) return;

    event.preventDefault();

    const target = tenures[next]!.tenureMonths;

    /*
      Focus first, then report the change.

      The element already exists — an arrow press moves between rendered radios,
      it does not create one — so focusing synchronously is safe and avoids an
      effect that would fire on every selection, including clicks, and steal
      focus back from wherever the user had moved on to.
    */
    radios.current.get(target)?.focus();
    onChange(target);
  };

  return (
    <div className="flex flex-col gap-2">
      <span
        id={labelId}
        className={cn('text-caption text-content-muted font-medium', labelHidden && 'sr-only')}
      >
        {label}
      </span>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
        className="flex flex-wrap items-center gap-3"
      >
        {tenures.map((tenure, index) => {
          const selected = tenure.tenureMonths === value;

          /*
            One tab stop for the whole group: the selected chip, or the first
            when nothing is selected yet. Everything else is reachable by arrow
            key, never by Tab.
          */
          const tabbable = selected || (selectedIndex === -1 && index === 0);

          return (
            <button
              key={tenure.tenureMonths}
              ref={(node) => {
                if (node) radios.current.set(tenure.tenureMonths, node);
                else radios.current.delete(tenure.tenureMonths);
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={tabbable ? 0 : -1}
              data-tenure-months={tenure.tenureMonths}
              onClick={() => onChange(tenure.tenureMonths)}
              /*
                The approved chip treatment, token for token — `Chip`'s own
                classes, reproduced because `Chip` is a toggle and this is a
                radio. Nothing here is a new visual decision.
              */
              className={cn(
                'focus-ring duration-fast inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full border px-4 font-medium whitespace-nowrap transition ease-out select-none md:h-10',
                'text-body',
                selected
                  ? 'border-border-primary bg-surface-brand-subtle text-content-brand'
                  : 'border-border-default bg-surface-card text-content-muted hover:bg-surface-muted',
              )}
            >
              {/*
                The platform formatter, so no two products spell the same tenure
                differently. An optional bank-authored `label` on `TenureRate`
                was proposed in the architect review but is **not** implemented
                here — it was not in the approved scope for this pass, and this
                is the one line that would consume it.
              */}
              {formatTenure(tenure.tenureMonths)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
