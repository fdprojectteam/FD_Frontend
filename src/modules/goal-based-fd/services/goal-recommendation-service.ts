import {
  createProductMasterRepository,
  type ProductMasterRepository,
} from '@/services/product-master';
import type { ProductMaster } from '@/types/product-master';

import { DEFAULT_ALLOCATION_POLICY } from '../constants/allocation-policy';
import type { AllocationPolicy } from '../types/allocation-policy';
import type { GoalInput } from '../types/goal';
import type { MultiGoalPlan, MultiGoalPlanResult } from '../types/plan';
import type { GoalRecommendationResult } from '../types/recommendation';
import { recommendForGoal } from '../utils/engine';
import { recommendForPlan } from '../utils/plan';

/**
 * The only place Goal-Based FD touches the network (`06-architecture.md` §5).
 *
 * > *"The rule engine should NOT own FD product data. It consumes data from the
 * > FD Domain and applies business rules."*
 *
 * So the split is: this file fetches, `utils/engine.ts` decides. The engine
 * stays pure and testable without a transport, and there is exactly one call
 * site that could ever introduce an N+1.
 *
 * ## One request, whole catalogue
 *
 * `findAll()` — a single `GET /products`. The engine needs every candidate to
 * rank them, and it filters in its own rules layer because the filtering *is*
 * the engine. There is deliberately **no per-product detail fetch**: eligibility
 * is the only field that would require one, and R-ELIG-002 is data-blocked
 * (`constants/blocked-rules.ts`), so the request that would cause an N+1 has no
 * rule to serve.
 */
export function createGoalRecommendationService(
  repository: ProductMasterRepository = createProductMasterRepository(),
) {
  return {
    /** Recommend deposits for one goal, ranked best-first. */
    async recommend(goal: GoalInput): Promise<GoalRecommendationResult> {
      const products = await repository.findAll();
      return recommendForGoal(products, goal);
    },

    /**
     * The catalogue, unranked.
     *
     * The planner asks "how much?" before it has a goal, and the honest hint
     * beneath that field — *"deposits start from ₹X"* — is a fact about the
     * catalogue rather than a number to type into the copy (decision A2). This
     * is how the screen obtains it without a second fetch layer and without any
     * component reaching for a repository.
     *
     * Deliberately returns `ProductMaster[]` and nothing derived: choosing what
     * to show from it is the screen's business, and no rule runs here.
     */
    /**
     * The multi-goal answer. Same repository, same engine, once per goal — the
     * policy is a parameter so the caller's configuration decides the spread,
     * never this service.
     */
    async recommendPlan(
      plan: MultiGoalPlan,
      policy: AllocationPolicy = DEFAULT_ALLOCATION_POLICY,
    ): Promise<MultiGoalPlanResult> {
      const products = await repository.findAll();
      return recommendForPlan(products, plan, policy);
    },

    async listProducts(): Promise<ProductMaster[]> {
      return repository.findAll();
    },
  };
}

export type GoalRecommendationService = ReturnType<typeof createGoalRecommendationService>;
