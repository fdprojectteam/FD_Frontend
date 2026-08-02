import { DEFAULT_SORT, RATE_BANDS, SORT_OPTIONS, TENURE_OPTIONS } from '../constants/filters';
import type { MarketplaceUrlValues, SortOption } from '../types/filters';

/**
 * Marketplace URL parsing and merging (M2.5) — the pure half of
 * `useMarketplaceUrlState`.
 *
 * Extracted from the hook for the same reason `toProductListParams` is a
 * standalone function: the URL contract is the part most likely to break
 * silently, and inside a React hook it can only be verified by rendering
 * something. Here it is directly assertable — parse, merge, canonicalise.
 *
 * The hook keeps what genuinely belongs to React: reading `useSearchParams`,
 * and being the single caller of `router.replace()` (invariants I1, I2a).
 * Nothing here navigates.
 *
 * The approved parameter set is closed at eight keys:
 *   q  amount  tenure  bank  minRate  page  sort  order
 */
export const PAGE_PARAM = 'page';
export const SORT_PARAM = 'sort';
export const ORDER_PARAM = 'order';

/** Longest query we will carry; anything beyond is a pasted accident. */
const MAX_QUERY_LENGTH = 100;
/** Bank ids are slugs (`hdfc`, `idfc-first`) — anything else is not an id. */
const BANK_ID_PATTERN = /^[a-z0-9-]{1,64}$/i;

function parsePage(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

/** Unknown sort/order combinations fall back to the default (rule 6). */
function parseSort(sortRaw: string | null, orderRaw: string | null): SortOption {
  const match = SORT_OPTIONS.find(
    (option) => option.field === sortRaw && option.order === orderRaw,
  );
  return match ?? DEFAULT_SORT;
}

function parseQuery(raw: string | null): string {
  return (raw ?? '').trim().slice(0, MAX_QUERY_LENGTH);
}

/**
 * Amount is a *free* numeric input in the approved search panel, so it is
 * validated as a positive integer rather than against AMOUNT_PRESETS. A
 * hand-typed ₹75,000 is legitimate; it simply presses no Amount chip.
 */
function parseAmount(raw: string | null): string {
  const digits = (raw ?? '').trim();
  if (!/^\d{1,12}$/.test(digits)) return '';
  return Number(digits) > 0 ? String(Number(digits)) : '';
}

/**
 * Tenure and minRate are validated against the approved option sets, not
 * merely for type. A value the UI cannot produce would render a state the UI
 * cannot display or clear — one URL with no corresponding screen, which is
 * exactly what I7 exists to prevent.
 */
function parseOneOf(raw: string | null, allowed: readonly { value: number }[]): string {
  const value = (raw ?? '').trim();
  return allowed.some((option) => String(option.value) === value) ? value : '';
}

/**
 * Bank is validated *syntactically* only. Whether an id exists is a data
 * question, and the URL layer must not fetch (invariant I5). A well-formed but
 * unknown id reaches the API, returns zero results, and lands in the empty
 * state with a clear-filters action — visible and recoverable, not swallowed.
 */
function parseBank(raw: string | null): string {
  const value = (raw ?? '').trim();
  return BANK_ID_PATTERN.test(value) ? value : '';
}

/**
 * Read-side normalisation. Never navigates: I7 canonicalisation is
 * **write-only** (approved), so a non-canonical or hostile URL renders a valid
 * screen without rewriting itself in front of the user.
 */
export function parseMarketplaceUrlValues(params: URLSearchParams): MarketplaceUrlValues {
  return {
    q: parseQuery(params.get('q')),
    amount: parseAmount(params.get('amount')),
    tenure: parseOneOf(params.get('tenure'), TENURE_OPTIONS),
    bank: parseBank(params.get('bank')),
    minRate: parseOneOf(params.get('minRate'), RATE_BANDS),
    page: parsePage(params.get(PAGE_PARAM)),
    sort: parseSort(params.get(SORT_PARAM), params.get(ORDER_PARAM)),
  };
}

/**
 * Canonical serialisation — the whole of I7 in one function.
 *
 * Emits the eight approved parameters, in the approved order (decision D2),
 * omitting anything at its default. Because it writes from *parsed values*
 * rather than editing the incoming query string, three things follow that a
 * key-by-key edit cannot give:
 *
 *   • redundant defaults elsewhere in the URL are dropped too, so
 *     `?sort=interestRate&order=desc` collapses to `/` on the next write —
 *     not only the key the user happened to touch;
 *   • parameter order is fixed, so one state has one URL down to the byte;
 *   • no key outside the approved set can survive a write, which makes D2's
 *     closed parameter set a property of the code.
 */
function serialiseMarketplaceValues(values: MarketplaceUrlValues): string {
  const params = new URLSearchParams();

  if (values.q) params.set('q', values.q);
  if (values.amount) params.set('amount', values.amount);
  if (values.tenure) params.set('tenure', values.tenure);
  if (values.bank) params.set('bank', values.bank);
  if (values.minRate) params.set('minRate', values.minRate);
  if (values.page > 1) params.set(PAGE_PARAM, String(values.page));
  if (values.sort.id !== DEFAULT_SORT.id) {
    params.set(SORT_PARAM, values.sort.field);
    params.set(ORDER_PARAM, values.sort.order);
  }

  return params.toString();
}

/**
 * Write-side merge: read-then-merge from the *current* params (rule 1), then
 * canonicalise the complete result (rule 3 / I7).
 *
 * Returns a query string, not a URL — composing the href is the hook's job,
 * because only the hook knows the pathname and only the hook navigates.
 */
export function mergeMarketplaceParams(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  return serialiseMarketplaceValues(parseMarketplaceUrlValues(params));
}
