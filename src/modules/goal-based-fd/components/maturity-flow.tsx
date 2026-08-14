import { cn } from '@/lib/utils';
import type { MaturityResult } from '@/types/finance';
import { formatCurrency, formatTenure } from '@/utils';

/**
 * Investment → term → estimated maturity, as one readable line.
 *
 * ## Why this is not a chart
 *
 * A growth curve would draw intermediate values the engine never produced. The
 * platform computes exactly two figures — what goes in and what comes out — so
 * that is exactly what is shown. Three labelled values and two arrows carry the
 * relationship without inventing a shape for it.
 *
 * ## Why "Estimated"
 *
 * The label is `Estimated maturity`, never `Maturity`. This figure is the
 * planner's illustration at today's published rate; Booking resolves the terms
 * the customer is actually offered. The word is the difference between an
 * illustration and a promise.
 *
 * ## Why the cells arrive in order
 *
 * `ds-stagger` reveals them along the reading axis — left to right on desktop,
 * top to bottom on mobile, following the layout. **The order is the
 * explanation**: this much, held this long, becomes this. That is the whole
 * animation, and it is the reason there is no chart here: a curve would draw
 * intermediate values the engine never produced, whereas a sequence states the
 * relationship using only the two figures that exist.
 *
 * The numerals themselves never animate. They arrive with the cell that holds
 * them and are then still — no counting, no scaling, nothing that could make a
 * projection look like it is growing.
 *
 * ## Why the chevrons became nodes
 *
 * A chevron says *next*. It does not say what kind of value each cell holds —
 * and here that is the single most important thing on the row. The marks now
 * speak the vocabulary `GoalMark` and `PlanMark` established:
 *
 * - **Filled node** on *You invest* — the amount is committed, and certain.
 * - **Open ring** on *Estimated maturity* — a projection, drawn as one.
 *
 * So the certain/estimated distinction, which until now rested entirely on the
 * word "Estimated" in a label, is carried by the shape as well. That is a
 * meaning improvement rather than a restyle, and it is the reason this row was
 * worth touching at all.
 */
export function MaturityFlow({
  principal,
  tenureMonths,
  maturity,
}: {
  principal: number;
  tenureMonths: number;
  maturity: MaturityResult;
}) {
  return (
    <div className="bg-surface-subtle rounded-card ds-stagger flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <Cell label="You invest" value={formatCurrency(principal)} node="committed" />

      <Connector />

      <Cell label="For" value={formatTenure(tenureMonths)} node="interval" />

      <Connector />

      <Cell
        label="Estimated maturity"
        value={formatCurrency(maturity.maturityValue)}
        emphasis
        node="estimated"
        note={`+${formatCurrency(maturity.interestEarned)} interest`}
      />
    </div>
  );
}

/**
 * `committed` a value the customer chose · `interval` the time between ·
 * `estimated` the figure the platform projects.
 */
type NodeKind = 'committed' | 'interval' | 'estimated';

function Cell({
  label,
  value,
  emphasis = false,
  node,
  note,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  node: NodeKind;
  note?: string;
}) {
  return (
    <div className="motion-safe:animate-reveal flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <Node kind={node} />
        <span className="text-caption text-content-muted">{label}</span>
      </span>
      <span
        className={
          emphasis
            ? 'text-numeric text-content-brand tabular-nums'
            : 'text-body text-content font-semibold tabular-nums'
        }
      >
        {value}
      </span>
      {note ? <span className="text-caption text-success">{note}</span> : null}
    </div>
  );
}

/**
 * The station marker.
 *
 * Filled for a value the customer committed, open for the one the platform
 * estimates, and a small solid dot for the interval between them — the same
 * three shapes `GoalMark` and `PlanMark` use, so a customer who saw a goal
 * drawn on Home meets the identical vocabulary here.
 */
function Node({ kind }: { kind: NodeKind }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn(
        'size-2.5 shrink-0',
        kind === 'estimated' ? 'text-content-brand' : 'text-content-placeholder',
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={6}
        cy={6}
        r={kind === 'interval' ? 2.5 : 4}
        stroke="currentColor"
        strokeWidth={2}
        /* Open only for the estimate. That is the whole point of the shape. */
        fill={kind === 'estimated' ? 'none' : 'currentColor'}
      />
    </svg>
  );
}

/**
 * The line between two stations — time passing.
 *
 * Vertical on mobile where the cells stack, horizontal from `sm` where they sit
 * in a row, following the layout rather than fighting it. It draws with the row
 * and is never slid, dashed or arrowed: it is a connective, not an effect.
 */
function Connector() {
  return (
    <span aria-hidden="true" className="text-border-strong flex shrink-0 sm:flex-1">
      <svg
        viewBox="0 0 2 16"
        preserveAspectRatio="none"
        className="ml-[3px] h-4 w-0.5 sm:hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 0 L 1 16"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="motion-safe:animate-draw"
        />
      </svg>

      <svg
        viewBox="0 0 40 2"
        preserveAspectRatio="none"
        className="hidden h-0.5 w-full sm:block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 1 L 40 1"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="motion-safe:animate-draw"
        />
      </svg>
    </span>
  );
}
