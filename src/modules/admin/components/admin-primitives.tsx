'use client';

import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * The three shapes every operations screen is built from.
 *
 * A page header, a labelled section, and a status pill. Written once so eight
 * screens cannot drift into eight slightly different headings — and small
 * enough that they add no vocabulary to the design system: everything below is
 * `Card`, `Badge` and the existing tokens.
 */

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h2 text-content">{title}</h1>
        {description === undefined ? null : (
          <p className="text-caption text-content-muted">{description}</p>
        )}
      </div>

      {actions}
    </header>
  );
}

export function AdminSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-8 flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-body-lg text-content font-semibold">{title}</h2>
          {description === undefined ? null : (
            <p className="text-caption text-content-muted">{description}</p>
          )}
        </div>

        {actions}
      </div>

      {children}
    </section>
  );
}

/**
 * A status, in words and in a tone.
 *
 * Never colour alone: the label is always rendered, and the tone is a
 * reinforcement rather than the information.
 */
export type AdminTone = 'neutral' | 'brand' | 'success' | 'warning' | 'error';

const TONE_CLASS: Record<AdminTone, string> = {
  neutral: 'text-content-muted',
  brand: 'text-content-brand',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export function StatusPill({ tone, children }: { tone: AdminTone; children: ReactNode }) {
  return (
    <span
      className={cn('text-caption inline-flex items-center gap-1.5 font-medium', TONE_CLASS[tone])}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** A row of counts. Four at most; a console is not a chart gallery. */
export function AdminKpiRow({
  items,
}: {
  items: readonly { label: string; value: string; hint?: string }[];
}) {
  return (
    <dl className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} variant="outlined" className="flex flex-col gap-1 p-4">
          <dt className="text-caption text-content-muted">{item.label}</dt>
          <dd className="text-h3 text-content tabular-nums">{item.value}</dd>
          {item.hint === undefined ? null : (
            <p className="text-caption text-content-placeholder">{item.hint}</p>
          )}
        </Card>
      ))}
    </dl>
  );
}

/** Shown instead of a table when there is genuinely nothing to show. */
export function AdminEmpty({ title, detail }: { title: string; detail: string }) {
  return (
    <Card variant="outlined" className="flex flex-col gap-1 p-6">
      <p className="text-body text-content font-medium">{title}</p>
      <p className="text-caption text-content-muted">{detail}</p>
    </Card>
  );
}

/** Marks a row or record as demonstration data, wherever one is shown. */
export function DemoTag() {
  return (
    <Badge variant="neutral" size="sm">
      Demo
    </Badge>
  );
}
