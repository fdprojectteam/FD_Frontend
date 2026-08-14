import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

import { GoalEntryList } from './goal-entry-list';

/**
 * Goal Selection — the guided entry into the FD planner.
 *
 * ## Why columns on one surface, not three cards
 *
 * Home already renders a product card grid a little further down. A second grid
 * here would read as more of the same and would make the page feel repetitive
 * rather than considered. Three columns divided by hairlines on a single calm
 * surface reads as **one deliberate component** — which is what a goal choice
 * is — and it distinguishes this section from the catalogue below it.
 *
 * ## Why the goals link with intent
 *
 * Each column carries `?goal=…`. Choosing here **is** answering the planner's
 * first question, so the planner acknowledges it rather than asking again. The
 * quiet link at the foot is the path for someone who has not decided; it is the
 * only place on this page that reaches the bare route.
 *
 * ## What was removed, and why
 *
 * A second `Find my FD` button (the hero already has one), a `Guided` eyebrow
 * that labelled the section without informing anyone, three tinted icon circles,
 * three chevrons, and a body sentence that repeated the hero's almost word for
 * word. Each was decoration or duplication; none carried information.
 *
 * ## Why the columns are a separate component
 *
 * Choosing a goal here **is** answering the planner's first question, so the
 * choice has to be acknowledged before the page changes — the chosen column
 * holds, the other two recede. That needs one piece of state, and state needs a
 * client component. Only the list moved (`GoalEntryList`); this file stays on
 * the server, so the heading, the copy and the footer link cost nothing.
 *
 * Presentation-only. It imports one route constant and three labels, and nothing
 * from the goal module — the boundary forbids it.
 */
export function GoalPlannerCallout() {
  return (
    <section
      aria-labelledby="home-goal-planner-title"
      className="border-border-default rounded-card bg-surface-card relative overflow-hidden border"
    >
      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-purple-50/70 via-purple-50/20 to-transparent"
      />

      {/* -----------------------------------------------------------
          HERO
      ------------------------------------------------------------ */}
      <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[260px_1fr] md:gap-10 md:p-10 lg:grid-cols-[300px_1fr]">
        {/* Illustration */}
        <div className="flex items-center justify-center md:justify-start">
          <Image
            src="/goal-based-icon.png"
            alt=""
            width={300}
            height={240}
            priority
            className="h-auto w-52 object-contain sm:w-60 md:w-full"
          />
        </div>

        {/* Content */}
        <div className="flex max-w-2xl flex-col gap-3">
          <div className="text-content-brand inline-flex w-fit items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Personalised FD recommendations
          </div>

          <h2 id="home-goal-planner-title" className="text-h2 text-content">
            What are you planning for?
          </h2>

          <p className="text-body-lg text-content-muted max-w-xl">
            Tell us your goal and timeline. We&apos;ll compare FD options based on what matters to
            you — not just the interest rate.
          </p>

          {/* Trust/value statement */}
          <div className="text-content-muted mt-2 flex items-center gap-2 text-sm">
            <span className="bg-surface-brand size-1.5 rounded-full" />
            Goal
            <span className="text-content-muted">+</span>
            Amount
            <span className="text-content-muted">+</span>
            Timeline
            <span className="text-content-muted">→</span>
            <span className="text-content font-medium">Personalised FD options</span>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------
          GOALS
      ------------------------------------------------------------ */}
      <div className="bg-surface-subtle/40 relative border-t pt-7 md:pt-8">
        <GoalEntryList />
      </div>

      {/* -----------------------------------------------------------
          FOOTER
      ------------------------------------------------------------ */}
      <div className="border-border-default border-t px-6 py-5 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body text-content font-medium">Not sure which goal fits?</p>
            <p className="text-caption text-content-muted">
              Explore FD options without choosing a goal first.
            </p>
          </div>

          <Button variant="outline" size="md" asChild>
            <Link href={ROUTES.goalPlanner}>
              Find my FD
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
