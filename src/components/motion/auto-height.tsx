'use client';

import type { ReactNode } from 'react';

import { useMeasuredHeight } from '@/hooks/use-measured-height';
import { cn } from '@/lib/utils';

/**
 * A container that animates between its natural heights as its children change.
 *
 * ## What it is for
 *
 * Continuity. When one question replaces another, or a conditional region
 * appears, an un-animated container snaps and everything below it jumps — which
 * is what makes a single flow read as a stack of separate pages. The height
 * transition is the thing that makes it read as one conversation instead.
 *
 * ## What it deliberately is not
 *
 * It is not a presence component and does not orchestrate its children. It owns
 * exactly one property. Enter and exit belong to the children (`animate-reveal`
 * and the CSS fade primitives); ordering belongs to `ds-stagger`. Keeping those
 * three separate is what keeps the motion vocabulary closed.
 *
 * ## Boundaries
 *
 * Domain-free, as the `components` boundary requires: it imports a shared hook
 * and the class merger, and knows nothing of goals, deposits or planner stages.
 *
 * ## Accessibility
 *
 * `overflow: hidden` is scoped to the animating flag rather than applied at
 * rest, so a focus ring on a child is never clipped by a container that is not
 * moving. The wrapper is presentational and adds no role, so it is transparent
 * to assistive technology.
 */
export interface AutoHeightProps {
  children: ReactNode;
  /** Applied to the animating container, not the inner content wrapper. */
  className?: string;
}

export function AutoHeight({ children, className }: AutoHeightProps) {
  const { containerRef, contentRef, containerProps } = useMeasuredHeight();

  return (
    <div ref={containerRef} className={cn('ds-auto-height', className)} {...containerProps}>
      {/*
        The measured element must be a plain wrapper with no margin of its own:
        margins collapse out of `getBoundingClientRect`, so a spaced child would
        report a height smaller than the space it occupies. Consumers put their
        spacing on the children instead.
      */}
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
