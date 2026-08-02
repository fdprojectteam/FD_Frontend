'use client';

import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { CompareColumnHeader } from './compare-column-header';
import { CompareRowIcon } from './compare-row-icon';
import { CompareValue } from './compare-value';
import { BEST_HIGHLIGHT, type CompareViewProps } from './compare-view';
import { selectLabel } from '../utils/compare-labels';
import { COMPARE_ROW_EMPHASIS, isBestCell } from '../utils/compare-rows';

/**
 * CompareTable — the approved desktop comparison (M2.7, T2.7.4).
 *
 * **A real `<table>`**, not a grid of divs (checklist B1). `scope="col"` on the
 * product headers and `scope="row"` on the attribute labels is what lets a
 * screen-reader user hear "IDFC FIRST Bank, Interest Rate, 7.75%" instead of a
 * loose number; a div grid renders identically and communicates nothing.
 *
 * **One prop shape, not two** (decision F2) — `CompareViewProps`, shared with
 * the mobile presentation. `products` and `rows` are parallel arrays sharing an
 * index; iterating `products` while indexing into `values` keeps the one array
 * driving. Handing them in from separate call sites is how a transposed index
 * puts one bank's rate under another bank's name: wrong data that looks
 * entirely right.
 *
 * **Cell content is not rendered here.** `CompareValue` owns the value, the
 * empty-value substitution, the ★ and the hidden qualifier, so this table and
 * the mobile card cannot show different things. What stays here is the
 * *chrome* — and at M2.8 the chrome was redrawn.
 *
 * **The M2.8 redesign, in three moves.** (1) The winner is a **pill floating
 * inside** its cell rather than a tint filling it: an edge-to-edge fill met the
 * next row across a 1px line and hid its own corners, which is why highlighted
 * rows read as one fused block. (2) Separators are **row-level and soft** —
 * a border on every cell drew the grid instead of the data. (3) Rows carry
 * **weight**: the three money rows (`EMPHASISED_COMPARE_ROWS`) are larger and
 * heavier than benefits or eligibility, because a comparison where every row
 * shouts equally has no hierarchy. The rate is louder still — three tiers, from
 * `COMPARE_ROW_EMPHASIS`.
 *
 * None of that touches which cell wins. `isBestCell` is unchanged, and so is
 * every value it reads.
 *
 * **Presentation-only** (I3): it computes nothing, fetches nothing, and touches
 * neither the router nor the store. Which cell wins was decided by
 * `buildCompareRows` and is read through `isBestCell` — the one predicate all
 * three components share.
 */
export type CompareTableProps = CompareViewProps;

export function CompareTable({ products, rows, onRemove }: CompareTableProps) {
  return (
    // Four columns overflow below the container width; the scroller keeps the
    // table intact rather than compressing cells (risk R7, verified manually).
    <div className="flex flex-col gap-4">
      <div className="border-border-default bg-surface-card rounded-card w-full overflow-x-auto border px-2 py-2 md:px-4">
        {/*
        `table-fixed` — every product column takes an equal share of the width
        that the label column leaves, whatever the content is. Auto layout sized
        columns to their longest value, so "₹1,15,795" made one column wider
        than its neighbours and the Select buttons underneath came out different
        widths. Fixed layout makes them identical for any number of products,
        with no measurement and no JavaScript.

        `min-w` keeps four columns readable: below it the wrapper scrolls
        horizontally rather than crushing the cells (risk R7).
      */}
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left">
          <caption className="sr-only">
            Comparison of {products.length} selected Fixed Deposits
          </caption>

          <thead>
            <tr>
              {/*
              The corner cell names the attribute column ("FEATURES") rather
              than sitting empty, so the table reads as a matrix with two axes.
              It stays a `<td>`, not a `<th>`: it labels a column of labels, and
              scoping it would put a second heading in every row's context.
            */}
              <td className="text-caption text-content-muted w-56 px-6 pb-7 font-semibold tracking-wider uppercase">
                Features
              </td>
              {products.map((product) => (
                <th
                  key={product.id}
                  scope="col"
                  className="border-border-default/50 border-b border-l px-6 pt-4 pb-7"
                >
                  <CompareColumnHeader product={product} onRemove={onRemove} />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const emphasis = COMPARE_ROW_EMPHASIS[row.id];

              return (
                <tr
                  key={row.id}
                  data-row-emphasis={emphasis}
                  className="border-border-default/50 border-b last:border-b-0"
                >
                  <th
                    scope="row"
                    className={cn(
                      'text-body text-content-muted px-6 align-middle font-medium',
                      // Vertical rhythm: the louder the row, the more air it gets.
                      emphasis === 'hero' ? 'py-8' : 'py-7',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <CompareRowIcon id={row.id} className="text-content-muted size-4 shrink-0" />
                      {row.label}
                    </span>
                  </th>

                  {products.map((product, index) => {
                    const isBest = isBestCell(row, index);

                    return (
                      <td
                        key={product.id}
                        data-best={isBest ? 'true' : undefined}
                        className={cn(
                          'border-border-default/50 border-l px-8 text-center align-middle',
                          emphasis === 'hero' ? 'py-8' : 'py-7',
                        )}
                      >
                        {/*
                        The pill, not the cell. `BEST_HIGHLIGHT` carries only
                        appearance; the inline-flex box and its padding are what
                        make it float, and they belong to this view — a louder
                        row gets a larger pill, so the highlight scales with the
                        thing it is highlighting.
                      */}
                        <span
                          data-best-value={isBest ? 'true' : undefined}
                          className={cn(
                            'inline-flex items-center justify-center gap-1.5 tabular-nums',
                            emphasis === 'hero' && 'text-h2 font-semibold',
                            emphasis === 'strong' && 'text-h3 font-semibold',
                            emphasis === 'normal' && 'text-body-lg',
                            isBest
                              ? cn(
                                  BEST_HIGHLIGHT,
                                  emphasis === 'hero' ? 'px-6 py-3' : 'px-5 py-2.5',
                                )
                              : 'text-content',
                          )}
                        >
                          <CompareValue row={row} column={index} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <td />
              {products.map((product) => (
                <td
                  key={product.id}
                  className="border-border-default/50 border-l px-8 pt-10 text-center"
                >
                  {/*
                  Booking is Phase 3 (decision D3). Inert rather than absent, so
                  the approved layout is intact, and `aria-disabled` rather than
                  `disabled` so the control stays reachable and can explain
                  itself. It carries no state — there is nothing yet to carry it
                  to.
                */}
                  <Button
                    variant="secondary"
                    className="w-full"
                    aria-disabled="true"
                    aria-label={selectLabel(product.bank.name)}
                  >
                    Select
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/*
        The star is decorative in every cell (`aria-hidden`) because the hidden
        qualifier already says "Best interest rate" where it matters. This line
        is the *visual* equivalent for a sighted reader scanning the table, and
        it is deliberately not hidden: it explains a mark that would otherwise
        have to be inferred.
      */}
      <p className="text-caption text-content-muted flex items-center gap-2">
        <Star aria-hidden="true" className="size-4" />
        Starred values indicate the best offer in this comparison
      </p>
    </div>
  );
}
