'use client';

import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/**
 * One reviewable section of the booking (spec 21f §5A–C).
 *
 * A heading, an Edit affordance, and a grid of labelled values. Four instances
 * on the Review screen, so it is a component rather than four repetitions of
 * the same markup.
 *
 * **Edit is a button, not a link.** It returns the customer to a step, which is
 * a navigation the screen performs through `useBookingStep` — the same guard
 * and the same route map every other transition uses. A raw `<Link>` here would
 * be a second way to move between booking steps, and there is deliberately one.
 *
 * Spec 21f §8 Rule 4: returning to an earlier step must not lose what was
 * entered. That is a property of the draft, which is seated on the layout and
 * survives the trip; this component only has to navigate.
 */
export interface ReviewField {
  label: string;
  value: ReactNode;
}

export interface ReviewSectionProps {
  icon: ReactNode;
  title: string;
  fields: ReviewField[];
  editLabel: string;
  onEdit: () => void;
  /** Extra content under the grid — e.g. the verified-account badge. */
  children?: ReactNode;
}

export function ReviewSection({
  icon,
  title,
  fields,
  editLabel,
  onEdit,
  children,
}: ReviewSectionProps) {
  return (
    <section className="border-border-default/60 flex flex-col gap-4 border-b py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-surface-brand-subtle text-content-brand flex size-9 shrink-0 items-center justify-center rounded-full">
            {icon}
          </span>
          <h2 className="text-body-lg text-content font-semibold">{title}</h2>
        </div>

        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={editLabel}>
          <Pencil aria-hidden="true" className="size-3.5" />
          Edit
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
        {fields.map((field) => (
          <div key={field.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-caption text-content-muted">{field.label}</dt>
            <dd className="text-body text-content font-semibold">{field.value}</dd>
          </div>
        ))}
      </dl>

      {children}
    </section>
  );
}
