import { BestFitCard } from './best-fit-card';
import { CompactRecommendationCard } from './compact-recommendation-card';
import { GOAL_LABELS } from '../constants/goals';
import type { GoalType } from '../types/goal';
import type { GoalRecommendationResult } from '../types/recommendation';

/**
 * The recommendation view — one dominant answer, then the alternatives.
 *
 * `04-rule-engine.md` §13 ranks the results; this renders that ranking as a
 * **hierarchy** rather than a list. The first recommendation is the engine's
 * answer to the customer's question, and giving it the same visual weight as the
 * fourth would throw away the ranking the whole engine exists to produce.
 */
export function PlannerResults({
  result,
  goalType,
}: {
  result: GoalRecommendationResult;
  goalType: GoalType;
}) {
  const [best, ...others] = result.recommendations;
  const limitations = result.warnings.filter((warning) => warning.kind === 'limitation');

  if (!best) {
    return (
      <section aria-labelledby="planner-results-title" className="flex flex-col gap-4">
        <h2 id="planner-results-title" className="text-h2 text-content">
          No deposits match this plan
        </h2>
        <ul className="text-body text-content-muted flex list-none flex-col gap-2">
          {limitations.map((warning) => (
            <li key={warning.text}>{warning.text}</li>
          ))}
        </ul>
        <p className="text-body text-content-muted">
          Try a different amount or a different time frame.
        </p>
      </section>
    );
  }

  return (
    /*
      The reveal order is the client document's own information hierarchy:
      what was found → the recommendation and its reasoning → the alternatives →
      what was not considered. Each block is a direct child, so `ds-stagger`
      sequences them without any component needing to know its own index.
    */
    <section aria-labelledby="planner-results-title" className="ds-stagger flex flex-col gap-8">
      <div className="motion-safe:animate-reveal flex flex-col gap-1">
        <span className="text-caption text-content-muted">
          Based on your {GOAL_LABELS[goalType].toLowerCase()} goal
        </span>
        <h2 id="planner-results-title" className="text-h2 text-content">
          {result.recommendations.length === 1
            ? 'We found 1 FD that fits your plan'
            : `We found ${String(result.recommendations.length)} FDs that fit your plan`}
        </h2>
      </div>

      <BestFitCard recommendation={best} />

      {others.length > 0 ? (
        <div className="motion-safe:animate-reveal flex flex-col gap-4">
          <h3 className="text-h3 text-content">Other FDs that fit your goal</h3>
          {/*
            The list carries its own stagger, so the alternatives resolve in
            reading order rather than as one block. The cap lives in the CSS —
            the sixth card and beyond share the fifth delay, which is what keeps
            a long list inside the sequence budget.
          */}
          <ul className="ds-stagger grid list-none gap-4 md:grid-cols-2">
            {others.map((recommendation) => (
              <li key={recommendation.productId} className="motion-safe:animate-reveal">
                <CompactRecommendationCard recommendation={recommendation} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/*
        The rules that did not run, disclosed rather than hidden — but placed
        after the answer, not before it. A customer is entitled to know that,
        for example, senior-citizen benefits were never considered; they are not
        served by being told so before they have seen a recommendation.
      */}
      <details className="border-border-default rounded-card motion-safe:animate-reveal border p-4">
        <summary className="text-body text-content focus-ring cursor-pointer rounded-md font-medium">
          What this plan doesn’t yet consider
        </summary>
        <ul className="text-caption text-content-muted mt-3 flex list-none flex-col gap-2">
          {result.blockedRules.map((rule) => (
            <li key={rule.ruleId}>
              <span className="text-content font-medium">{rule.intent}</span> {rule.missingData}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
