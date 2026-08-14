import { Check } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Stepper — the platform's linear progress indicator (T3.1).
 *
 * Purpose: any journey made of ordered, named steps. Booking is the first
 * consumer (eight steps, Overview → Success); KYC, withdrawal and onboarding
 * are the obvious next ones. Domain-agnostic by construction — it receives
 * `{ id, label }` and a current id, and knows nothing about deposits.
 *
 * **Why it is a platform primitive and not a Booking component.** The rule in
 * CLAUDE.md is `Button`, not `MarketplaceButton`. A `BookingStepper` would be
 * the same mistake one level up: the second multi-step flow would either import
 * across a module boundary — which ESLint forbids — or copy it.
 *
 * ## Two presentations, one DOM
 *
 * The approved desktop rail (numbered circle · label · connector, eight across)
 * cannot fit 320px, and the usual answers are both wrong here: horizontal
 * scrolling hides the destination the indicator exists to show, and rendering a
 * second element below `md` puts two progress indicators in the accessibility
 * tree.
 *
 * So there is **one `<ol>` with every step in it**, and only the *labels* of
 * non-current steps drop below `md`. What remains is a rail of eight numbered
 * markers with the current one named — which fits 320px, keeps every step in
 * the document, and leaves the reading order identical at both widths.
 *
 * Accessibility: an ordered list inside a labelled `<nav>`; `aria-current="step"`
 * on the active item; completed steps carry a visually-hidden "Completed" so the
 * tick is never the only signal; and a visually-hidden "Step 3 of 8" summary
 * gives the position without counting list items. The markers are **not
 * interactive** — this reports progress, it does not navigate — so the 44px
 * touch-target rule does not apply to them. A future clickable variant must add
 * real buttons and take the target size with it.
 */
export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface StepperStep {
  id: string;
  label: string;
}

export interface StepperProps extends Omit<HTMLAttributes<HTMLElement>, 'aria-label'> {
  steps: StepperStep[];
  /** The step in progress. Everything before it is complete, everything after upcoming. */
  currentStepId: string;
  /** Names the landmark; required so two steppers on one page stay distinguishable. */
  label: string;
  onStepClick?: (stepId: string) => void;
}

const MARKER: Record<StepStatus, string> = {
  complete: 'bg-surface-brand-subtle text-content-brand',
  current: 'bg-surface-brand text-content-on-brand',
  upcoming: 'border-border-default bg-surface-card text-content-muted border',
};

const LABEL: Record<StepStatus, string> = {
  complete: 'text-content',
  current: 'text-content font-semibold',
  upcoming: 'text-content-muted',
};

export const Stepper = forwardRef<HTMLElement, StepperProps>(
  (
    {
      steps,
      currentStepId,
      label,
      className,
      /*
        ⚠️ Accepted but not wired. The steps render as text, not controls, so a
        handler passed here is currently dropped — `GoalPlannerScreen` supplies
        one and nothing calls it.

        It is destructured rather than spread so it cannot reach the DOM as an
        unknown attribute, and left unwired rather than connected because making
        the rail interactive is a UI change, not a defect fix. Tracked as P1.
      */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onStepClick,
      ...props
    },
    ref,
  ) => {
    const currentIndex = steps.findIndex((step) => step.id === currentStepId);

    return (
      <nav ref={ref} aria-label={label} className={cn('w-full', className)} {...props}>
        {/*
          The position, stated once. Without it a screen-reader user counts
          list items to learn how far along they are.
        */}
        <p className="sr-only">
          Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}
        </p>

        <ol className="flex list-none items-center gap-2 md:gap-3">
          {steps.map((step, index) => {
            const status: StepStatus =
              index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';

            return (
              <li
                key={step.id}
                data-step-status={status}
                aria-current={status === 'current' ? 'step' : undefined}
                /*
                  `min-w-0` on every item, and growth only from `md`: below it
                  the rail is markers plus one label, so items size to content
                  and eight of them fit 320px with room to spare. Letting them
                  grow at that width would stretch the connectors and squeeze
                  the current label into a two-line wrap.
                */
                className="flex min-w-0 items-center gap-2 md:flex-1"
              >
                <span
                  className={cn(
                    'text-caption flex size-7 shrink-0 items-center justify-center rounded-full font-semibold tabular-nums md:size-8',
                    MARKER[status],
                  )}
                >
                  {status === 'complete' ? (
                    <>
                      <Check aria-hidden="true" className="size-4" />
                      <span className="sr-only">Completed</span>
                    </>
                  ) : (
                    index + 1
                  )}
                </span>

                {/*
                  Below `md` only the current step is named; from `md` every
                  step is. `truncate` rather than wrap: a label that wraps
                  changes the rail's height and shifts the page beneath it.
                */}
                <span
                  className={cn(
                    'text-caption md:text-body truncate',
                    LABEL[status],
                    status === 'current' ? 'inline' : 'hidden md:inline',
                  )}
                >
                  {step.label}
                </span>

                {/*
                  Decorative connector, drawn from `md` where the rail is wide
                  enough for it to read as a line rather than a hyphen. Never
                  after the last step.
                */}
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="border-border-default hidden h-px flex-1 border-t md:block"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  },
);
Stepper.displayName = 'Stepper';
