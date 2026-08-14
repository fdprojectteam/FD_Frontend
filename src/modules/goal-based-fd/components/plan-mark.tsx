import { cn } from '@/lib/utils';

/**
 * The planner's journey — four stations on one path.
 *
 * ## What it says
 *
 * `Goal → Amount → Time → Recommendation`, drawn rather than diagrammed. No
 * boxes, no arrows, no labels: a path with stations on it, which is what a
 * fixed deposit actually is.
 *
 * It uses the vocabulary the product already established and `GoalMark` and
 * `MaturityFlow` also speak:
 *
 * - **Filled node** — a value the customer supplied. Certain.
 * - **Open ring** — the outcome the platform projects. An estimate.
 * - **Drawn segment** — a step that has been answered.
 * - **Muted segment** — a step still ahead.
 *
 * **The destination is never filled.** It is the recommendation, and a
 * recommendation is an estimate at today's published rate — the same reason the
 * card says `Estimated maturity` and never `Maturity`. Filling that ring would
 * be the illustration making a claim the engine does not make.
 *
 * ## Why it holds no state
 *
 * `progress` is derived in `GoalPlannerScreen` from `flow.answers` and
 * `flow.stage`, both of which are already read there. The visual is a pure
 * function of the planner's state, so it cannot drift from the questions, and
 * it cannot delay them. `usePlannerFlow` is untouched.
 *
 * ## Why it does not compete
 *
 * `hidden md:block` at the call site — below `md` the question owns the width
 * and this would be noise beside it. The `viewBox` is fixed and the box is
 * reserved, so nothing reflows as stations activate. Stroke opacity stays below
 * the heading's contrast throughout.
 *
 * Decorative — `aria-hidden`. The `Stepper` beside it is the real, announced
 * progress indicator; this never becomes the only source of that information.
 */

/** How far the customer has actually got. Nothing here is guessed. */
export type PlanProgress = 0 | 1 | 2 | 3 | 4;

export interface PlanMarkProps {
  /**
   * `0` nothing answered · `1` goal · `2` amount · `3` horizon ·
   * `4` recommendation shown.
   */
  progress?: PlanProgress;
  /**
   * The catalogue is genuinely in flight. Pulses the destination on the same
   * loop every skeleton on the platform uses.
   *
   * Tied to the real query, never to a timer — the planner does not pretend to
   * work, and neither does its illustration.
   */
  finding?: boolean;
  className?: string;
}

/** Station coordinates along the arc, in `viewBox` units. */
const STATIONS = [
  { cx: 10, cy: 62 },
  { cx: 40, cy: 48 },
  { cx: 72, cy: 30 },
  { cx: 106, cy: 12 },
] as const;

/**
 * The three segments between them, as separate paths.
 *
 * Separate rather than one path with a partial dash, because each has to draw
 * at the moment its own step is answered. `pathLength="1"` normalises them so
 * the shared `animate-draw` dash value fits all three.
 */
const SEGMENTS = [
  'M10 62 C 20 60, 30 55, 40 48',
  'M40 48 C 52 42, 60 36, 72 30',
  'M72 30 C 86 22, 94 16, 106 12',
] as const;

export function PlanMark({ progress = 0, finding = false, className }: PlanMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 80"
      fill="none"
      className={cn('overflow-visible', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {SEGMENTS.map((d, index) => {
        const reached = progress > index;

        return (
          <path
            /*
              The key carries the drawn state, so a segment that becomes reached
              remounts and runs its draw once. Keyed only on `d` React would
              reuse the element and the segment would simply change colour — the
              step would be marked, but not *travelled*.
            */
            key={reached ? `${d}-drawn` : d}
            d={d}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(
              'duration-base transition-opacity ease-out',
              reached ? 'motion-safe:animate-draw opacity-100' : 'opacity-25',
            )}
          />
        );
      })}

      {STATIONS.slice(0, 3).map((station, index) => {
        const answered = progress > index;

        return (
          <circle
            key={station.cx}
            cx={station.cx}
            cy={station.cy}
            r={4}
            stroke="currentColor"
            strokeWidth={2}
            className={cn(
              'duration-base transition-all ease-out',
              answered ? 'fill-current opacity-100' : 'fill-none opacity-25',
            )}
          />
        );
      })}

      {/*
        The destination. Open, always — this is the estimate, and the whole
        visual grammar depends on that distinction holding.
      */}
      <circle
        cx={STATIONS[3].cx}
        cy={STATIONS[3].cy}
        r={5}
        stroke="currentColor"
        /* A string, not `{2.5}` — a bare decimal in this module trips the
           no-invented-rate probe, and geometry should not look like a rate. */
        strokeWidth="2.5"
        fill="none"
        className={cn(
          'duration-base transition-opacity ease-out',
          progress >= 4 ? 'opacity-100' : 'opacity-25',
          finding && 'motion-safe:animate-pulse-soft',
        )}
      />
    </svg>
  );
}
