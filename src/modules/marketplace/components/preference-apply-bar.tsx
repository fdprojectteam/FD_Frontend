import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * PreferenceApplyBar — the "these edits are not live yet" row that closes an
 * Investment Preferences section (Comparison Experience Refinement,
 * 2026-08-02).
 *
 * **Why the section needs a row of its own.** Once editing and applying are
 * separated, the screen has a state it never had before: what is *in the fields*
 * and what is *in the results* disagree. That is a promise the interface has to
 * keep visible — a user who types a new deposit, glances down at unchanged
 * figures and finds no explanation has been shown stale numbers, which on an
 * investment screen is worse than a flickering table. So the status and the
 * action that resolves it sit together, directly beneath the fields that caused
 * it and directly above the results it governs.
 *
 * **One live region, two states, no timers.** The status text is a single
 * `role="status"` element that reads either "Changes not applied" or the amount
 * currently being compared. Applying therefore *announces itself* — the region's
 * content changes from the pending message to the settled one, and a screen
 * reader hears the confirmation without a transient toast that has to be
 * scheduled, cleared, and kept from stacking.
 *
 * **The action is present only while there is something to apply** (brief step 5
 * and 6), and disabled when the draft cannot be applied at all — an unparseable
 * amount is a pending change whose explanation is the field's own error, so the
 * button greys rather than vanishes. The row keeps its height either way, so the
 * results below it never move when the button appears.
 *
 * **Presentation-only** (I3) and **preference-agnostic**: it takes labels and a
 * callback, and knows nothing about deposits, comparisons, or what applying
 * does. A Tenure-only section, or a future Booking preferences panel, uses it
 * unchanged.
 */
export interface PreferenceApplyBarProps {
  /** There are unapplied edits — shows the status message and the action. */
  pending: boolean;
  /** The edits can actually be applied; when false the action is disabled. */
  canApply: boolean;
  /** Shown while `pending`, e.g. "Changes not applied". */
  pendingLabel: string;
  /** Shown when settled, e.g. "Comparing at ₹5,00,000". */
  settledLabel: string;
  /** The action's label, e.g. "Update Comparison". */
  actionLabel: string;
  onApply: () => void;
}

export function PreferenceApplyBar({
  pending,
  canApply,
  pendingLabel,
  settledLabel,
  actionLabel,
  onApply,
}: PreferenceApplyBarProps) {
  return (
    /*
      `min-h-11` is the default button height below `md`, so the row is already
      as tall as the control it may show. Reserving it here rather than letting
      the row grow is what makes the button's arrival calm: nothing below the
      preferences shifts by 44px the moment a user touches the field.
    */
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p
        role="status"
        aria-live="polite"
        className={cn('text-caption', pending ? 'text-content font-medium' : 'text-content-muted')}
      >
        {pending ? (
          <>
            {/*
              A dot, not an icon, and the *text* carries the state rather than
              the colour: an unapplied edit is not a validation failure, and
              `--ds-color-warning` (amber-500) does not meet AA as a text colour
              on the page surface. So the dot is decorative and the message is
              full-strength content — visibly weightier than the settled line
              beside nothing at all.
            */}
            <span
              aria-hidden="true"
              className="bg-warning mr-2 inline-block size-1.5 rounded-full align-middle"
            />
            {pendingLabel}
          </>
        ) : (
          settledLabel
        )}
      </p>

      {/*
        Default size, not `sm`: this is a primary action a user reaches for on a
        phone, and `sm` is 32px — below `--ds-touch-target-min`, and reserved by
        the primitive for pointer-dense desktop contexts.
      */}
      {pending ? (
        <Button variant="primary" disabled={!canApply} onClick={onApply}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
