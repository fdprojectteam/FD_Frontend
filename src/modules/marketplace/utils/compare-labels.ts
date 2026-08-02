/**
 * Accessible names for the comparison's per-product controls (M2.7, T2.7.5).
 *
 * One place that turns a product into human text, exactly as `filter-labels.ts`
 * does for filter values (M2.5). The desktop table and the mobile card render
 * the same two controls per product; composing their names inline would put one
 * sentence in two files, one copy edit away from drifting.
 *
 * Controls name their product rather than repeating "Remove" four times, so a
 * screen-reader user choosing from a list of controls can tell them apart
 * (WCAG 2.4.6). The M2.5 active-filter pills set the precedent.
 *
 * `bestQualifier` deliberately stays in `compare-rows.ts`: the dividing line is
 * the input, not tidiness. That one is derived from a **row** and needs its
 * label; these two are derived from a **product**.
 */

export function removeLabel(bankName: string): string {
  return `Remove ${bankName} from comparison`;
}

export function selectLabel(bankName: string): string {
  return `Select ${bankName}`;
}

/** "Add HDFC Bank to comparison" — the picker's per-row control (T2.7.6). */
export function addLabel(bankName: string): string {
  return `Add ${bankName} to comparison`;
}
