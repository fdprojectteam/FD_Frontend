import { Check } from 'lucide-react';

import { RULE_LABELS } from '../constants/presentation';
import type { RecommendationReason } from '../types/rule';

/**
 * "Why this fits your plan" — the engine's reasons, in the customer's words.
 *
 * ## The rule ids never reach the screen
 *
 * `reason.ruleId` is internal vocabulary. It is used here only as a **key into
 * `RULE_LABELS`**, which is exhaustive over `RuleId`, so a new rule is a
 * compile error rather than a blank tick. An invariant asserts no `R-` id or
 * `§` reference appears in any JSX string in this module.
 *
 * ## Nothing is added
 *
 * Every line corresponds one-to-one with a reason the engine emitted. No line is
 * synthesised, reworded into a claim, or inferred — in particular there is no
 * "competitive rate", because nothing in the engine establishes that a rate is
 * competitive and asserting it would be a financial claim the platform cannot
 * support.
 */
export function ReasonList({
  reasons,
  detailed = false,
}: {
  reasons: readonly RecommendationReason[];
  detailed?: boolean;
}) {
  return (
    <ul className="flex list-none flex-col gap-2">
      {reasons.map((reason) => (
        <li key={reason.ruleId} className="flex items-start gap-2.5">
          <span aria-hidden="true" className="text-success mt-0.5 inline-flex shrink-0">
            <Check className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-body text-content">{RULE_LABELS[reason.ruleId]}</span>
            {detailed ? (
              <span className="text-caption text-content-muted">{reason.text}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
