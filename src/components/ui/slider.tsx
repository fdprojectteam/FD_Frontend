'use client';

import {
  forwardRef,
  useId,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

/**
 * Slider — the platform's single-value range control (T3.2.3).
 *
 * Purpose: any bounded numeric value a user scrubs rather than types. Booking's
 * tenure rail is the first consumer; loan terms, ladder rungs and amount ranges
 * are the obvious next ones. Domain-agnostic by construction — it knows about
 * numbers and labels, never about deposits.
 *
 * **Why it is a platform primitive.** The rule in CLAUDE.md is `Button`, not
 * `MarketplaceButton`. A `TenureSlider` would be the same mistake one level up.
 *
 * ## Built on `input[type=range]`, deliberately
 *
 * Adding a slider dependency, or rebuilding one from a div and pointer events,
 * both cost more than they return. The native element already provides:
 *
 * - Arrow keys, Home/End and Page Up/Down, with the platform's own step logic
 * - `role="slider"` with `aria-valuenow` / `valuemin` / `valuemax` maintained
 *   by the browser, so they cannot drift from the rendered value
 * - Correct behaviour under assistive technology, touch, and pointer capture
 * - Form participation, so it submits and resets like any other field
 *
 * What it does *not* give is a styled track, so that is all this component adds.
 * `aria-valuetext` is exposed as `valueText` because "24" and "24 Months" are
 * different announcements, and only the consumer knows the unit.
 *
 * ## Presentation
 *
 * The filled portion is drawn with a background gradient sized from the current
 * value rather than with a second element, so there is nothing to keep in sync
 * and nothing that can lag the thumb. Track and thumb use the same tokens as
 * every other control; no colour or radius is hardcoded.
 *
 * Motion is limited to the thumb's hover and focus transitions and honours
 * `prefers-reduced-motion` through the global rule in `globals.css` — the track
 * fill itself is never animated, because a value that slides into place after
 * the number has changed reads as lag on a financial control.
 *
 * The thumb is 20px with a 44px hit area from the input's own height below
 * `md`, satisfying the standing touch-target rule (UX 1-C1).
 */
export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue'
> {
  value: number;
  min: number;
  max: number;
  step?: number;
  /**
   * Announced instead of the raw number — e.g. "24 Months".
   * Maps to `aria-valuetext`; omit only when the number is self-describing.
   */
  valueText?: string;
  /**
   * Visible label. Required: a slider without one is a control whose purpose is
   * conveyed by position alone.
   */
  label: ReactNode;
  /** Renders the label to assistive technology only. */
  labelHidden?: boolean;
  /** Optional caption under the track — e.g. the current value in brand tone. */
  caption?: ReactNode;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      min,
      max,
      step = 1,
      valueText,
      label,
      labelHidden = false,
      caption,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? `${generatedId}-slider`;

    /*
      Guarded against a zero-width domain: `min === max` is a legitimate state
      for a product offering exactly one tenure, and it must not divide by zero.
    */
    const span = max - min;
    const ratio = span > 0 ? (value - min) / span : 0;
    const percent = Math.min(Math.max(ratio, 0), 1) * 100;

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <label
          htmlFor={inputId}
          className={cn('text-caption text-content-muted font-medium', labelHidden && 'sr-only')}
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-valuetext={valueText}
          className={cn(
            'focus-ring ds-slider h-11 w-full cursor-pointer appearance-none bg-transparent md:h-10',
            disabled && 'cursor-not-allowed opacity-70',
          )}
          /*
            A custom property, not an arbitrary class: the fill is a runtime
            percentage, and the same mechanism `animate-expand-down` already
            uses for `--ds-expand-height`. The cast is needed because
            `CSSProperties` does not index custom properties.
          */
          style={{ '--ds-slider-fill': `${percent}%` } as CSSProperties}
          {...props}
        />

        {caption ? (
          <p className="text-caption text-content-brand text-center font-semibold tabular-nums">
            {caption}
          </p>
        ) : null}
      </div>
    );
  },
);
Slider.displayName = 'Slider';
