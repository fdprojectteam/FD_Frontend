'use client';

import { Check, Info } from 'lucide-react';
import { useId } from 'react';

/**
 * ImportantInformation — the disclosure callout (T3.1, extended T3.2.7).
 *
 * **What it is, in regulatory terms.** These are the statements the user must
 * have seen before they start a booking: that rates come from the partner bank
 * and can change. Presenting them as a distinct, tinted region rather than as
 * another paragraph is the difference between disclosed and merely present.
 *
 * **Not `role="alert"`, not a live region.** Nothing here is urgent or new —
 * it is standing information on a screen the user just opened, and announcing
 * it as an alert would interrupt a screen-reader user reading the deposit they
 * came to check. It is a titled group instead, reachable in normal reading
 * order, with the heading naming what it is.
 *
 * **A list, even for one note.** Each statement is independent and separately
 * legible; running them into a paragraph would let a future third note be
 * buried mid-sentence. Presentation-only — the notes arrive as data, because
 * they will eventually come from the same payload as the product.
 *
 * ## Two markers, one component (T3.2.7)
 *
 * The approved Overview screen sets its notes as plain lines; the approved
 * Investment Details screen sets them with tick marks. Same card, same surface,
 * same heading — only the marker differs, so this is a `variant` rather than a
 * second component. Forking it would give the platform two places to change
 * regulatory copy styling.
 *
 * The tick is `aria-hidden`: it decorates a list item that is already a list
 * item, and announcing "check" before each statement would add nothing.
 */
export type ImportantInformationVariant = 'note' | 'checklist';

export interface ImportantInformationProps {
  notes: string[];
  /** Override for reuse on later steps, e.g. "Before you pay". */
  title?: string;
  /** `note` = plain lines (Overview) · `checklist` = tick marks (Investment Details). */
  variant?: ImportantInformationVariant;
  /**
   * Heading level, so the callout fits the outline of whatever contains it.
   *
   * Defaults to **3**. It was previously a hard `h4` directly beneath an `h2`,
   * which skips a level — a real outline defect rather than a style choice, so
   * it is corrected here rather than carried forward. Screens that render this
   * as a top-level panel in the rail pass `2`.
   */
  headingLevel?: 2 | 3 | 4;
}

export function ImportantInformation({
  notes,
  title = 'Important Information',
  variant = 'note',
  headingLevel = 3,
}: ImportantInformationProps) {
  /* Generated: two callouts on one screen would otherwise share a heading id. */
  const headingId = useId();

  if (notes.length === 0) return null;

  const Heading = `h${headingLevel}` as const;

  return (
    /*
      `bg-surface-subtle` is the platform's informational fill, and the icon
      carries no meaning the text does not — it is `aria-hidden`, and the
      heading is what a screen reader announces.
    */
    <section
      aria-labelledby={headingId}
      className="bg-surface-subtle rounded-card flex items-start gap-3 p-4"
    >
      <Info aria-hidden="true" className="text-content-brand mt-0.5 size-5 shrink-0" />

      {/* `min-w-0` so long sentences wrap inside the callout rather than widening it. */}
      <div className="flex min-w-0 flex-col gap-1">
        <Heading id={headingId} className="text-body text-content-brand font-semibold">
          {title}
        </Heading>

        <ul className="text-body text-content-muted flex list-none flex-col gap-1">
          {notes.map((note) => (
            <li
              key={note}
              className={variant === 'checklist' ? 'flex items-start gap-2' : undefined}
            >
              {variant === 'checklist' ? (
                <Check aria-hidden="true" className="text-content-brand mt-1 size-4 shrink-0" />
              ) : null}
              <span className="min-w-0">{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
