import { formatCurrency, formatRate, formatTenure } from './format';
import type { CompareRow, CompareRowId } from '../types/compare';
import type { ProductDetails } from '../types/product';

/**
 * buildCompareRows — the comparison table's row model (M2.7, T2.7.1).
 *
 * The M2.7 analogue of `toProductListParams`: **one pure function** that is the
 * only place deciding row order, cell formatting, and which cell wins. Both
 * approved presentations consume its output — the desktop table reads it
 * row-major, the mobile card reads the same array column-major
 * (`rows.map(row => row.values[column])`) — so a change here moves both, and
 * neither can drift from the other.
 *
 * Pure and React-free, so every rule is assertable without rendering.
 *
 * **It computes no money.** Interest Earned and Maturity Value are read from
 * `estimatedReturns`, which `ProductService` derives once via `calculateMaturity`
 * on the reference amount. Recomputing them here would be a second opinion
 * about a figure the service already owns (Document 07 §15).
 *
 * Input is `ProductDetails` rather than `ProductSummary` because the approved
 * Eligibility row reads `eligibility`, which exists only on the details payload
 * (T2.7.1a).
 */

type Direction = 'highest' | 'lowest';

interface RowSpec {
  id: CompareRowId;
  label: string;
  format: (product: ProductDetails) => string;
  /**
   * Absent when the row has no winner. Tenure is the deliberate one: neither a
   * shorter nor a longer deposit is better in general, so the approved screen
   * leaves it unhighlighted while every other numeric row is marked. Benefits
   * and Eligibility are unordered text.
   */
  winner?: {
    /** The **number** the comparison is decided on — never the formatted string. */
    metric: (product: ProductDetails) => number;
    direction: Direction;
  };
}

/** Approved separator for the Benefits cell: "Loan against FD · Auto-renewal". */
const BENEFIT_SEPARATOR = ' · ';

/**
 * Shown when a product has no benefits (assumption A9). The approved screens
 * never show this case — every product has at least one benefit — but a blank
 * cell in a comparison reads as a rendering fault rather than as an absence.
 *
 * Exported so a presentation can *recognise* it: an em dash is a visual mark,
 * and a screen reader either skips it or announces "em dash". Neither says "no
 * benefits", so the table shows this and announces "None" instead (F3). The
 * alternative — matching a bare `'—'` literal in the component — would put the
 * model's sentinel in two places.
 */
export const NO_VALUE = '—';

function formatBenefits(product: ProductDetails): string {
  if (product.benefits.length === 0) return NO_VALUE;
  return product.benefits.map((benefit) => benefit.label).join(BENEFIT_SEPARATOR);
}

/**
 * "Resident, 18+" (approved UI). The long sentence in `eligibility.summary` is
 * the details page's form of the same facts; a comparison cell has room for
 * neither it nor a second line.
 */
function formatEligibility(product: ProductDetails): string {
  const { residency, minAge } = product.eligibility;
  return `${residency}, ${minAge}+`;
}

/**
 * Row order is declared once, here, and is the order both presentations
 * render. Adding a row is one entry; reordering this array reorders the
 * desktop table and the mobile card together, which is intended.
 */
const ROWS: readonly RowSpec[] = [
  {
    id: 'interestRate',
    label: 'Interest Rate',
    format: (product) => formatRate(product.interestRate),
    winner: { metric: (product) => product.interestRate, direction: 'highest' },
  },
  {
    id: 'tenure',
    label: 'Tenure',
    format: (product) => formatTenure(product.tenureMonths),
  },
  {
    id: 'minInvestment',
    label: 'Minimum Investment',
    format: (product) => formatCurrency(product.minInvestment),
    // Lowest wins: a smaller entry ticket is the better offer.
    winner: { metric: (product) => product.minInvestment, direction: 'lowest' },
  },
  {
    id: 'interestEarned',
    label: 'Interest Earned',
    format: (product) => formatCurrency(product.estimatedReturns.interestEarned),
    winner: { metric: (product) => product.estimatedReturns.interestEarned, direction: 'highest' },
  },
  {
    id: 'maturityValue',
    label: 'Maturity Value',
    format: (product) => formatCurrency(product.estimatedReturns.maturityValue),
    winner: { metric: (product) => product.estimatedReturns.maturityValue, direction: 'highest' },
  },
  { id: 'benefits', label: 'Benefits', format: formatBenefits },
  { id: 'eligibility', label: 'Eligibility', format: formatEligibility },
];

