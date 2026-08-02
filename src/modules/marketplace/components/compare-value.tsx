import { Star } from 'lucide-react';

import type { CompareRow } from '../types/compare';
import { bestQualifier, isBestCell, NO_VALUE } from '../utils/compare-rows';

/**
 * CompareValue — the content of one comparison cell (M2.7, T2.7.5).
 *
 * Rendered by both presentations, which is the point: the desktop table and the
 * mobile card show *identical* cell content, and before this existed the mobile
 * card would have reproduced it — two implementations of one accessibility
 * contract, able to regress independently while both suites stayed green.
 *
 * What it owns:
 *   • the value;
 *   • `NO_VALUE` → a visible em dash plus a visually-hidden "None", because an
 *     em dash is a visual mark and assistive technology must hear an absence;
 *   • the trailing ★, `aria-hidden` — decorative, the qualifier carries the
 *     meaning;
 *   • the visually-hidden qualifier, because colour and an icon cannot be the
 *     only signal that a value is best (Document 14 §11, checklist C9).
 *
 * What it deliberately does **not** own: the highlight surface. Desktop tints
 * the cell, mobile tints the whole row, so the lavender belongs to each
 * container. Content is shared because it is identical; chrome is not shared
 * because it is not.
 *
 * It takes the row and a column index rather than a pre-extracted string, so a
 * caller cannot get the extraction subtly wrong — the hazard F2 exists for.
 */
export interface CompareValueProps {
  row: CompareRow;
  column: number;
}

export function CompareValue({ row, column }: CompareValueProps) {
  const value = row.values[column] ?? '';

  return (
    <>
      {value === NO_VALUE ? (
        <>
          <span aria-hidden="true">{NO_VALUE}</span>
          <span className="sr-only">None</span>
        </>
      ) : (
        value
      )}

      {isBestCell(row, column) ? (
        <>
          {' '}
          <Star aria-hidden="true" className="inline size-4 align-text-bottom" />
          <span className="sr-only"> — {bestQualifier(row)}</span>
        </>
      ) : null}
    </>
  );
}
