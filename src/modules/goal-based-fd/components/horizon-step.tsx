'use client';

import { CalendarClock, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { HORIZON_PRESETS } from '../constants/presentation';

/**
 * State 5 — "How long would you like to invest?"
 *
 * This is an explicit FD-term choice. It is not an emergency-liquidity default:
 * the engine must price the selected term or explain why the catalogue cannot.
 */

export interface HorizonStepProps {
  value?: number;
  hint: string;
  onChange: (horizonMonths: number) => void;
}

export function HorizonStep({ value, hint, onChange }: HorizonStepProps) {
  const [focused, setFocused] = useState<number | null>(null);

  const selectedPreset = HORIZON_PRESETS.find((preset) => preset.months === value);

  return (
    <fieldset className="flex flex-col gap-7">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Investment timeline
        </span>

        <legend className="text-h2 text-content">How long would you like to invest?</legend>

        <p className="text-body-lg text-content-muted max-w-2xl">{hint}</p>
      </div>

      {/* Main timeline card */}
      <div className="border-border-default bg-surface-card relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
        {/* Decorative background */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-purple-300/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5">
          {/* Card heading */}
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-surface-brand-subtle text-content-brand flex size-10 shrink-0 items-center justify-center rounded-xl"
            >
              <CalendarClock className="size-5" />
            </span>

            <div>
              <p className="text-content text-sm font-semibold">Your investment timeline</p>

              <p className="text-content-muted text-xs">Choose the Fixed Deposit term you want</p>
            </div>
          </div>

          {/* Timeline options */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {HORIZON_PRESETS.map((preset) => {
              const selected = value === preset.months;
              const active = selected || focused === preset.months;

              return (
                <button
                  key={preset.months}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(preset.months);
                  }}
                  onFocus={() => {
                    setFocused(preset.months);
                  }}
                  onBlur={() => {
                    setFocused(null);
                  }}
                  className={cn(
                    `focus-ring group relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-4 text-center transition-all duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md`,
                    active
                      ? `border-border-primary bg-surface-brand-subtle shadow-sm`
                      : `border-border-default bg-surface-card hover:border-border-primary`,
                  )}
                >
                  {/* Selected check */}
                  {selected ? (
                    <span
                      aria-hidden="true"
                      className="bg-surface-brand text-content-on-brand absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full"
                    >
                      <Check className="size-3" />
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      'text-body font-semibold transition-colors',
                      active ? 'text-content-brand' : 'text-content',
                    )}
                  >
                    {preset.label}
                  </span>

                  <span className="text-caption text-content-muted">{preset.months} months</span>
                </button>
              );
            })}
          </div>

          {/* Selection acknowledgement */}
          {selectedPreset ? (
            <div
              key={selectedPreset.months}
              className="motion-safe:animate-reveal bg-surface-subtle flex items-center gap-2 rounded-xl px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="bg-surface-brand text-content-on-brand flex size-6 shrink-0 items-center justify-center rounded-full"
              >
                <Check className="size-3.5" />
              </span>

              <p className="text-content text-sm">
                You selected an FD term of{' '}
                <span className="font-semibold">{selectedPreset.label}</span>.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI / recommendation explanation */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"
        >
          <Sparkles className="size-4" />
        </span>

        <div>
          <p className="text-content text-sm font-semibold">How this helps your recommendation</p>

          <p className="text-content-muted mt-1 text-sm leading-5">
            We&apos;ll prioritize FD tenures that fit your timeline, then compare available rates,
            minimum deposits and other relevant product conditions.
          </p>
        </div>
      </div>

      {/* Current selection summary */}
      {selectedPreset ? (
        <div className="border-border-default bg-surface-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-content-muted text-xs font-medium tracking-wide uppercase">
              Selected FD term
            </p>

            <p className="text-body text-content mt-1 font-semibold">{selectedPreset.label}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-content-muted text-xs">We&apos;ll use this to</p>

            <p className="text-content-brand text-sm font-medium">Find FDs at this term</p>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
