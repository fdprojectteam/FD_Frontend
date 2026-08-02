'use client';

import Image from 'next/image';
import { forwardRef, useState, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import type { Bank } from '@/types/finance';

/**
 * BankBadge — a bank's visual identity (M2.2, logo support added M2.6).
 *
 * Renders the bank's logo in a circular slot, falling back to the two-letter
 * monogram (IF, HB, KM…) when there is no logo or the file fails to load.
 * Presentation-only: it receives a `Bank` and renders it, and it never builds
 * an image path — `logoUrl` arrives as data (`types/finance.ts`).
 *
 * ## Why the slot is unchanged
 *
 * The circle, its sizes, and the 12px gap to the name are exactly as before,
 * because the approved layout, spacing, and responsive behaviour must not
 * change. The logo is fitted **inside** that slot with `object-contain` and a
 * small inset, so a wide wordmark letterboxes rather than stretching — no
 * aspect-ratio distortion at any size.
 *
 * ## Client component
 *
 * It became one in M2.6: falling back when an image 404s needs an `onError`
 * handler, and therefore state. Every existing call site already sits inside a
 * client subtree, so nothing else changes.
 *
 * ## Accessibility
 *
 * The badge is **decorative by default**, which is why the wrapper keeps
 * `aria-hidden` and the image an empty `alt`. That is deliberate, not an
 * omission: at every current call site — product card, details header,
 * featured banks — the bank's name is rendered as real adjacent text, so an
 * `alt` here would make screen readers announce the same bank twice.
 *
 * Pass `decorative={false}` where a logo appears **without** an adjacent name;
 * the wrapper is then exposed and the image carries the bank name as its alt
 * text. Meaningful alternative text sometimes means no alternative text
 * (WCAG 1.1.1) — what matters is that the information reaches the user once.
 */
export interface BankBadgeProps extends HTMLAttributes<HTMLDivElement> {
  bank: Bank;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  /**
   * Set to `false` when no adjacent text names the bank, so the logo carries
   * the name for assistive technology instead.
   */
  decorative?: boolean;
}

/**
 * One slot definition per size: the box, the monogram type scale, the inset
 * that keeps a wordmark off the circle's edge, and the pixel width `next/image`
 * needs for `sizes`. Keeping them together is what stops the logo and the
 * fallback drifting apart visually.
 */
const SLOT = {
  sm: { box: 'size-8', text: 'text-caption', inset: 'p-1', px: 32 },
  md: { box: 'size-10', text: 'text-caption', inset: 'p-1', px: 40 },
  /** `lg` added in M2.6: the approved details header renders at ~56px. */
  lg: { box: 'size-14', text: 'text-body', inset: 'p-2', px: 56 },
} as const;

export const BankBadge = forwardRef<HTMLDivElement, BankBadgeProps>(
  ({ bank, size = 'md', showName = false, decorative = true, className, ...props }, ref) => {
    // A logo that 404s or fails to decode falls back for the rest of the
    // session; the monogram is always a correct answer, never a broken image.
    const [logoFailed, setLogoFailed] = useState(false);
    const slot = SLOT[size];
    const showLogo = bank.logoUrl !== null && !logoFailed;

    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)} {...props}>
        <span
          aria-hidden={decorative || undefined}
          className={cn(
            'bg-surface-muted text-content-muted relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium',
            slot.box,
            slot.text,
          )}
        >
          {showLogo ? (
            <Image
              src={bank.logoUrl as string}
              alt={decorative ? '' : bank.name}
              fill
              sizes={`${slot.px}px`}
              className={cn('object-contain', slot.inset)}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            bank.initials
          )}
        </span>
        {showName ? <span className="text-body text-content font-medium">{bank.name}</span> : null}
      </div>
    );
  },
);
BankBadge.displayName = 'BankBadge';
