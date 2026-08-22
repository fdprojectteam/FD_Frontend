'use client';

import { ChevronDown, Lock } from 'lucide-react';
import { useId, useState } from 'react';

/**
 * Why the platform needs this, and how it is protected.
 *
 * ## Progressive disclosure, deliberately
 *
 * One reassuring line is visible; the detail is one tap away. A wall of legal
 * text on an identity screen does the opposite of reassuring — it is skipped,
 * and it makes the step feel like an obstacle rather than a formality.
 *
 * ## A real `<details>`, not a div that toggles
 *
 * It is keyboard-operable, announced as a disclosure, and works before
 * JavaScript has run. The chevron is decorative; the summary text carries the
 * meaning and the open state is exposed by the element itself.
 */
export function IdentityAssurance() {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="border-border-default rounded-card bg-surface-subtle border p-4 md:p-5">
      <p className="text-body text-content flex items-start gap-2.5">
        <Lock aria-hidden="true" className="text-content-brand mt-0.5 size-4 shrink-0" />
        Your details are used only to verify who you are and to complete this Fixed Deposit
        application.
      </p>

      <details
        className="mt-3"
        open={open}
        onToggle={(event) => {
          setOpen(event.currentTarget.open);
        }}
      >
        <summary className="focus-ring text-body text-content-brand inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md font-medium">
          How is my information protected?
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </summary>

        <ul
          id={contentId}
          className="text-body text-content-muted mt-3 flex list-none flex-col gap-2"
        >
          <li>Your details are sent over an encrypted connection.</li>
          <li>We show only the last few characters of your PAN, never the full number.</li>
          <li>We share your details with the partner bank solely to open this deposit.</li>
          <li>You can ask us to correct anything that is wrong before you continue.</li>
        </ul>
      </details>
    </div>
  );
}
