import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * SectionHeading — the shared section title used across Marketplace Home
 * (M2.3): a heading with an optional trailing action ("View all").
 *
 * The `id` is required so the owning <section> can reference it with
 * aria-labelledby, giving every section an accessible name.
 */
export interface SectionHeadingProps {
  id: string;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ id, title, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <h2 id={id} className="text-h2 text-content">
        {title}
      </h2>
      {action}
    </div>
  );
}
