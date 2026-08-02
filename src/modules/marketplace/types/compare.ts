/**
 * Comparison types (M2.1, narrowed in T2.7.1).
 *
 * Selection is **not** modelled here. It lives in `CompareSelectionProvider`
 * (T2.6.7) as an in-memory list of ids capped at four, with `/compare?ids=` as
 * its shareable projection. A placeholder `CompareSelection { selectedIds }`
 * stood here from M2.1 until T2.7.1: it had no importers, and it collided by
 * name with the live context type, so `import type { CompareSelection }`
 * resolved to a different shape depending on the path it came from. Removed.
 * The contract is `docs/engineering/marketplace-compare-state.md`.
 */

/**
 * The rows of the approved comparison table, in the order they are rendered.
 *
 * A union rather than `string` (T2.7.1, decision C3) so a row cannot be
 * misspelled, and so a consumer that switches on the row — the mobile card
 * stacks Benefits and Eligibility while the rest stay inline — can be checked
 * for exhaustiveness instead of matching string literals.
 */
export type CompareRowId =
  | 'interestRate'
  | 'tenure'
  | 'minInvestment'
  | 'interestEarned'
  | 'maturityValue'
  | 'benefits'
  | 'eligibility';

/** One row of the comparison table (approved UI: rate, tenure, min, …). */
export interface CompareRow {
  id: CompareRowId;
  label: string;
  /** One entry per compared product, in column order. */
  values: string[];
  /**
   * Index of the best value in `values`, or null when the row has no
   * winner (e.g. eligibility). Drives the highlighted cell.
   */
  bestIndex: number | null;
}
