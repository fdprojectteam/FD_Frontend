'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { GoalMark } from '@/components/business';
import { cn } from '@/lib/utils';

import { GOAL_ENTRIES } from '../constants/goal-entry';

export function GoalEntryList() {
  const [chosenId, setChosenId] = useState<string | null>(null);

  return (
    <div className="w-full min-w-0">
      {/* =========================================================
          GOAL CARDS
      ========================================================== */}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-4 md:gap-4 lg:gap-5">
        {GOAL_ENTRIES.map((goal) => {
          const chosen = chosenId === goal.id;
          const dimmed = chosenId !== null && !chosen;

          return (
            <Link
              key={goal.id}
              href={goal.href}
              onClick={() => setChosenId(goal.id)}
              aria-label={`Explore ${goal.label}`}
              aria-current={chosen ? 'true' : undefined}
              className={cn(
                /* =====================================================
                   BASE
                ====================================================== */

                `group relative flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-[22px] border p-4 sm:min-h-[390px] sm:p-5 lg:rounded-[24px] lg:p-6`,

                'bg-white',

                'transition-all duration-300 ease-out',

                /* =====================================================
                   NORMAL STATE
                ====================================================== */

                !chosen && ['border-slate-200', 'shadow-[0_8px_30px_rgba(15,23,42,0.04)]'],

                /* =====================================================
                   HOVER
                ====================================================== */

                !chosen && [
                  'hover:-translate-y-1',
                  'hover:border-purple-200',
                  'hover:shadow-[0_18px_45px_rgba(91,33,182,0.10)]',
                ],

                /* =====================================================
                   SELECTED
                ====================================================== */

                chosen && [
                  'border-purple-500',
                  'bg-gradient-to-b',
                  'from-purple-50/90',
                  'via-white',
                  'to-white',
                  'shadow-[0_18px_45px_rgba(91,33,182,0.16)]',
                ],

                /* =====================================================
                   FOCUS
                ====================================================== */

                `focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none`,

                /* =====================================================
                   DIMMED
                ====================================================== */

                dimmed && 'opacity-45',
              )}
            >
              {/* =====================================================
                  CARD BACKGROUND GLOW
              ====================================================== */}

              <span
                aria-hidden="true"
                className={cn(
                  `pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-purple-300/20 blur-3xl transition-opacity duration-500`,
                  chosen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              />

              {/* Bottom glow */}

              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 left-1/2 size-36 -translate-x-1/2 rounded-full bg-violet-200/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              />

              {/* =====================================================
                  SELECTED CHECK
              ====================================================== */}

              {chosen && (
                <span className="absolute top-4 right-4 z-20 flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white shadow-[0_6px_16px_rgba(91,33,182,0.30)] sm:top-5 sm:right-5">
                  <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                </span>
              )}

              {/* =====================================================
                  ILLUSTRATION
              ====================================================== */}

              <span
                className={cn(
                  `relative flex size-[108px] shrink-0 items-center justify-center self-center rounded-full transition-all duration-500 ease-out group-hover:scale-[1.04] sm:size-[120px] lg:size-[132px]`,

                  chosen
                    ? `bg-gradient-to-br from-purple-100 via-violet-50 to-white shadow-[0_10px_30px_rgba(124,58,237,0.14)]`
                    : `bg-gradient-to-br from-purple-50 via-violet-50/60 to-white shadow-[0_8px_24px_rgba(91,33,182,0.06)]`,
                )}
              >
                {/* Illustration inner glow */}

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 rounded-full bg-white/60 sm:inset-3"
                />

                <GoalMark
                  kind={goal.id}
                  selected={chosen}
                  className="relative z-10 size-[76px] transition-transform duration-500 group-hover:scale-105 sm:size-[88px] lg:size-[96px]"
                />
              </span>

              {/* =====================================================
                  CONTENT
              ====================================================== */}

              <span className="relative mt-5 flex min-w-0 flex-1 flex-col sm:mt-6">
                {/* ===================================================
                    TITLE
                ==================================================== */}

                <span
                  className={cn(
                    `min-w-0 text-[17px] leading-6 font-bold tracking-[-0.02em] transition-colors duration-300 sm:text-[19px] sm:leading-7`,
                    chosen ? 'text-purple-700' : 'text-slate-950',
                  )}
                >
                  {goal.label}
                </span>

                {/* ===================================================
                    DESCRIPTION
                ==================================================== */}

                <span className="mt-2 min-w-0 text-[13px] leading-5 font-normal text-slate-500 sm:text-[14px] sm:leading-6">
                  {goal.description}
                </span>

                {/* ===================================================
                    PRIORITIES
                ==================================================== */}

                <span className="mt-4 min-w-0 sm:mt-5">
                  <span className="block text-[9px] font-bold tracking-[0.14em] text-slate-400 uppercase sm:text-[10px]">
                    We&apos;ll prioritise
                  </span>

                  <span className="mt-2 flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
                    {goal.focus.split(' • ').map((item) => (
                      <span
                        key={item}
                        className={cn(
                          `max-w-full rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors duration-300 sm:px-3 sm:py-1.5 sm:text-[11px]`,
                          chosen
                            ? `border-purple-100 bg-purple-100/80 text-purple-700`
                            : `border-slate-100 bg-slate-100 text-slate-600`,
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </span>
                </span>

                {/* ===================================================
                    CTA
                ==================================================== */}

                <span className="relative mt-auto flex min-w-0 items-center justify-between gap-2 pt-6 text-[13px] font-semibold text-purple-700 sm:pt-7 sm:text-[14px]">
                  <span className="min-w-0 truncate transition-transform duration-300 group-hover:translate-x-0.5">
                    Explore this goal
                  </span>

                  <span
                    className={cn(
                      `flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300`,
                      chosen
                        ? `bg-purple-600 text-white shadow-[0_6px_16px_rgba(91,33,182,0.25)]`
                        : `bg-purple-50 text-purple-600 group-hover:bg-purple-100`,
                    )}
                  >
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