/**
 * The index of the winning column, or null when the row does not distinguish
 * the products.
 *
 * Two properties fall out of the implementation rather than being special-cased:
 *
 *   • **Ties resolve to the leftmost column.** The scan replaces the incumbent
 *     only on a *strict* improvement, so an equal value never displaces an
 *     earlier one. The approved screen shows this: HDFC and IDFC are both at
 *     ₹10,000 and only HDFC is marked.
 *
 *   • **Fewer than two distinct values means no winner** (assumption A8). One
 *     product has one value, so nothing is highlighted — which is what A6 asks
 *     for, without a separate branch for it. Three products with identical
 *     rates are covered by the same rule: marking one of them "best" would be
 *     noise presented as information.
 */
function pickBest(metrics: readonly number[], direction: Direction): number | null {
  if (new Set(metrics).size < 2) return null;

  const best = metrics.reduce<{ index: number; value: number } | null>(
    (incumbent, value, index) => {
      if (!incumbent) return { index, value };
      const improved = direction === 'highest' ? value > incumbent.value : value < incumbent.value;
      return improved ? { index, value } : incumbent;
    },
    null,
  );

  return best?.index ?? null;
}

/**
 * The visually-hidden qualifier a winning cell carries (F1).
 *
 * Colour and a ★ cannot be the only signal that a value is best (Document 14
 * §11, checklist C9), so each highlighted cell announces *why* it is
 * highlighted. Derived here, next to the labels it is built from, because both
 * the desktop table and the mobile card need the same sentence — and two
 * components composing it independently is one copy edit away from drift.
 */
export function bestQualifier(row: CompareRow): string {
  return `Best ${row.label.toLowerCase()}`;
}

/**
 * Whether a cell is the winning one (T2.7.5, review finding 1).
 *
 * Three components ask this: `CompareValue` (star and hidden qualifier),
 * `CompareTable` (cell tint) and `CompareCards` (whole-row tint). The surface
 * belongs to each presentation's container and the content to the shared unit,
 * so without one predicate the same rule would be written three times — and its
 * failure mode is *partial* application: a cell tinted without a star, or
 * starred without a tint, with both presentations still passing their own
 * assertions.
 *
 * Owned by the row model, because whether a cell wins is a fact about the row
 * rather than about how either presentation draws it.
 */
export function isBestCell(row: CompareRow, column: number): boolean {
  return row.bestIndex === column;
}

/**
 * The rows the approved mobile card stacks label-above-value; every other row
 * puts the value on the same line (checklist D5).
 *
 * Row vocabulary lives with the rows, so a row added later is defined and
 * classified in one file. Typed as `CompareRowId` — the reason C3 narrowed it —
 * so a misspelling fails to compile rather than silently un-stacking a row.
 *
 * Deliberately **not** a `layout` field on `CompareRow`: that type is a model,
 * layout is presentation, and one presentation hint in a model invites the next.
 */
/**
 * How loudly each row speaks (M2.8 redesign).
 *
 * A presentation taxonomy, exactly like `STACKED_COMPARE_ROWS` — it says
 * nothing about which value wins and nothing about what a value means. It
 * exists because a comparison where every row shouts equally has no hierarchy,
 * and the decision actually turns on the rate first, then the money.
 *
 * Three tiers, not two: the rate is the *headline* a saver compares on, the
 * two money rows are what confirms it, and everything else is qualifying
 * detail. Typed as a total `Record`, so adding a row to `CompareRowId` fails to
 * compile until someone decides how loud it is — the same trick the row union
 * itself plays.
 */
export type CompareRowEmphasis = 'hero' | 'strong' | 'normal';

export const COMPARE_ROW_EMPHASIS: Record<CompareRowId, CompareRowEmphasis> = {
  interestRate: 'hero',
  interestEarned: 'strong',
  maturityValue: 'strong',
  tenure: 'normal',
  minInvestment: 'normal',
  benefits: 'normal',
  eligibility: 'normal',
};

export const STACKED_COMPARE_ROWS: readonly CompareRowId[] = ['benefits', 'eligibility'];

/**
 * Builds every row of the comparison table from the products in **column
 * order** — the user's selection order, which the leftmost-tie rule depends on.
 *
 * Returns `[]` for an empty selection: what an empty comparison should show is
 * the screen's decision, not this function's.
 */
export function buildCompareRows(products: readonly ProductDetails[]): CompareRow[] {
  if (products.length === 0) return [];

  return ROWS.map(({ id, label, format, winner }) => ({
    id,
    label,
    values: products.map(format),
    bestIndex: winner ? pickBest(products.map(winner.metric), winner.direction) : null,
  }));
}
