import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

import { GoalEntryList } from './goal-entry-list';

export function GoalPlannerCallout() {
  return (
    <section
      aria-labelledby="home-goal-planner-title"
      className="relative overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-[0_20px_60px_rgba(91,33,182,0.08)]"
    >
      {/* =========================================================
          GLOBAL BACKGROUND
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_10%_40%,rgba(196,181,253,0.12),transparent_30%)]"
      />

      {/* =========================================================
          HERO
      ========================================================== */}

      <div className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 lg:px-14 lg:py-14">
        {/* Decorative glow */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-purple-200/30 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-violet-100/40 blur-3xl"
        />

        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_320px] md:gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
          {/* -------------------------------------------------------
              CONTENT
          -------------------------------------------------------- */}

          <div className="flex max-w-2xl flex-col">
            {/* Badge */}

            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-purple-100 bg-purple-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-purple-700 shadow-sm">
              <Sparkles aria-hidden="true" className="size-3.5" />
              SMART FD PLANNING
            </div>

            {/* Heading */}

            <h2
              id="home-goal-planner-title"
              className="text-3xl leading-[1.12] font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]"
            >
              What are you saving for?
            </h2>

            {/* Description */}

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Enter your goal, amount and timeline. We’ll recommend FD options that fit your need,
              explain the maturity value, and show why the plan may suit you.
            </p>

            {/* Planner flow */}

            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-purple-600" />

              <span className="font-medium text-purple-700">Goal</span>

              <span aria-hidden="true" className="text-slate-400">
                +
              </span>

              <span className="font-medium text-purple-700">Amount</span>

              <span aria-hidden="true" className="text-slate-400">
                +
              </span>

              <span className="font-medium text-purple-700">Timeline</span>

              <span aria-hidden="true" className="text-purple-500">
                →
              </span>

              <span className="font-semibold text-slate-800">FD options explained clearly</span>
            </div>
          </div>

          {/* -------------------------------------------------------
              ILLUSTRATION
          -------------------------------------------------------- */}

          <div className="relative flex items-center justify-center md:justify-end">
            {/* Illustration glow */}

            <div
              aria-hidden="true"
              className="absolute top-1/2 right-4 size-56 -translate-y-1/2 rounded-full bg-purple-200/40 blur-3xl"
            />

            <Image
              src="/goal-based-icon.png"
              alt=""
              width={420}
              height={320}
              priority
              className="relative h-auto w-64 object-contain drop-shadow-[0_20px_30px_rgba(91,33,182,0.12)] sm:w-72 md:w-full md:max-w-[340px] lg:max-w-[400px]"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          GOALS
      ========================================================== */}

      <div className="relative border-t border-purple-100 bg-gradient-to-b from-slate-50/80 via-white to-white px-5 py-8 sm:px-8 md:px-10 md:py-10">
        {/* Section heading */}

        <div className="mb-7 flex items-start gap-4 md:mb-8">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-white text-purple-600 shadow-[0_6px_20px_rgba(91,33,182,0.08)]">
            <Sparkles aria-hidden="true" className="size-5" />
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Choose your financial goal
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">
              Your goal helps us understand what matters most when comparing FDs.
            </p>
          </div>
        </div>

        {/* Existing goal cards */}

        <div className="p-3 sm:p-4 md:p-5">
          <GoalEntryList />
        </div>
      </div>

      {/* =========================================================
          FOOTER / CTA
      ========================================================== */}

      <div className="relative border-t border-purple-100 bg-white px-5 py-6 sm:px-8 md:px-10 md:py-7">
        <div className="flex flex-col gap-5 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-violet-50 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          {/* Text */}

          <div>
            <p className="text-base font-bold text-slate-900 sm:text-lg">
              Not sure which goal fits?
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Explore FD options without choosing a goal first.
            </p>
          </div>

          {/* CTA */}

          <Button
            variant="outline"
            size="md"
            asChild
            className="h-11 shrink-0 rounded-xl border-purple-300 bg-white px-6 font-semibold text-purple-700 shadow-sm transition-all hover:border-purple-500 hover:bg-purple-50 hover:text-purple-800 hover:shadow-md"
          >
            <Link href={ROUTES.goalPlanner}>
              Start with my goal
              <ArrowRight
                aria-hidden="true"
                className="ml-1 size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
