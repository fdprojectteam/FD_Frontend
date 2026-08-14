import Image from 'next/image';

import { cn } from '@/lib/utils';

/**
 * The three goal illustrations.
 *
 * ## Commissioned raster artwork
 *
 * Each goal has its own approved PNG. The artwork was hand-drawn SVG until the
 * design direction changed; the scene components that drew those shapes are
 * gone rather than left dead beside the images they no longer render.
 *
 * ## What it must not claim
 *
 * Nothing. The artwork is **decorative** — `alt=""` and `aria-hidden` — and the
 * goal name and description beside it always carry the meaning. A customer who
 * cannot see the image loses nothing, and no financial claim is made by a
 * picture.
 *
 * ## Why it lives in `components/business`
 *
 * Both Marketplace (Home) and the goal module render it, and Marketplace may not
 * import the goal module — the boundary forbids it. A shared home is the only
 * legal one, and the component is presentation-only: it takes a string and
 * returns an image. No rule, no rate, no figure.
 *
 * ## Motion
 *
 * The component itself animates nothing. Hover, focus and selection transitions
 * belong to the surrounding tile in `GoalEntryList` and `GoalStep`, which apply
 * them through `className` — so reduced-motion handling stays in one place
 * rather than being duplicated per illustration.
 */
export type GoalMarkKind = 'emergency' | 'education' | 'retirement';

export interface GoalMarkProps {
  kind: GoalMarkKind;
  /**
   * The transient confirmation state, shown while navigation is already under
   * way.
   *
   * Accepted so call sites read consistently with the rest of the selection UI.
   * The artwork does not change between states — the tile around it does — so
   * nothing is derived from it here.
   */
  selected?: boolean;
  className?: string;
}

/**
 * The approved artwork, one file per goal.
 *
 * Declared here so a filename lives in exactly one place: a typo becomes one
 * broken image rather than a broken image on every screen that renders goals.
 */
const GOAL_ARTWORK: Record<GoalMarkKind, string> = {
  emergency: '/goal-emergency-fund.png',
  education: '/goal-childran-education.png',
  retirement: '/goal-retirment.png',
};

/**
 * Intrinsic size, so Next reserves the box before the image loads.
 *
 * Layout shift on a goal grid is especially visible — three tiles reflowing at
 * once — so the dimensions are stated rather than left to the browser.
 */
const ARTWORK_SIZE = 84;

export function GoalMark({ kind, className }: GoalMarkProps) {
  return (
    <Image
      src={GOAL_ARTWORK[kind]}
      alt=""
      aria-hidden="true"
      width={ARTWORK_SIZE}
      height={ARTWORK_SIZE}
      className={cn('object-contain', className)}
    />
  );
}
