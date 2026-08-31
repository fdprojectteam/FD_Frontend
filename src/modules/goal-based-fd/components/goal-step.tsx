'use client';

import { ArrowRight, Check, Sparkles } from 'lucide-react';

import { GoalMark } from '@/components/business';
import { cn } from '@/lib/utils';

import { GOAL_LABELS, GOAL_TYPES } from '../constants/goals';
import { GOAL_DESCRIPTIONS } from '../constants/presentation';
import type { GoalType } from '../types/goal';

/**
 * State 2 — "What are you saving for?"
 *
 * Three real `<button>`s inside a `<fieldset>`, never divs with click handlers:
 * the choice is a form control and has to behave like one for keyboard and
 * screen-reader users.
 *
 * The icon is the only ornament, and it earns its place — shield, cap and
 * sunrise let the three options be told apart at a glance, before any label is
 * read. There is deliberately nothing else on the card: a rate or a count here
 * would invite the customer to optimise the *question* instead of answering it.
 */
export interface GoalStepProps {
  value?: GoalType;
  /** One line saying why the question is being asked. */
  hint: string;
  onChange: (goalType: GoalType) => void;
}

const GOAL_FOCUS: Record<GoalType, string[]> = {
  emergency: ['Liquidity', 'Easy access', 'Short-term fit'],
  education: ['Goal timeline', 'Maturity planning', 'Future milestone'],
  retirement: ['Long-term fit', 'Maturity planning', 'Future needs'],
};

const GOAL_AI_COPY: Record<GoalType, string> = {
  emergency:
    'We’ll prioritise FD options that balance returns with access to your money when you may need it.',
  education:
    'We’ll consider your timeline and maturity dates to help align your FD with the education milestone.',
  retirement: 'We’ll focus on longer-term options that fit the horizon you are planning for.',
};

export function GoalStep({ value, hint, onChange }: GoalStepProps) {
  return (
    <fieldset className="flex flex-col gap-7">
      {/* Heading */}
      <legend className="flex flex-col gap-2">
        <span className="text-h2 text-content">What are you saving for?</span>

        <span className="text-body-lg text-content-muted font-normal">{hint}</span>
      </legend>

      {/* Guidance */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"
        >
          <Sparkles className="size-4" />
        </span>

        <div>
          <p className="text-content text-sm font-semibold">
            Your goal helps us personalise the recommendation
          </p>

          <p className="text-content-muted mt-1 text-sm leading-5">
            We&apos;ll use your goal along with your investment amount and timeline to rank FD
            options that are more relevant to you.
          </p>
        </div>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {GOAL_TYPES.map((goalType) => {
          const selected = value === goalType;

          return (
            <button
              key={goalType}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(goalType)}
              className={cn(
                `focus-ring group relative flex min-h-[390px] flex-col overflow-hidden rounded-3xl border p-6 text-left transition-all duration-300 ease-out`,
                'motion-safe:hover:-translate-y-1',
                'motion-safe:hover:shadow-xl',
                'active:translate-y-0',

                selected
                  ? `border-border-primary bg-surface-brand-subtle shadow-lg`
                  : `border-border-default bg-surface-card hover:border-border-primary shadow-sm`,
              )}
            >
              {/* Decorative glow */}
              <span
                aria-hidden="true"
                className={cn(
                  `pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-purple-300/10 blur-3xl transition-opacity duration-300`,
                  selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              />

              {/* Selected badge */}
              {selected ? (
                <span
                  aria-hidden="true"
                  className="bg-surface-brand text-content-on-brand absolute top-5 right-5 flex size-7 items-center justify-center rounded-full shadow-sm"
                >
                  <Check className="size-4" />
                </span>
              ) : null}

              {/* Illustration */}
              <span
                aria-hidden="true"
                className={cn(
                  `relative mb-6 flex size-28 items-center justify-center rounded-3xl transition-all duration-300`,
                  'motion-safe:group-hover:scale-105',
                  selected ? 'bg-surface-brand shadow-md' : 'bg-surface-brand-subtle shadow-sm',
                )}
              >
                {/*
                  The same artwork component Home renders, so a goal looks
                  identical wherever it is chosen. It owns the asset paths, so
                  there is one place a filename can be wrong.
                */}
                <GoalMark
                  kind={goalType}
                  selected={selected}
                  className="size-20 transition-transform duration-300 motion-safe:group-hover:scale-105"
                />
              </span>

              {/* Content */}
              <span className="relative flex flex-1 flex-col">
                <span className="text-h3 text-content">{GOAL_LABELS[goalType]}</span>

                <span className="text-body text-content-muted mt-2">
                  {GOAL_DESCRIPTIONS[goalType]}
                </span>

                {/* AI recommendation explanation */}
                <span className="bg-surface-subtle mt-5 rounded-2xl p-3.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles aria-hidden="true" className="text-content-brand size-3.5" />

                    <span className="text-content text-xs font-semibold">
                      What we&apos;ll consider
                    </span>
                  </span>

                  <span className="text-content-muted mt-2 block text-xs leading-5">
                    {GOAL_AI_COPY[goalType]}
                  </span>
                </span>

                {/* Focus tags */}
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {GOAL_FOCUS[goalType].map((item) => (
                    <span
                      key={item}
                      className={cn(
                        `rounded-full px-2.5 py-1 text-[11px] font-medium`,
                        selected
                          ? 'bg-surface-brand text-content-on-brand'
                          : 'bg-surface-muted text-content-muted',
                      )}
                    >
                      {item}
                    </span>
                  ))}
                </span>

                {/* CTA */}
                <span
                  className={cn(
                    `text-content-brand mt-auto flex items-center gap-2 pt-6 text-sm font-semibold transition-transform duration-300`,
                    'motion-safe:group-hover:translate-x-1',
                  )}
                >
                  Plan for this goal
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
