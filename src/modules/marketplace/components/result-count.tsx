import type { PaginationMeta } from '@/types/pagination';

/**
 * ResultCount — "Showing 1–6 of 24 products" (M2.4).
 *
 * Announced politely: when a screen-reader user changes sort or page,
 * nothing else signals that the result set changed (approved decision D5).
 *
 * The element is always rendered, empty included. A live region has to be
 * in the DOM *before* its content changes for assistive technology to
 * observe the mutation; mounting it together with the first result meant
 * the first announcement was silently dropped (M2.4 audit, defect L8).
 *
 * The range is clamped to the total. An out-of-range deep link (?page=99)
 * is corrected within a tick, but the uncorrected render still reaches the
 * live region first, and unclamped arithmetic announced an incoherent
 * "Showing 589–24 of 24 products" (M2.4 audit, defect M7).
 *
 * The page comes from the URL and only `limit`/`total` come from the
 * response. Deriving the position from `meta.page` made the announcement lag
 * a page behind while `keepPreviousData` held the previous result on screen
 * (M2.4 audit, defect A4).
 */
export interface ResultCountProps {
  /** Current page — owned by the URL, never by the response (invariant I1). */
  page: number;
  /** Server-owned totals. Absent until the first response arrives. */
  meta?: PaginationMeta;
}

function label(page: number, meta: PaginationMeta): string {
  if (meta.total === 0) return 'No products found';

  const from = Math.min((page - 1) * meta.limit + 1, meta.total);
  const to = Math.min(page * meta.limit, meta.total);

  return `Showing ${from}–${to} of ${meta.total} products`;
}

export function ResultCount({ page, meta }: ResultCountProps) {
  return (
    <p role="status" aria-live="polite" className="text-caption text-content-muted min-h-5">
      {meta ? label(page, meta) : null}
    </p>
  );
}
