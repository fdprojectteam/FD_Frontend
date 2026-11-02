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
import { calculateEmergencyFundTarget } from '../utils/emergency-allocation';

/**
 * Goal Planner Screen
 *
 * Responsive layout:
 * - Mobile: single-column layout with compact spacing
 * - Small screens: larger typography and illustration
 * - Medium+: two-column hero
 * - Stepper is horizontally scrollable when required
 * - Existing planner flow and business logic are unchanged
 */
export function GoalPlannerScreen() {
  const searchParams = useSearchParams();

  const initialGoal = parseGoalParam(searchParams.get('goal'));

  const flow = usePlannerFlow(initialGoal);

  const catalogue = useProductCatalogue();

  const { data: result, isFetching, isError, refetch } = useGoalRecommendations(flow.goal);

  /*
   * The honest version of "deposits start from ₹X":
   * the smallest minimum across the catalogue actually loaded.
   */
  const lowestMinimum = useMemo(() => {
    const products = catalogue.data ?? [];

    if (products.length === 0) {
      return undefined;
    }

    return products.reduce(
      (lowest, product) => Math.min(lowest, product.minInvestment),
      Number.POSITIVE_INFINITY,
    );
  }, [catalogue.data]);

  const { goalType } = flow.answers;

  const showResults = flow.stage === 'results';

  const currentStepId = showResults ? 'target' : flow.stage;

  return (
    <div className="container-detail flex flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8 md:gap-8 md:px-0 md:py-12">
      {/* =========================================================
          BACK TO MARKETPLACE
      ========================================================== */}

      <Link
        href={ROUTES.home}
        className="focus-ring text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium transition-colors sm:text-base"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to Marketplace
      </Link>

      {/* =========================================================
          HERO
      ========================================================== */}

      <header className="border-border-default bg-surface-card shadow-elevation-1 hover:shadow-elevation-2 relative overflow-hidden rounded-3xl border transition-shadow duration-300">
        {/* -------------------------------------------------------
            Decorative background glow
        -------------------------------------------------------- */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-purple-300/10 blur-3xl sm:size-80"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/4 size-48 rounded-full bg-violet-200/10 blur-3xl sm:size-64"
        />

        {/* -------------------------------------------------------
            Hero content
        -------------------------------------------------------- */}

        <div className="relative grid grid-cols-1 items-center gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[1fr_280px] md:p-10 lg:grid-cols-[1fr_340px]">
          {/* =====================================================
              LEFT CONTENT
          ====================================================== */}

          <div className="flex max-w-2xl flex-col gap-4">
            {/* ---------------------------------------------------
                Badge
            ---------------------------------------------------- */}

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-purple-600" />
              Smart FD planning
            </div>

            {/* ---------------------------------------------------
                Heading + description
            ---------------------------------------------------- */}

            <div className="flex flex-col gap-2">
              <h1 className="text-content max-w-xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl md:text-5xl">
                Find the FD that fits your goal
              </h1>

              <p className="text-content-muted max-w-xl text-sm leading-6 sm:text-base sm:leading-7 md:text-lg">
                Tell us what you&apos;re planning for, how much you want to invest, and when
                you&apos;ll need it. We&apos;ll narrow down the options for you.
              </p>
            </div>

            {/* ---------------------------------------------------
                AI recommendation explanation
            ---------------------------------------------------- */}

            <div className="mt-1 flex max-w-xl items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-3 sm:mt-2 sm:p-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 sm:size-9">
                ✦
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                  How your recommendation works
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm">
                  Our recommendation engine considers your goal, investment amount, timeline,
                  liquidity needs and FD terms — so you can compare options based on what actually
                  matters to you.
                </p>
              </div>
            </div>

            {/* ---------------------------------------------------
                Planning signals
            ---------------------------------------------------- */}

            <div className="flex flex-wrap gap-1.5 pt-1 sm:gap-2">
              {['Your goal', 'Investment amount', 'Timeline', 'FD suitability'].map((item) => (
                <span
                  key={item}
                  className="bg-surface-subtle text-content-muted rounded-full px-2.5 py-1.5 text-[11px] font-medium sm:px-3 sm:text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* =====================================================
              RIGHT ILLUSTRATION
          ====================================================== */}

          <div className="flex justify-center md:justify-end">
            <div className="motion-safe:animate-reveal relative flex w-full max-w-[260px] items-center justify-center rounded-3xl bg-purple-50/70 p-4 shadow-sm sm:max-w-[300px] sm:p-5 md:max-w-none">
              <Image
                src="/goal-based-icon.png"
                alt=""
                width={340}
                height={280}
                priority
                className="h-auto w-48 object-contain sm:w-56 md:w-72 lg:w-80"
              />
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          MULTI-GOAL LINK
      ========================================================== */}

      <Link
        href={ROUTES.goalPlannerPlan}
        className="focus-ring text-content-muted hover:text-content-brand inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium transition duration-200 ease-out sm:text-base"
      >
        Planning for more than one goal?
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>

      {/* =========================================================
          STEPPER
      ========================================================== */}

      <div className="w-full [scrollbar-width:none] overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-max">
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
        </div>
      </div>

      {/* =========================================================
          PLANNER TRAIL
      ========================================================== */}

      <div className="w-full min-w-0">
        <PlannerTrail answers={flow.answers} stage={flow.stage} onEdit={flow.editStep} />
      </div>

      {/* =========================================================
          ACKNOWLEDGEMENT
      ========================================================== */}

      {goalType !== undefined && flow.stage !== 'goal' ? (
        <p
          key={goalType}
          className="text-content motion-safe:animate-reveal text-base leading-7 sm:text-lg"
        >
          <span className="font-semibold">{GOAL_LABELS[goalType]} — got it.</span>{' '}
          <span className="text-content-muted">{acknowledgementFor(goalType)}</span>
        </p>
      ) : null}

      {/* =========================================================
          CURRENT PLANNER STEP
      ========================================================== */}

      <AutoHeight>
        <div key={flow.stage} className="motion-safe:animate-reveal w-full min-w-0">
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
              initialValue={flow.answers.totalAmount ?? flow.answers.principal}
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
              suggestedValue={
                flow.answers.goalType === 'emergency' && flow.answers.principal !== undefined
                  ? calculateEmergencyFundTarget(flow.answers.principal)
                  : undefined
              }
              initialSource={flow.answers.targetSource}
              onSubmit={flow.setTarget}
            />
          ) : null}
        </div>
      </AutoHeight>

      {/* =========================================================
          STATUS
      ========================================================== */}

      {showResults && isFetching ? (
        <div className="w-full min-w-0">
          <PlannerStatus />
        </div>
      ) : null}

      {showResults && isError ? (
        <section
          aria-live="polite"
          className="border-border-default bg-surface-card flex flex-col items-start gap-3 rounded-2xl border p-5"
        >
          <h2 className="text-h3 text-content">We couldn&apos;t load recommendations</h2>
          <p className="text-body text-content-muted">
            Your plan is still here. Please try again, or edit it and submit a new request.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="focus-ring text-content-brand rounded-md font-medium"
              onClick={() => void refetch()}
            >
              Try again
            </button>
            <button
              type="button"
              className="focus-ring text-content-brand rounded-md font-medium"
              onClick={() => flow.editStep('amount')}
            >
              Edit plan
            </button>
          </div>
        </section>
      ) : null}

      {/* =========================================================
          RESULTS
      ========================================================== */}

      {showResults && !isFetching && !isError && result && goalType !== undefined ? (
        <div className="w-full min-w-0">
          <PlannerResults
            result={result}
            goalType={goalType}
            totalAmount={flow.answers.totalAmount}
            onEditPlan={() => flow.editStep('amount')}
          />
        </div>
      ) : null}
    </div>
  );
}
