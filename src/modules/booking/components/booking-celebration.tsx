'use client';

import { useMemo, useState } from 'react';

/**
 * A brief celebration on the Success screen.
 *
 * ## Why it is deliberately small
 *
 * The customer has just committed money and the thing they came to read is
 * their reference number. A celebration that competes with that is working
 * against the screen. So: one short fall, muted brand tones, no sound, no
 * repetition, and it removes itself.
 *
 * ## It runs once, and cannot re-run on a render
 *
 * The pieces are generated in a `useState` initialiser and never regenerated,
 * so a parent re-render — a query resolving, a draft updating — cannot restart
 * it. A timeout unmounts them once the animation has finished, so nothing is
 * left animating behind the content.
 *
 * ## Reduced motion is handled twice
 *
 * The component renders **nothing at all** when the preference is set, and the
 * CSS would collapse the animation anyway under the global rule. Two guards
 * because one of them is a media query the user can change mid-session.
 *
 * ## No dependency
 *
 * Twelve absolutely-positioned spans and one keyframe. A confetti library for
 * this would be a package, a bundle cost and a third-party animation loop for
 * something the design system already expresses.
 */

/** Kept low: this is an acknowledgement, not a party. */
const PIECE_COUNT = 12;

/** Brand-family tones only, so the moment stays inside the product's language. */
const PIECE_TONES = [
  'var(--ds-surface-brand)',
  'var(--ds-color-primary)',
  'var(--ds-color-success)',
] as const;

interface Piece {
  id: number;
  left: number;
  /** Multiples of the platform's stagger token — never a literal duration. */
  delayStep: number;
  drift: number;
  spin: number;
  size: number;
  tone: string;
}

function createPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, index) => ({
    id: index,
    /* Spread across the width rather than randomly clustered. */
    left: 6 + (index * 88) / (PIECE_COUNT - 1),
    delayStep: index % 4,
    drift: (index % 2 === 0 ? 1 : -1) * (10 + (index % 5) * 6),
    spin: 140 + (index % 3) * 90,
    size: index % 3 === 0 ? 10 : 7,
    tone: PIECE_TONES[index % PIECE_TONES.length] ?? PIECE_TONES[0],
  }));
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function BookingCelebration() {
  /*
    Generated once. Regenerating on render is what would make the celebration
    restart every time anything above it changed.
  */
  const [pieces] = useState<Piece[]>(createPieces);
  const [isVisible, setIsVisible] = useState(true);

  const reduced = useMemo(prefersReducedMotion, []);

  if (reduced || !isVisible) return null;

  return (
    /*
      Decorative and inert: `aria-hidden` and `pointer-events-none`, so it is
      absent from the accessibility tree and cannot intercept a tap on the
      reference number underneath it.
    */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-booking-celebration=""
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          /*
            The last piece unmounts the whole thing when its animation ends.
            No timer, and — deliberately — **no duration stated anywhere in this
            file**: retiming the keyframe in the token layer retimes the cleanup
            with it, and there is no literal to fall out of step.
          */
          onAnimationEnd={
            piece.id === pieces.length - 1
              ? () => {
                  setIsVisible(false);
                }
              : undefined
          }
          className="animate-celebrate absolute top-0 block rounded-[2px]"
          style={{
            left: `${String(piece.left)}%`,
            width: `${String(piece.size)}px`,
            height: `${String(piece.size * 1.6)}px`,
            backgroundColor: piece.tone,
            animationDelay: `calc(var(--ds-duration-stagger) * ${String(piece.delayStep)})`,
            ['--ds-celebrate-drift' as string]: `${String(piece.drift)}px`,
            ['--ds-celebrate-spin' as string]: `${String(piece.spin)}deg`,
          }}
        />
      ))}
    </div>
  );
}
