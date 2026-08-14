'use client';

import { ArrowRight, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { AutoHeight } from '@/components/motion';
import { Stepper } from '@/components/ui/stepper';
import { ROUTES } from '@/constants/routes';

import { AmountStep } from './amount-step';
import { GoalStep } from './goal-step';
import { HorizonStep } from './horizon-step';
import { InvestorStep } from './investor-step';
import { PlannerResults } from './planner-results';
import { PlannerStatus } from './planner-status';
import { PlannerTrail } from './planner-trail';
import { TargetStep } from './target-step';
import { GOAL_LABELS } from '../constants/goals';
import { PLANNER_STEPS, STEP_HINTS, acknowledgementFor } from '../constants/presentation';
import { useGoalRecommendations, useProductCatalogue } from '../hooks/use-goal-recommendations';
import { parseGoalParam, usePlannerFlow } from '../hooks/use-planner-flow';

/**
 * The goal planner — one question at a time, never asked twice.
 *
 * ## The intro screen is gone, deliberately
 *
 * It showed a headline, the same three goal labels and descriptions the Home
 * section had just shown, and a "Let's start" button. So the goal vocabulary
 * appeared **three times before the customer answered anything**, and one of
 * those screens existed only to be dismissed. Its heading now sits above the
 * first real question; nothing informative was lost and a screen and a click
 * were removed.
 *
 * ## Intent arrives with the customer
 *
 * `?goal=education` means the first question is already answered. The goal step
 * is not rendered, and the acknowledgement states what was understood so the
 * customer can see their choice was carried rather than dropped. An
 * unrecognised value falls through to the ordinary question — a URL is user
 * input and must not be able to select something on their behalf.
 *
 * ## Composition only
 *
 * Every rule, rate and figure comes from the engine. This file owns which
 * question is on screen and nothing else.
 */
export function GoalPlannerScreen() {
  const searchParams = useSearchParams();
  const initialGoal = parseGoalParam(searchParams.get('goal'));

  const flow = usePlannerFlow(initialGoal);
  const catalogue = useProductCatalogue();
  const { data: result, isFetching } = useGoalRecommendations(flow.goal);

  /*
    The honest version of "deposits start from ₹X": the smallest minimum across
    the catalogue actually loaded. Absent until it loads, rather than a number
    typed into the copy that goes stale the day a bank moves one.
  */
  const lowestMinimum = useMemo(() => {
    const products = catalogue.data ?? [];
    if (products.length === 0) return undefined;

    return products.reduce(
      (lowest, product) => Math.min(lowest, product.minInvestment),
      Number.POSITIVE_INFINITY,
    );
  }, [catalogue.data]);

  const { goalType } = flow.answers;
  const showResults = flow.stage === 'results';
  const currentStepId = showResults ? 'target' : flow.stage;

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <Link
        href={ROUTES.home}
        className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to Marketplace
      </Link>

      {/*
        The intro's heading, kept — it is the one thing on that screen that told
        the customer where they were. It sits above the first question instead of
        on a screen of its own.
      */}

      <header className="border-border-default bg-surface-card shadow-elevation-1 hover:shadow-elevation-2 relative overflow-hidden rounded-3xl border transition-shadow duration-300">
        {/* Soft background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-purple-300/10 blur-3xl"
        />

        <div className="relative grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[1fr_280px] md:p-10 lg:grid-cols-[1fr_340px]">
          {/* Left content */}
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
              <span className="size-1.5 rounded-full bg-purple-600" />
              Personalised FD planning
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-h1 text-content max-w-xl">Find the FD that fits your goal</h1>

              <p className="text-body-lg text-content-muted max-w-xl">
                Tell us what you&apos;re planning for, how much you want to invest, and when
                you&apos;ll need it. We&apos;ll narrow down the options for you.
              </p>
            </div>

            {/* AI recommendation explanation */}
            <div className="mt-2 flex max-w-xl items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                ✦
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">How your recommendation works</p>

                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Our recommendation engine considers your goal, investment amount, timeline,
                  liquidity needs and FD terms — so you can compare options based on what actually
                  matters to you.
                </p>
              </div>
            </div>

            {/* Planning signals */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['Your goal', 'Investment amount', 'Timeline', 'FD suitability'].map((item) => (
                <span
                  key={item}
                  className="bg-surface-subtle text-content-muted rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="flex justify-center md:justify-end">
            <div className="motion-safe:animate-reveal relative flex items-center justify-center rounded-3xl bg-purple-50/70 p-5 shadow-sm">
              <Image
                src="/goal-based-icon.png"
                alt=""
                width={340}
                height={280}
                priority
                className="h-auto w-56 object-contain sm:w-64 md:w-72 lg:w-80"
              />
            </div>
          </div>
        </div>
      </header>

      {/*
        The multi-goal path, as a quiet link rather than a second call to
        action. Someone with one goal is already in the right place; this is for
        the customer who arrives and realises they have three.
      */}
      <Link
        href={ROUTES.goalPlannerPlan}
        className="focus-ring text-body text-content-muted hover:text-content-brand duration-fast inline-flex w-fit items-center gap-1.5 rounded-md font-medium transition ease-out"
      >
        Planning for more than one goal?
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>

      <Stepper
        steps={[...PLANNER_STEPS]}
        currentStepId={currentStepId}
        label="Goal planner progress"
        onStepClick={(stepId) => {
          if (stepId === 'goal') {
            flow.editStep('goal');
          }

          if (stepId === 'amount' && flow.answers.goalType !== undefined) {
            flow.editStep('amount');
          }

          if (stepId === 'horizon' && flow.answers.principal !== undefined) {
            flow.editStep('horizon');
          }
        }}
      />

      <PlannerTrail answers={flow.answers} stage={flow.stage} onEdit={flow.editStep} />

      {/*
        The acknowledgement. It restates the rule that will actually run for this
        goal (`GOAL_TENURE_PREFERENCE`), so the platform is telling the customer
        what it is about to do rather than flattering them.
      */}
      {goalType !== undefined && flow.stage !== 'goal' ? (
        <p key={goalType} className="text-body-lg text-content motion-safe:animate-reveal">
          <span className="font-semibold">{GOAL_LABELS[goalType]} — got it.</span>{' '}
          <span className="text-content-muted">{acknowledgementFor(goalType)}</span>
        </p>
      ) : null}

      {/*
        One container for whatever is currently being asked or answered.

        ## Why the height is animated

        Each stage is a different height, and a container that snaps makes the
        planner read as a sequence of separate pages — which is exactly what it
        is not. Animating the height is what makes one question becoming the next
        read as a continuing conversation. `AutoHeight` owns only that property;
        the enter animation belongs to the step, and neither knows about the
        other.

        ## Why the key is the stage

        Remounting on stage change is what lets each step run its own entrance.
        Without it React would reuse the element and the new question would
        simply appear in place, with nothing to distinguish "the next question"
        from "the same question, different words".

        Nothing here changes `usePlannerFlow`: the stage machine is unchanged and
        holds no animation state.
      */}
      <AutoHeight>
        <div key={flow.stage} className="motion-safe:animate-reveal">
          {flow.stage === 'goal' ? (
            <GoalStep value={goalType} hint={STEP_HINTS.goal} onChange={flow.chooseGoal} />
          ) : null}

          {flow.stage === 'investor' ? (
            <InvestorStep
              value={flow.answers.isSeniorCitizen}
              hint={STEP_HINTS.investor}
              onChange={flow.setInvestor}
            />
          ) : null}

          {flow.stage === 'amount' ? (
            <AmountStep
              hint={STEP_HINTS.amount}
              lowestMinimum={lowestMinimum}
              initialValue={flow.answers.principal}
              onSubmit={flow.setPrincipal}
            />
          ) : null}

          {flow.stage === 'horizon' ? (
            <HorizonStep
              hint={STEP_HINTS.horizon}
              value={flow.answers.horizonMonths}
              onChange={flow.setHorizon}
            />
          ) : null}

          {flow.stage === 'target' ? (
            <TargetStep
              hint={STEP_HINTS.target}
              initialValue={flow.answers.targetAmount}
              onSubmit={flow.setTarget}
            />
          ) : null}
        </div>
      </AutoHeight>

      {/*
        Status and results sit **outside** the height container, deliberately.

        Animating the height of a tall results section would mean transitioning
        hundreds of pixels of layout for no gain — and the transition that
        matters here already happens: with the last question answered the
        container above empties and collapses, which is the question settling
        away. The recommendation then reveals in its own right.
      */}
      {showResults && isFetching ? <PlannerStatus /> : null}

      {showResults && !isFetching && result && goalType !== undefined ? (
        <PlannerResults result={result} goalType={goalType} />
      ) : null}
    </div>
  );
}
