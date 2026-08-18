'use client';

import { useCallback, useMemo, useState } from 'react';

import type { Tenure } from '@/types/finance';

import { GOAL_TYPES } from '../constants/goals';
import type { GoalType } from '../types/goal';
import type { GoalPlan, MultiGoalPlan } from '../types/plan';
import { calculateEmergencyFundAmount } from '../utils/emergency-allocation';

/**
 * The multi-goal plan a customer is building — presentation state only.
 *
 * ## What it owns
 *
 * A total, and a list of goals. It validates nothing about money, prices
 * nothing, and allocates nothing: the moment the plan is complete it hands a
 * `MultiGoalPlan` to the engine, which stays the only authority on what any of
 * it means.
 *
 * ## Why it is separate from `usePlannerFlow`
 *
 * They are different journeys and must not share state. The single-goal planner
 * is a sequence of questions with one answer each; this is a list the customer
 * edits in any order. Folding them together would give the single-goal flow a
 * goals array it never uses and this one a stage machine it does not have.
 *
 * The single-goal flow is untouched by this file.
 *
 * ## Rows carry their own identity
 *
 * A row's key is a generated id, not its index or its goal type — the customer
 * may plan twice for the same goal type, and removing the first row must not
 * make React reuse its inputs for the second.
 */

/** A goal being edited, before it is complete enough to plan with. */
export interface GoalDraft {
  id: string;
  goalType: GoalType;
  /** Digits as typed. Empty until the customer enters something. */
  amount: string;
  horizon: Tenure;
  intent: string;
  /**
   * Emergency Fund starts as a system recommendation based on 10% of the
   * total investment. Once the customer edits it, it becomes manual and
   * subsequent total changes must not overwrite the customer's choice.
   */
  amountSource: 'auto' | 'manual';
}

export interface MultiGoalPlanFlow {
  totalAmount: string;
  /** Asked once for the journey. `undefined` until answered. */
  isSeniorCitizen: boolean | undefined;
  setIsSeniorCitizen: (value: boolean) => void;
  drafts: readonly GoalDraft[];
  /** The plan to send to the engine, or `null` while it is incomplete. */
  plan: MultiGoalPlan | null;
  /** Sum of the goal amounts entered so far, in rupees. */
  goalsTotal: number;
  /** Total entered minus the goals' sum. Negative means the goals exceed it. */
  difference: number;
  setTotalAmount: (value: string) => void;
  addGoal: () => void;
  removeGoal: (id: string) => void;
  updateGoal: (id: string, patch: Partial<Omit<GoalDraft, 'id'>>) => void;
}

const DEFAULT_HORIZON: Tenure = { value: 12, unit: 'months' };

/*
  `GOAL_TYPES` is a readonly tuple, so indexing it is `GoalType | undefined`
  under `noUncheckedIndexedAccess`. It is never empty — the union has three
  members and an invariant asserts the list matches it — so this names the first
  member explicitly rather than asserting non-null at two call sites.
*/
const FIRST_GOAL_TYPE: GoalType = 'emergency';

function toRupees(digits: string): number {
  return digits === '' ? 0 : Number(digits);
}

/** Monotonic and local — ids only need to be unique within one plan. */
let nextRowId = 0;
function createDraft(goalType: GoalType): GoalDraft {
  nextRowId += 1;
  return {
    id: `goal-${String(nextRowId)}`,
    goalType,
    amount: '',
    horizon: DEFAULT_HORIZON,
    intent: '',
    amountSource: goalType === 'emergency' ? 'auto' : 'manual',
  };
}

export function useMultiGoalPlan(): MultiGoalPlanFlow {
  const [totalAmount, setTotalAmount] = useState('');
  /*
    One answer for the whole journey. Deliberately *not* per goal: senior-citizen
    status is a fact about the depositor, and three goals cannot disagree about
    it.
  */
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean | undefined>(undefined);
  const [drafts, setDrafts] = useState<GoalDraft[]>(() => [createDraft(FIRST_GOAL_TYPE)]);

  const setPlannerTotalAmount = useCallback((value: string) => {
    setTotalAmount(value);

    const total = toRupees(value);

    setDrafts((current) =>
      current.map((draft) => {
        if (draft.goalType !== 'emergency' || draft.amountSource !== 'auto') {
          return draft;
        }

        const emergencyAmount = calculateEmergencyFundAmount(total);

        return {
          ...draft,
          amount: emergencyAmount > 0 ? String(emergencyAmount) : '',
        };
      }),
    );
  }, []);

  const addGoal = useCallback(() => {
    setDrafts((current) => {
      /*
        Offer a goal type the customer has not used yet, falling back to the
        first. A convenience, not a rule: nothing prevents planning twice for the
        same goal, because nothing in the documents says it should.
      */
      const unused = GOAL_TYPES.find((type) => !current.some((draft) => draft.goalType === type));
      return [...current, createDraft(unused ?? FIRST_GOAL_TYPE)];
    });
  }, []);

  const removeGoal = useCallback((id: string) => {
    /* Never remove the last row — a plan with no goals is not a plan. */
    setDrafts((current) => (current.length <= 1 ? current : current.filter((d) => d.id !== id)));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Omit<GoalDraft, 'id'>>) => {
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== id) {
          return draft;
        }

        const nextDraft = {
          ...draft,
          ...patch,
        };

        if (
          draft.goalType === 'emergency' &&
          patch.amount !== undefined &&
          patch.amount !== draft.amount
        ) {
          return {
            ...nextDraft,
            amountSource: 'manual',
          };
        }

        return nextDraft;
      }),
    );
  }, []);

  const goalsTotal = useMemo(
    () => drafts.reduce((total, draft) => total + toRupees(draft.amount), 0),
    [drafts],
  );

  /*
    `null` until every goal carries an amount and the customer has stated a
    total. The query is disabled on `null`, so the engine is never asked a
    half-formed plan — the same discipline the single-goal flow follows.
  */
  const plan = useMemo<MultiGoalPlan | null>(() => {
    const total = toRupees(totalAmount);
    if (total <= 0) return null;
    if (drafts.some((draft) => toRupees(draft.amount) <= 0)) return null;
    /* The profile is part of the question, so an unanswered one is an incomplete plan. */
    if (isSeniorCitizen === undefined) return null;

    const goals: GoalPlan[] = drafts.map((draft) => ({
      goalType: draft.goalType,
      amount: toRupees(draft.amount),
      horizon: draft.horizon,
      /* Omitted entirely when blank — an empty intent is no intent, not "". */
      ...(draft.intent.trim() === '' ? {} : { intent: draft.intent.trim() }),
    }));

    return { totalAmount: total, goals, investor: { isSeniorCitizen } };
  }, [drafts, totalAmount, isSeniorCitizen]);

  return {
    totalAmount,
    isSeniorCitizen,
    setIsSeniorCitizen,
    drafts,
    plan,
    goalsTotal,
    difference: toRupees(totalAmount) - goalsTotal,
    setTotalAmount: setPlannerTotalAmount,
    addGoal,
    removeGoal,
    updateGoal,
  };
}
