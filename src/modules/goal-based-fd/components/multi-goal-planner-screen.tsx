'use client';

import { ChevronLeft, Info, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils';

import { InvestorStep } from './investor-step';
import { PlanGoalRow } from './plan-goal-row';
import { PlanResults } from './plan-results';
import { PlannerStatus } from './planner-status';
import { STEP_HINTS } from '../constants/presentation';
import { usePlanRecommendations } from '../hooks/use-goal-recommendations';
import { useMultiGoalPlan } from '../hooks/use-multi-goal-plan';

/**
 * The multi-goal planner (client source document, Use Case 2).
 *
 * ## A second entry point, not a replacement
 *
 * The single-goal planner at `/goal-planner` is untouched and remains the path
 * for someone with one goal: it asks its questions one at a time because that is
 * the right shape for a single decision. This screen is a list the customer
 * edits in any order, because a plan with three goals is not three sequential
 * questions.
 *
 * The two share the engine, the policy and the disclosure component. They share
 * no state — `usePlannerFlow` is not imported here, and `useMultiGoalPlan` is
 * not imported there.
 *
 * ## Reconciliation is shown, never applied
 *
 * The total the customer states and the sum of their goals are displayed side by
 * side with the difference between them. Nothing is redistributed: a mismatch is
 * a fact about their plan, and resolving it silently would be this screen
 * inventing an allocation rule.
 *
 * ## Composition only
 *
 * Every figure — rate, amount placed, safety position, reason — arrives from the
 * engine. This file decides which goals are on screen and nothing else.
 */
export function MultiGoalPlannerScreen() {
  const flow = useMultiGoalPlan();
  const { data: result, isFetching } = usePlanRecommendations(flow.plan);

  const totalEntered = flow.totalAmount === '' ? 0 : Number(flow.totalAmount);

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <Link
        href={ROUTES.goalPlanner}
        className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Planning for one goal?
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-h1 text-content max-w-lg">Plan across several goals</h1>
        <p className="text-body-lg text-content-muted max-w-xl">
          Give each goal its own amount and timeline. We&apos;ll suggest deposits for each one and
          explain why — including how your money sits against deposit-insurance cover.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <label className="flex max-w-sm flex-col gap-1.5">
          <span className="text-body text-content font-medium">
            How much are you planning to invest in total?
          </span>
          <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="25,00,000"
            prefix="₹"
            value={
              flow.totalAmount === ''
                ? ''
                : new Intl.NumberFormat('en-IN').format(Number(flow.totalAmount))
            }
            onChange={(event) => {
              flow.setTotalAmount(event.target.value.replace(/\D/g, '').slice(0, 12));
            }}
          />
        </label>
      </div>

      {/*
        Asked once, for the whole journey. Senior-citizen status is a fact about
        the depositor, not about a goal — asking it beside each goal would ask
        the same question three times and let three answers disagree.
      */}
      <div className="flex flex-col gap-4">
        <InvestorStep
          value={flow.isSeniorCitizen}
          hint={STEP_HINTS.investor}
          onChange={flow.setIsSeniorCitizen}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-h2 text-content">Your goals</h2>

        <ul className="flex list-none flex-col gap-4">
          {flow.drafts.map((draft) => (
            <PlanGoalRow
              key={draft.id}
              draft={draft}
              canRemove={flow.drafts.length > 1}
              onChange={(patch) => {
                flow.updateGoal(draft.id, patch);
              }}
              onRemove={() => {
                flow.removeGoal(draft.id);
              }}
            />
          ))}
        </ul>

        <Button variant="secondary" onClick={flow.addGoal} className="w-fit">
          <Plus aria-hidden="true" className="size-4" />
          Add another goal
        </Button>
      </div>

      {/*
        The reconciliation panel. It reports three figures and resolves none of
        them — the difference is stated in the customer's own terms so they can
        decide what to do about it.
      */}
      <Card variant="outlined" className="flex flex-col gap-3 p-5">
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col">
            <dt className="text-caption text-content-muted">Total you entered</dt>
            <dd className="text-body text-content font-semibold tabular-nums">
              {formatCurrency(totalEntered)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-caption text-content-muted">Across your goals</dt>
            <dd className="text-body text-content font-semibold tabular-nums">
              {formatCurrency(flow.goalsTotal)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-caption text-content-muted">Difference</dt>
            <dd
              className={
                flow.difference === 0
                  ? 'text-body text-success font-semibold tabular-nums'
                  : 'text-body text-content font-semibold tabular-nums'
              }
            >
              {formatCurrency(Math.abs(flow.difference))}
              {flow.difference === 0 ? '' : flow.difference > 0 ? ' unassigned' : ' over'}
            </dd>
          </div>
        </dl>

        {flow.difference === 0 ? null : (
          <p className="text-caption text-content-muted flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {flow.difference > 0
              ? 'Some of your money is not assigned to a goal. Each goal is planned for the amount you gave it.'
              : 'Your goals add up to more than the total you entered. Each goal is still planned for the amount you gave it.'}
          </p>
        )}
      </Card>

      {flow.plan === null ? (
        <p className="text-body text-content-muted">
          {flow.isSeniorCitizen === undefined
            ? 'Answer the question above, then enter a total and an amount for each goal.'
            : 'Enter a total and an amount for each goal to see suggestions.'}
        </p>
      ) : null}

      {flow.plan !== null && isFetching ? <PlannerStatus /> : null}

      {flow.plan !== null && !isFetching && result ? <PlanResults result={result} /> : null}
    </div>
  );
}
