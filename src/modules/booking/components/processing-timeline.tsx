'use client';

import { Check, Circle, Loader } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The processing workflow, shown as steps rather than a spinner (spec 21h §5B).
 *
 * The spec is explicit — *"instead of an indefinite spinner, present a
 * transparent workflow"* — and the reason is worth keeping in view: the customer
 * has just parted with money and an unlabelled spinner tells them nothing about
 * whether it worked.
 *
 * **Presentation only.** Which stage is current is decided by the screen; this
 * renders a list. The tick, the ring and the label all carry the state, so it is
 * never signalled by colour alone (Document 14).
 */
export type ProcessingStageState = 'complete' | 'active' | 'upcoming';

export interface ProcessingStage {
  id: string;
  label: string;
  description: string;
  state: ProcessingStageState;
  /** Shown against completed stages, e.g. a timestamp. */
  meta?: string;
}

export function ProcessingTimeline({ stages }: { stages: readonly ProcessingStage[] }) {
  return (
    <ol className="flex list-none flex-col gap-5">
      {stages.map((stage) => (
        <li key={stage.id} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
              stage.state === 'complete' && 'text-success',
              stage.state === 'active' && 'text-content-brand',
              stage.state === 'upcoming' && 'text-content-muted',
            )}
          >
            {stage.state === 'complete' ? (
              <Check aria-hidden="true" className="size-4" />
            ) : stage.state === 'active' ? (
              <Loader aria-hidden="true" className="size-4" />
            ) : (
              <Circle aria-hidden="true" className="size-3" />
            )}
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex flex-wrap items-baseline justify-between gap-2">
              <span
                className={cn(
                  'text-body font-semibold',
                  stage.state === 'upcoming' ? 'text-content-muted' : 'text-content',
                )}
              >
                {stage.label}
              </span>
              {stage.meta ? (
                <span className="text-caption text-content-muted">{stage.meta}</span>
              ) : null}
            </span>
            <span className="text-caption text-content-muted">{stage.description}</span>
          </span>

          {/* The state in words, for anyone not reading the glyph. */}
          <span className="sr-only">
            {stage.state === 'complete'
              ? 'Completed'
              : stage.state === 'active'
                ? 'In progress'
                : 'Not started'}
          </span>
        </li>
      ))}
    </ol>
  );
}
