/**
 * Relative bank strength, for ordering deposits the other rules rank equally.
 *
 * ## Why this exists
 *
 * The platform is recommendation-led and safety-aware, not rate-led. When two
 * deposits suit a goal identically *and pay identically*, the stronger-rated
 * bank is the better recommendation — and until now that tie was broken by
 * product id, which is arbitrary.
 *
 * ## Where it sits in the ranking, and why not higher
 *
 * **After rate, before the id.** `04-rule-engine.md` §13 places rate last among
 * the considerations it defines, and defines nothing about rating; promoting
 * rating *above* rate would be inventing a business rule and would change every
 * documented scenario's outcome. So it decides only what was previously decided
 * by alphabetical accident.
 *
 * ⚠️ **Open decision.** Whether a stronger rating should outrank a higher rate —
 * the client's "Bank A AAA at 7.2% vs Bank B weaker at 7.5%" question — is not
 * answered by any approved document. Raising this above the rate comparison is a
 * one-line change here once the client decides.
 *
 * ## The order itself
 *
 * Conventional long-term credit-rating order, highest first. An unrated bank
 * sorts last **without being penalised elsewhere** — it is not excluded, not
 * warned about, and not down-weighted anywhere else in the engine.
 */
const RATING_ORDER: readonly string[] = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-'] as const;

/**
 * Lower is stronger. An unrated or unrecognised bank sorts after every rated
 * one, and two unrated banks are equal — which sends the comparison on to the
 * deterministic id tie-break rather than guessing between them.
 */
export function bankStrengthRank(rating: string | null | undefined): number {
  if (rating === null || rating === undefined) return RATING_ORDER.length;

  const index = RATING_ORDER.indexOf(rating);
  return index === -1 ? RATING_ORDER.length : index;
}
