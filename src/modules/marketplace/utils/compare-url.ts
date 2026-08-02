import type { Route } from 'next';

import { ROUTES } from '@/constants/routes';

/**
 * `/compare` URL parsing and merging (M2.7, T2.7.2) — the pure half of
 * `useCompareUrlState`.
 *
 * The same three steps as `url-values.ts`, for a route whose approved
 * parameter set is closed at **one** key: parse → merge → serialise *from
 * parsed values*. Serialising from values rather than editing the incoming
 * query is what makes the closed set a property of the code: no parameter
 * outside it can survive a write.
 *
 * Returns a query string, never a URL — composing the href is the hook's job,
 * because only the hook knows the pathname and only the hook navigates.
 *
 * **This module does not cap the selection.** Four is a business rule and it
 * belongs to `useCompareSelection` alone (compare-state contract C2, O1). A cap
 * here would let the pure layer and the store disagree about what "full" means,
 * which is precisely what one owner exists to prevent. Five ids parse intact.
 */

/** The one approved parameter on this route. */
export const IDS_PARAM = 'ids';

/**
 * Hygiene bound on the raw value, mirroring `MAX_QUERY_LENGTH` on `q`.
 *
 * This is **not** the cap: it protects the parser from an abusive URL, where
 * the cap decides how many products may be compared. Keeping the two distinct
 * is what lets each rule live in exactly one place.
 */
const MAX_IDS_LENGTH = 512;

/**
 * Product ids are slugs (`fd-001`). Validation is **syntactic only**: whether
 * an id exists is a data question, and the URL layer must not fetch (I5). A
 * well-formed but unknown id reaches the batch, is absent from the response,
 * and is dropped from the URL as a correction (I8).
 */
const PRODUCT_ID_PATTERN = /^[a-z0-9-]{1,64}$/i;

/**
 * Read-side normalisation. Never navigates: I7 canonicalisation is write-only,
 * so a hostile or non-canonical URL renders a valid screen without rewriting
 * itself in front of the user.
 *
 * Duplicates resolve to their **first** occurrence, which preserves column
 * order — the order the user can see, and the order that decides the
 * leftmost-tie winner in `buildCompareRows`.
 */
export function parseCompareIds(params: URLSearchParams): string[] {
  const raw = (params.get(IDS_PARAM) ?? '').slice(0, MAX_IDS_LENGTH);
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const entry of raw.split(',')) {
    const id = entry.trim();
    if (!PRODUCT_ID_PATTERN.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

/**
 * Canonical serialisation — I7 for this route.
 *
 * An empty selection emits an empty query, so the canonical empty comparison is
 * `/compare` rather than `/compare?ids=`.
 *
 * The query is composed directly rather than through `URLSearchParams`, which
 * percent-encodes the separator (`ids=a%2Cb`). Every id has already been
 * validated against `PRODUCT_ID_PATTERN`, so nothing here needs escaping, and
 * the emitted form matches the approved `?ids=a,b,c` exactly — one state, one
 * URL, down to the byte.
 */
export function serialiseCompareIds(ids: string[]): string {
  return ids.length > 0 ? `${IDS_PARAM}=${ids.join(',')}` : '';
}

/**
 * Write-side merge: read-then-merge from the *current* params (rule 1), then
 * canonicalise the complete result (I7).
 *
 * `next` is the caller's intended list; it is run back through the parser, so a
 * duplicate or a malformed id cannot enter the URL by way of a write.
 */
export function mergeCompareParams(current: URLSearchParams, next: string[]): string {
  const params = new URLSearchParams(current.toString());

  if (next.length === 0) {
    params.delete(IDS_PARAM);
  } else {
    params.set(IDS_PARAM, next.join(','));
  }

  return serialiseCompareIds(parseCompareIds(params));
}

/**
 * The href for a comparison of `ids` (T2.7.3b).
 *
 * On `/compare` the URL *is* the selection (C4), so a bare `/compare` renders
 * the empty state however many products are selected elsewhere. Any affordance
 * navigating there must therefore carry `?ids=` — and it is composed here, in
 * the module that already owns the parameter's name and its canonical form,
 * rather than in the screen that happens to link.
 *
 * `typedRoutes` cannot statically check a runtime query string; the cast is the
 * same one both URL writers make, for the same reason.
 */
export function compareHref(ids: string[]): Route {
  const query = serialiseCompareIds(ids);
  return (query ? `${ROUTES.compare}?${query}` : ROUTES.compare) as Route;
}
