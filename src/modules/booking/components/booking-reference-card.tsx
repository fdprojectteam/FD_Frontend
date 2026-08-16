'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * The booking reference, with a copy affordance (specs 21h §5E, 21i §5B).
 *
 * The one string a customer is likely to write down or quote to support, so it
 * is rendered large, in a monospaced-tabular setting, and is copyable in one
 * press rather than requiring a careful drag across nineteen characters.
 *
 * **The confirmation is announced, not just drawn.** `role="status"` on the
 * feedback means a screen-reader user learns the copy succeeded; a tick that
 * only appears visually would leave them pressing the button again.
 *
 * Degrades quietly: where the clipboard API is unavailable or refused, the
 * button reports nothing and the reference is still selectable text.
 */
export function BookingReferenceCard({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard
      ?.writeText(reference)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {
        // Clipboard unavailable or denied. The reference remains selectable.
      });
  };

  return (
    <div className="bg-surface-brand-subtle/50 flex flex-col items-center gap-2 rounded-lg p-5">
      <p className="text-caption text-content-muted">Reference Number</p>

      <div className="flex items-center gap-2">
        <p className="text-h3 text-content-brand font-semibold tracking-wide tabular-nums">
          {reference}
        </p>

        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy reference number">
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>

      <p role="status" className="text-caption text-success min-h-4">
        {copied ? 'Reference number copied' : ''}
      </p>
    </div>
  );
}
