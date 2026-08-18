'use client';

import { ArrowRight, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { GoalMark } from '@/components/business';
import { cn } from '@/lib/utils';

import { GOAL_ENTRIES } from '../constants/goal-entry';

/**
 * The three goal columns, and the only client code in the Goal Selection
 * section.
 *
 * ## Why this was split out
 *
 * Selecting a goal has to be acknowledged *where it was made*. As a plain link
 * the customer clicked and the next thing that happened was a different page —
 * nothing said the product had understood, which is the first question the
 * journey has to answer.
 *
 * Acknowledging it needs one piece of state, and state needs a client
 * component. Only the list moved: the heading, the supporting copy and the
 * footer link stay server-rendered.
 *
 * ## What selection does
 *
 * The chosen column fills with the brand surface and its illustration inverts —
 * the same device the approved hero card uses, so the confirmation is written
 * in the product's own visual language rather than a borrowed one. The other
 * two recede to `opacity-muted`: **the choice is narrowed, not erased.**
 *
 * ## Navigation is never blocked by it
 *
 * The `<Link>` navigates on its own schedule and the state change happens
 * alongside. If the route resolves in 40ms the customer gets it in 40ms, and
 * the confirmation is simply the last thing they saw rather than a toll they
 * paid. It is transient by design — it is not a state anyone returns to.
 *
 * ## Home stays the decision surface
 *
 * Each column carries the goal, what it means in the customer's terms, and an
 * illustration of the shape of that goal. Nobody has to navigate to find out
 * what the three options are; navigation happens only once a choice is made,
 * and it carries that choice with it through `?goal=`.
 *
 * ## Touch
 *
 * Tailwind v4 scopes its `hover` variant behind `@media (hover: hover)`, so a
 * tapped column cannot stay lit after the customer has left the page. `active:`
 * supplies the press feedback touch needs instead.
 */
export function GoalEntryList() {
  const [chosenId, setChosenId] = useState<string | null>(null);

  return (
    <div className="px-5 pb-6 md:px-8 md:pb-8">
      {/* Section heading */}
      <div className="mb-5 md:mb-6">
        <div className="flex items-center gap-2">
          <span className="bg-surface-brand-subtle text-content-brand flex size-7 items-center justify-center rounded-lg">
            <Sparkles aria-hidden="true" className="size-3.5" />
          </span>

          <h3 className="text-h3 text-content">Choose your financial goal</h3>
        </div>

        <p className="text-body text-content-muted mt-2">
          Your goal helps us understand what matters most when comparing FDs.
        </p>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {GOAL_ENTRIES.map((goal) => {
          const chosen = chosenId === goal.id;
          const dimmed = chosenId !== null && !chosen;

          return (
            <Link
              key={goal.id}
              href={goal.href}
              onClick={() => setChosenId(goal.id)}
              className={cn(
                'group relative flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-3xl border p-6',
                'bg-white/95 shadow-sm',
                'transition-all duration-300 ease-out',
                'hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(91,63,208,0.12)]',
                'focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:outline-none',
                chosen
                  ? 'border-purple-300 bg-purple-50/70 shadow-[0_12px_35px_rgba(91,63,208,0.14)]'
                  : 'border-gray-200/80 hover:border-purple-200',
                dimmed && 'opacity-50',
              )}
            >
              {/* Soft decorative glow */}
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-purple-300/10 blur-3xl',
                  'transition-opacity duration-500',
                  chosen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              />

              {/* Selected indicator */}
              {chosen && (
                <span className="absolute top-5 right-5 z-10 flex size-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-md">
                  <Check aria-hidden="true" className="size-4" />
                </span>
              )}

              {/* Illustration */}
              <span
                className={cn(
                  'relative flex size-28 shrink-0 items-center justify-center rounded-3xl',
                  'transition-all duration-300',
                  'group-hover:scale-[1.03]',
                  chosen ? 'bg-purple-100 shadow-md' : 'bg-purple-50 shadow-sm',
                )}
              >
                <GoalMark kind={goal.id} selected={chosen} className="size-20" />
              </span>

              {/* Content */}
              <span className="relative mt-6 flex min-w-0 flex-1 flex-col">
                {/* Goal title */}
                <span className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-gray-950">
                  {goal.label}
                </span>

                {/* Description */}
                <span className="mt-2 max-w-[280px] text-[14px] leading-6 font-normal text-gray-500">
                  {goal.description}
                </span>

                {/* Focus */}
                <span className="mt-6">
                  <span className="block text-[10px] font-bold tracking-[0.12em] text-gray-400 uppercase">
                    We&apos;ll prioritise
                  </span>

                  <span className="mt-2 flex flex-wrap gap-2">
                    {goal.focus.split(' • ').map((item) => (
                      <span
                        key={item}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-[11px] font-medium',
                          chosen ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </span>
                </span>

                {/* CTA */}
                <span className="mt-auto flex items-center gap-2 pt-7 text-[14px] font-semibold text-purple-700">
                  <span className="group-hover:var(--ds-purple-700) transition-colors">
                    Explore this goal
                  </span>

                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
