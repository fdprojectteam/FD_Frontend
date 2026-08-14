'use client';

import { useCallback, useMemo, useState } from 'react';

import { GOAL_TYPES } from '../constants/goals';
import type { GoalInput, GoalType } from '../types/goal';

/**
 * The planner's step machine — **presentation state only**.
 *
 * It decides which question is on screen. It does not validate money, price a
 * deposit or rank anything: the moment all answers exist it assembles a
 * `GoalInput` and hands it to the engine, which remains the only authority on
 * what any of it means.
 *
 * ## Intent arriving from Home
 *
 * A customer who chose "Children's education" on Home has already answered the
 * first question, and asking it again is the duplicate this flow exists to
 * remove. `initialGoal` seeds the machine and the goal step is simply never
 * shown — there is **no second store and no synchronisation**, because the seed
 * is an initial value rather than a parallel copy of the answer.
 */
export type PlannerStage = 'goal' | 'investor' | 'amount' | 'horizon' | 'target' | 'results';

export interface PlannerAnswers {
  goalType?: GoalType;
  /** Absent means the question has not been answered; `false` is a real answer. */
  isSeniorCitizen?: boolean;
  principal?: number;
  horizonMonths?: number;
  /**
   * The maturity the customer is aiming for, when they named one.
   *
   * **Optional by design, and skipping is a real answer.** `04-rule-engine.md`
   * §12 runs R-TARGET-001/002/003 only when a target exists; absent means the
   * rules do not run, not that the target is zero. `targetAsked` is what
   * distinguishes "not answered yet" from "answered: none", so the flow can move
   * past the question without inventing a figure.
   */
  targetAmount?: number;
  /** Whether the target question has been answered, including by declining it. */
  targetAsked?: boolean;
}

export interface PlannerFlow {
  stage: PlannerStage;
  answers: PlannerAnswers;
  /** The assembled input, or `null` while any answer is missing. */
  goal: GoalInput | null;
  chooseGoal: (goalType: GoalType) => void;
  setInvestor: (isSeniorCitizen: boolean) => void;
  setPrincipal: (principal: number) => void;
  setHorizon: (horizonMonths: number) => void;
  /** `undefined` is the customer declining to set one, which is a valid answer. */
  setTarget: (targetAmount: number | undefined) => void;
  /** Reopen an answered step without discarding the answers after it. */
  editStep: (
    stage: Extract<PlannerStage, 'goal' | 'investor' | 'amount' | 'horizon' | 'target'>,
  ) => void;
}

/**
 * Narrows an untrusted string to a goal the planner offers.
 *
 * A URL is user input. `?goal=lamborghini` must land on the ordinary
 * goal question rather than crashing or, worse, quietly selecting something the
 * customer did not choose.
 */
export function parseGoalParam(value: string | null | undefined): GoalType | undefined {
  if (value === null || value === undefined) return undefined;

  return GOAL_TYPES.find((goalType) => goalType === value);
}

export function usePlannerFlow(initialGoal?: GoalType): PlannerFlow {
  /*
    A goal that arrived with the customer is an answered question: the flow
    starts at `amount` and seeds the answer, so the goal step is never rendered
    and the trail shows the choice as already made.

    Deliberately no "came from Home" flag. One existed briefly and nothing read
    it — the acknowledgement reads correctly on both paths, so a flag
    distinguishing them would have been state kept for its own sake.
  */
  const [stage, setStage] = useState<PlannerStage>(initialGoal === undefined ? 'goal' : 'investor');
  const [answers, setAnswers] = useState<PlannerAnswers>(
    initialGoal === undefined ? {} : { goalType: initialGoal },
  );

  const chooseGoal = useCallback((goalType: GoalType) => {
    setAnswers((current) => ({ ...current, goalType }));
    setStage('investor');
  }, []);

  const setInvestor = useCallback((isSeniorCitizen: boolean) => {
    setAnswers((current) => ({ ...current, isSeniorCitizen }));
    setStage('amount');
  }, []);

  const setPrincipal = useCallback((principal: number) => {
    setAnswers((current) => ({ ...current, principal }));
    setStage('horizon');
  }, []);

  const setHorizon = useCallback((horizonMonths: number) => {
    setAnswers((current) => ({ ...current, horizonMonths }));
    setStage('target');
  }, []);

  /*
    Declining sets `targetAsked` without a figure, so the flow advances and the
    engine's target rules correctly do not run. Storing a zero instead would make
    "no target" indistinguishable from "a target of nothing", and R-TARGET-003
    would then be comparing maturity against it.
  */
  const setTarget = useCallback((targetAmount: number | undefined) => {
    setAnswers((current) => ({ ...current, targetAmount, targetAsked: true }));
    setStage('results');
  }, []);

  /*
    Editing keeps the later answers. A customer correcting their amount has not
    changed their mind about the goal, and clearing it would make fixing a typo
    cost two more decisions.
  */
  const editStep = useCallback((next: 'goal' | 'investor' | 'amount' | 'horizon' | 'target') => {
    setStage(next);
  }, []);

  /*
    `null` until every answer exists — the query is disabled on `null`, so the
    engine is never asked a half-formed question.
  */
  const goal = useMemo<GoalInput | null>(() => {
    const { goalType, principal, horizonMonths, targetAmount, targetAsked, isSeniorCitizen } =
      answers;

    if (
      goalType === undefined ||
      principal === undefined ||
      horizonMonths === undefined ||
      isSeniorCitizen === undefined ||
      targetAsked !== true
    ) {
      return null;
    }

    /*
      `targetAmount` is spread only when it exists, so `GoalInput` carries no
      `targetAmount` key at all when none was set — `assessTarget` reads
      `undefined` and returns no assessment, exactly as §12 requires.
    */
    return {
      goalType,
      principal,
      horizonMonths,
      isSeniorCitizen,
      ...(targetAmount === undefined ? {} : { targetAmount }),
    };
  }, [answers]);

  return {
    stage,
    answers,
    goal,
    chooseGoal,
    setInvestor,
    setPrincipal,
    setHorizon,
    setTarget,
    editStep,
  };
}
