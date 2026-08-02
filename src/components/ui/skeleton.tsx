import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Skeleton — loading placeholder surface (T1.11).
 *
 * Purpose: the platform's loading affordance (Document 13 §16 — skeleton
 * screens over spinners). Domain-agnostic and shape-agnostic.
 *
 * No variants and no size props by design: shape comes from composition
 * with token-scale utilities —
 *   text line  <Skeleton className="h-4 w-32" />
 *   circle     <Skeleton className="size-10 rounded-full" />
 *   block      <Skeleton className="h-40 w-full" />
 *
 * Size skeletons to match the real content they stand in for, so swapping
 * in loaded content causes no layout shift (Document 05 §17).
 *
 * Motion: the generic `animate-pulse-soft` utility (token-driven pulse);
 * reduced-motion users get a static placeholder via the global rule.
 *
 * Accessibility: decorative by default (`aria-hidden="true"`). Announce
 * loading once at the container level, not per placeholder:
 *   <div role="status" aria-live="polite">
 *     <span className="sr-only">Loading…</span>
 *     …skeletons…
 *   </div>
 */
export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('bg-surface-muted animate-pulse-soft rounded-md', className)}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';
