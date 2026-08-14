export { BLOCKED_RULES } from './constants/blocked-rules';
export {
  GOAL_LABELS,
  GOAL_TENURE_PREFERENCE,
  GOAL_TYPES,
  type TenurePreference,
} from './constants/goals';
export {
  GOAL_DESCRIPTIONS,
  GOAL_ICONS,
  HORIZON_PRESETS,
  PLANNER_STEPS,
  STEP_HINTS,
  RULE_LABELS,
  acknowledgementFor,
} from './constants/presentation';
export {
  createGoalRecommendationService,
  type GoalRecommendationService,
} from './services/goal-recommendation-service';
export type { GoalInput, GoalType } from './types/goal';
export type {
  GoalRecommendationResult,
  Recommendation,
  TargetAssessment,
} from './types/recommendation';
export type {
  BlockedRule,
  BlockedRuleId,
  RecommendationReason,
  RecommendationWarning,
  RuleId,
} from './types/rule';
export { selectCandidates, type PricedCandidate } from './utils/candidates';
export { recommendForGoal } from './utils/engine';
export { recommendForPlan } from './utils/plan';
export { allocateForGoal } from './utils/allocate';
export {
  DEFAULT_ALLOCATION_POLICY,
  DEPOSIT_INSURANCE_COVERAGE,
  NO_CONCENTRATION_POLICY,
} from './constants/allocation-policy';
export type { AllocationPolicy, ConcentrationMode } from './types/allocation-policy';
export type { SafetyAssessment } from './types/plan';
export type {
  AllocationLeg,
  GoalPlan,
  GoalPlanResult,
  GoalPlanStatus,
  MultiGoalPlan,
  MultiGoalPlanResult,
} from './types/plan';
export { blockedRuleWarnings, buildReasons, buildWarnings, goalLabel } from './utils/explain';
export { compareCandidates, exceedsHorizon, isExactTenureMatch } from './utils/ranking';
export { assessTarget, TARGET_ADJUSTMENTS } from './utils/target';
export { bookingHandoffHref, toBookingHandoff, type BookingHandoff } from './utils/booking-handoff';
export { GoalPlannerScreen } from './components/goal-planner-screen';
export { MultiGoalPlannerScreen } from './components/multi-goal-planner-screen';
export { PLAN_HORIZON_PRESETS, planHorizonLabel } from './constants/plan-horizons';
export {
  useMultiGoalPlan,
  type GoalDraft,
  type MultiGoalPlanFlow,
} from './hooks/use-multi-goal-plan';
export { compareTenure, supportsMaturity, type TenureFit } from './utils/tenure-fit';
export {
  useGoalRecommendations,
  usePlanRecommendations,
  useProductCatalogue,
} from './hooks/use-goal-recommendations';
export {
  parseGoalParam,
  usePlannerFlow,
  type PlannerAnswers,
  type PlannerStage,
} from './hooks/use-planner-flow';
