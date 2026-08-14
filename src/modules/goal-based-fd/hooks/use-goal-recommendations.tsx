'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { createGoalRecommendationService } from '../services/goal-recommendation-service';
import type { GoalInput } from '../types/goal';
import type { MultiGoalPlan } from '../types/plan';

/**
 * Binds the recommendation service to React Query.
 *
 * Contains no transport and no rule — the same division `useProducts` keeps.
 * The service fetches, the engine decides, this hook only caches.
 *
 * The query key is the goal itself, because the goal **is** the query: two
 * different goals are two different questions and must not share a cache entry.
 * Determinism (§19) makes that safe — the same goal always produces the same
 * result, so a cache hit is indistinguishable from a recomputation.
 */
export function useGoalRecommendations(goal: GoalInput | null) {
  const service = useMemo(() => createGoalRecommendationService(), []);

  return useQuery({
    queryKey: ['goal-based-fd', 'recommendations', goal],
    queryFn: () => service.recommend(goal!),
    enabled: goal !== null,
  });
}

/**
 * The multi-goal answer.
 *
 * The plan **is** the query, for the same reason a goal is: two different plans
 * are two different questions. Disabled until at least one goal exists, so the
 * engine is never asked an empty plan.
 */
export function usePlanRecommendations(plan: MultiGoalPlan | null) {
  const service = useMemo(() => createGoalRecommendationService(), []);

  return useQuery({
    queryKey: ['goal-based-fd', 'plan', plan],
    queryFn: () => service.recommendPlan(plan!),
    enabled: plan !== null && plan.goals.length > 0,
  });
}

/**
 * The catalogue, for the one thing the planner needs before it has a goal: the
 * lowest minimum investment on the platform (decision A2).
 *
 * A separate query rather than a field on the result above, because the amount
 * question is asked *before* a goal exists — there is no recommendation to read
 * it from yet. It goes through the same service, so the module still has exactly
 * one place that fetches.
 */
export function useProductCatalogue() {
  const service = useMemo(() => createGoalRecommendationService(), []);

  return useQuery({
    queryKey: ['goal-based-fd', 'catalogue'],
    queryFn: () => service.listProducts(),
  });
}
