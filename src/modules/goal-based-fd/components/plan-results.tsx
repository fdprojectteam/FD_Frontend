import { Info } from 'lucide-react';

import { SafetyNote } from '@/components/business';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils';

import { AllocationLegCard } from './allocation-leg-card';
import { GOAL_LABELS } from '../constants/goals';
import { planHorizonLabel } from '../constants/plan-horizons';
import type { MultiGoalPlanResult } from '../types/plan';

/**
 * The multi-goal plan, grouped by goal.
 *
 * ## Why grouping is the structure
 *
 * The customer stated goals, not deposits. Showing a flat list of placements
 * would make them reconstruct which money belongs to which goal — the one thing
 * the plan exists to keep straight. Each goal keeps its own amount and timeline
 * as its heading, so a leg is always read in the context of the goal it serves.
 *
 * ## What is deliberately absent
 *
 * **No combined maturity, and no plan-level return.** The client source document
 * reports no maturity for Use Case 2 — not per goal and not in total — so any
 * such figure would be this platform's invention, and a plan-level number is
 * exactly the kind a customer reads as a promise.
 *
 * ## Money that could not be placed is stated
 *
 * `unallocatedAmount` is shown whenever it is non-zero, with the goal-level
 * reason beside the goal it belongs to. Silence there would be the plan implying
 * every rupee found a home.
 *
 * Presentation only: every figure arrives computed.
 */
export function PlanResults({ result }: { result: MultiGoalPlanResult }) {
  return (
    <section aria-labelledby="plan-results-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 id="plan-results-title" className="text-h2 text-content">
          Your plan
        </h2>
        <p className="text-body-lg text-content-muted">
          {formatCurrency(result.allocatedAmount)} placed across{' '}
          {result.goals.reduce((count, goal) => count + goal.legs.length, 0)} deposits, grouped by
          the goal each one serves.
        </p>
      </div>

      {/*
        Reconciliation, stated rather than corrected. A difference between what
        the customer said they had and what the goals account for is a fact about
        their plan; redistributing it would be the platform inventing an
        allocation rule.
      */}
      {result.unallocatedAmount > 0 ? (
        <Card variant="outlined" className="flex items-start gap-3 p-4">
          <Info aria-hidden="true" className="text-content-muted mt-0.5 size-4 shrink-0" />
          <p className="text-body text-content">
            <span className="font-semibold">
              {formatCurrency(result.unallocatedAmount)} is not placed.
            </span>{' '}
            <span className="text-content-muted">
              It belongs to a goal no suitable deposit was found for. The reason is shown with that
              goal below.
            </span>
          </p>
        </Card>
      ) : null}

      {result.warnings.map((warning) => (
        <p key={warning.text} className="text-caption text-content-muted flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {warning.text}
        </p>
      ))}

      {result.goals.map((entry) => (
        <div
          key={`${entry.goal.goalType}-${String(entry.goal.amount)}`}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="text-h3 text-content">{GOAL_LABELS[entry.goal.goalType]}</h3>
              {/* The customer's own words, echoed back. Nothing was decided from them. */}
              {entry.goal.intent === undefined ? null : (
                <p className="text-caption text-content-muted">{entry.goal.intent}</p>
              )}
            </div>
            <p className="text-body text-content-muted">
              {formatCurrency(entry.goal.amount)} · {planHorizonLabel(entry.goal.horizon)}
            </p>
          </div>

          {entry.legs.length > 0 ? (
            <ul
              /* `grid-cols-1` bounds the track — see the note in `planner-results.tsx`. */
              className="grid list-none grid-cols-1 gap-4 md:grid-cols-2"
            >
              {entry.legs.map((leg) => (
                <li key={`${leg.productId}-${String(leg.amount)}`}>
                  <AllocationLegCard leg={leg} />
                </li>
              ))}
            </ul>
          ) : (
            <Card variant="outlined" className="p-4">
              <p className="text-body text-content-muted">
                No deposit in the catalogue suits this goal, so none has been suggested. Its money
                is counted as unplaced rather than moved to another goal.
              </p>
            </Card>
          )}

          {entry.warnings.length > 0 ? (
            <ul className="text-caption text-content-muted flex list-none flex-col gap-1.5">
              {entry.warnings.map((warning) => (
                <li key={warning.text} className="flex items-start gap-2">
                  <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  {warning.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      {/*
        The client document requires the coverage note at the time of
        recommendation, and requires concentration logic to be shown where Small
        Finance Banks appear. Each leg states its own safety position; this is
        the plan-level statement that sits beneath all of them.
      */}
      <SafetyNote className="border-border-default rounded-card border p-4" />
    </section>
  );
}
