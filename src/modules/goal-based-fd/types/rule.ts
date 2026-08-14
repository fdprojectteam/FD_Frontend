/**
 * Rule identity and outcomes (`04-rule-engine.md` §4, §14, §19).
 *
 * Every reason a recommendation gives is traceable to a rule the approved
 * document defines. That is the whole point of `RuleId` being a closed union
 * rather than a string: a reason with an invented provenance is worse than no
 * reason, because it reads exactly like a real one.
 */

/**
 * Rules that produce a reason or a warning.
 *
 * The `R-*` ids are quoted verbatim from `04-rule-engine.md`. The `§*` ids name
 * a document section that states a rule without numbering it — §8's product
 * filters. Citing the section is honest; minting an `R-FILTER-001` that appears
 * in no approved document would not be.
 */
export type RuleId =
  | 'R-GOAL-001'
  | 'R-GOAL-002'
  | 'R-GOAL-003'
  | 'R-ELIG-001'
  | 'R-TENURE-001'
  | 'R-TENURE-003'
  | 'R-TARGET-001'
  | 'R-TARGET-002'
  | 'R-TARGET-003'
  | '§8.investment-amount'
  | '§8.tenure-constraints'
  /**
   * The deposit-insurance consideration the allocation engine applies.
   *
   * Cites §11 because that is the section on diversification, following the
   * same convention as the `§8.*` ids. Deliberately **distinct from
   * `§11.diversification`**, which remains blocked: this is the platform acting
   * on published insurance cover, not the client's unstated concentration
   * limit. Conflating them would let a configured default masquerade as an
   * approved business rule.
   */
  | '§11.deposit-insurance';

/**
 * Rules named by the approved documents that this engine **does not evaluate**,
 * because the product data required to evaluate them does not exist.
 *
 * Kept as a type rather than dropped, so a blocked rule is a value the system
 * can carry and report. `04-rule-engine.md` §16 forbids inventing benefits,
 * limits and rates; the corollary is that a rule which cannot run must say so
 * rather than quietly not appearing.
 */
export type BlockedRuleId =
  | 'R-GOAL-004'
  | 'R-ELIG-001'
  | 'R-ELIG-002'
  | 'R-TENURE-002'
  | '§8.availability'
  | '§8.maximum-investment'
  | '§11.diversification';

/** Why a rule cannot run, and what would unblock it. */
export interface BlockedRule {
  ruleId: BlockedRuleId;
  /** What the rule would do, in the document's own terms. */
  intent: string;
  /** The product data that does not exist. Stated as a data gap, never as a default. */
  missingData: string;
}

/** One explainable statement attached to a recommendation (`04-rule-engine.md` §14). */
export interface RecommendationReason {
  ruleId: RuleId;
  text: string;
}

/**
 * Something the customer must know that is not a reason to recommend.
 *
 * Two kinds, distinguished so a UI can present them differently: a `limitation`
 * is a fact about this recommendation (the horizon exceeds every available
 * tenure), a `blocked-rule` is a fact about the *engine* (a rule the documents
 * define was not evaluated).
 */
export interface RecommendationWarning {
  kind: 'limitation' | 'blocked-rule';
  /** The rule this concerns, when it concerns one. */
  ruleId?: RuleId | BlockedRuleId;
  text: string;
}
