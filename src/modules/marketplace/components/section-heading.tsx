import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * SectionHeading — the shared section title used across Marketplace Home
 * (M2.3): a heading with an optional trailing action ("View all").
 *
 * The `id` is required so the owning <section> can reference it with
 * aria-labelledby, giving every section an accessible name.
 *
 * ## Why the row wraps
 *
 * It did not, and it is the other half of the Home 320px overflow. A
 * `justify-between` row with two unshrinkable children has a minimum width of
 * both of them together; when that exceeds the container the row does not
 * compress, it overflows. Wrapping lets the action drop beneath the heading at
 * the widths where they cannot share a line, which is the behaviour the layout
 * wanted all along — at every width wide enough for both, nothing changes.
 *
 * `min-w-0` on the heading is the companion fix: without it a long section
 * title is itself unshrinkable and re-creates the same overflow on its own.
 */
export interface SectionHeadingProps {
  id: string;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ id, title, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-3', className)}>
      <h2 id={id} className="text-h2 text-content min-w-0">
        {title}
      </h2>
      {action}
    </div>
  );
}
