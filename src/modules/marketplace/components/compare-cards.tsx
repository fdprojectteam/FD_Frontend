import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { CompareColumnHeader } from './compare-column-header';
import { CompareRowIcon } from './compare-row-icon';
import { CompareValue } from './compare-value';
import { BEST_HIGHLIGHT, type CompareViewProps } from './compare-view';
import { selectLabel } from '../utils/compare-labels';
import { COMPARE_ROW_EMPHASIS, isBestCell, STACKED_COMPARE_ROWS } from '../utils/compare-rows';

/**
 * CompareCards — the mobile comparison (M2.7 T2.7.5, **restructured 2026-08-01**).
 *
 * **A vertical stack, not a carousel.** Each compared product is a full-width
 * card and the page scrolls, which is what mobile users already do without
 * being taught. The horizontal scroller it replaces cost a great deal for very
 * little: scroll-snap, arrows, dot indicators, a mirrored position state and a
 * swipe hint — an entire widget whose only job was to reveal content that
 * vertical scrolling reveals for free.
 *
 * What that removal buys, beyond simplicity:
 *
 *   • **no state at all.** No `useState`, no `useRef`, no scroll listener. The
 *     component is now presentation in the strictest sense (I3) — it renders
 *     props and reports a removal upward;
 *   • **no off-screen content.** The carousel kept every card in the DOM and in
 *     the accessibility tree precisely because some were visually hidden; a
 *     stack has nothing hidden to reason about, so the `aria-hidden`/`inert`
 *     question disappears rather than being answered carefully;
 *   • **no position to announce.** The polite status existed to tell a screen
 *     reader where the viewport had moved. Scrolling a page needs no narration.
 *
 * **Still not the table reflowed.** This is a second *presentation* of the same
 * model, reading `rows` column-major where the table reads it row-major. Same
 * `CompareViewProps`, same `CompareValue`, same `isBestCell`, same
 * `BEST_HIGHLIGHT` — which is what stops the two drifting.
 *
 * **The winner is a pill on the value**, matching the table (supersedes
 * checklist D4, which tinted the whole row). Nothing inside the pill re-declares
 * a colour: tailwind-merge resolves conflicting classes on one element, not
 * across two, which is how the mobile highlight once silently lost its brand
 * text.
 */
export type CompareCardsProps = CompareViewProps;

export function CompareCards({
  products,
  rows,
  onRemove,
  belowMinimumIds = [],
  selectedProductId = null,
  onSelect,
}: CompareCardsProps) {
  return (
    <ul className="flex list-none flex-col gap-5">
      {products.map((product, column) => (
        <li key={product.id}>
          <article className="border-border-default bg-surface-card rounded-card shadow-elevation-1 flex flex-col gap-5 border p-6">
            <CompareColumnHeader
              product={product}
              onRemove={onRemove}
              belowMinimum={belowMinimumIds.includes(product.id)}
            />

            <div className="flex flex-col gap-1">
              {rows.map((row) => {
                const stacked = STACKED_COMPARE_ROWS.includes(row.id);
                const emphasis = COMPARE_ROW_EMPHASIS[row.id];
                const isBest = isBestCell(row, column);

                return (
                  <div
                    key={row.id}
                    data-row-layout={stacked ? 'stacked' : 'inline'}
                    data-best={isBest ? 'true' : undefined}
                    className={cn(
                      'border-border-default/40 text-content flex border-b px-1 py-3 last:border-b-0',
                      stacked ? 'flex-col gap-2' : 'flex-row items-center justify-between gap-4',
                    )}
                  >
                    <span className="text-caption text-content-muted flex items-center gap-2 font-medium">
                      <CompareRowIcon id={row.id} className="size-4 shrink-0" />
                      {row.label}
                    </span>

                    <span
                      data-best-value={isBest ? 'true' : undefined}
                      className={cn(
                        'inline-flex items-center gap-1.5 tabular-nums',
                        emphasis === 'normal' ? 'text-body-lg' : 'text-h3 font-semibold',
                        isBest ? cn(BEST_HIGHLIGHT, 'px-4 py-1.5') : 'text-content',
                      )}
                    >
                      <CompareValue row={row} column={column} />
                    </span>
                  </div>
                );
              })}
            </div>

            {/*
              Booking's entry point from Comparison. It **chooses**, it does not
              navigate: `CompareActionBar` carries the single "Proceed to
              Booking" affordance, as the approved screen draws it, so there is
              one destination rather than one per column.

              `aria-pressed` rather than a disabled state — the control is a
              toggle now, and the pressed state is what tells a screen-reader
              user which product the bottom action will book.
            */}
            <Button
              variant={selectedProductId === product.id ? 'primary' : 'secondary'}
              className="w-full"
              aria-pressed={selectedProductId === product.id}
              aria-label={selectLabel(product.bank.name)}
              onClick={() => onSelect?.(product.id)}
            >
              {selectedProductId === product.id ? 'Selected' : 'Select'}
            </Button>
          </article>
        </li>
      ))}
    </ul>
  );
}
