'use client';

import { Check, Pencil } from 'lucide-react';
import Image from 'next/image';

import { formatCurrency, formatTenure } from '@/utils';

import { GOAL_LABELS } from '../constants/goals';
import { GOAL_ICONS } from '../constants/presentation';
import type { PlannerAnswers, PlannerStage } from '../hooks/use-planner-flow';

/**
 * The answers so far, as a trail rather than a discarded form.
 *
 * ## Why answered steps stay on screen
 *
 * A wizard that replaces each question with the next leaves the customer unable
 * to see the plan they are building — and unable to correct a typo without
 * starting over. Each answered step collapses to one line with a Change
 * affordance, so the plan accumulates visibly and every part of it stays
 * editable.
 *
 * The goal keeps its icon here. It is the same mark the customer selected, so
 * the choice is recognisable rather than merely re-read.
 */
export interface PlannerTrailProps {
  answers: PlannerAnswers;
  stage: PlannerStage;
  onEdit: (stage: 'goal' | 'investor' | 'amount' | 'horizon' | 'target') => void;
}

interface TrailRow {
  key: 'goal' | 'investor' | 'amount' | 'horizon' | 'target';
  label: string;
  value: string;
  /** A second line, for an answer that needs one. */
  note?: string;
}

export function PlannerTrail({ answers, stage, onEdit }: PlannerTrailProps) {
  const rows: TrailRow[] = [];

  /* Only answered steps that are not currently open — an open step is the question, not an answer. */
  if (answers.goalType !== undefined && stage !== 'goal') {
    rows.push({ key: 'goal', label: 'Goal', value: GOAL_LABELS[answers.goalType] });
  }
  if (answers.isSeniorCitizen !== undefined && stage !== 'investor') {
    rows.push({
      key: 'investor',
      label: 'You',
      value: answers.isSeniorCitizen ? 'Senior citizen' : 'Standard rates',
    });
  }
  /* An explicit smaller allocation keeps both customer-entered figures visible. */
  if (answers.principal !== undefined && stage !== 'amount') {
    const total = answers.totalAmount;
    const isShare = total !== undefined && total > answers.principal;

    rows.push({
      key: 'amount',
      label: isShare ? 'Investing' : 'Amount',
      value: formatCurrency(answers.principal),
      note: isShare
        ? `You chose to invest ${formatCurrency(answers.principal)} from ${formatCurrency(total)} available. ${formatCurrency(total - answers.principal)} is outside this plan.`
        : undefined,
    });
  }
  if (answers.horizonMonths !== undefined && stage !== 'horizon') {
    rows.push({ key: 'horizon', label: 'When', value: formatTenure(answers.horizonMonths) });
  }
  /*
    Declining the target is an answer and shows as one. A row that appeared only
    when a figure was given would leave the customer unable to change their mind
    without restarting.
  */
  if (answers.targetAsked === true && stage !== 'target') {
    rows.push({
      key: 'target',
      label: 'Target',
      value:
        answers.targetAmount === undefined ? 'No target set' : formatCurrency(answers.targetAmount),
    });
  }

  if (rows.length === 0) return null;

  const GoalIcon = answers.goalType === undefined ? null : GOAL_ICONS[answers.goalType];

  return (
    /*
      `ds-stagger` so a trail that arrives already populated — the customer came
      from Home with a goal, or reopened and re-answered a step — resolves in
      reading order rather than as a block. A single new row has no delay to
      apply, so the common case is unaffected.
    */
    <ul className="ds-stagger flex list-none flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.key}
          className="border-border-default rounded-card bg-surface-card motion-safe:animate-reveal flex items-center gap-3 border px-4 py-3"
        >
          <span
            aria-hidden="true"
            className="text-content-brand bg-surface-brand-subtle inline-flex size-7 shrink-0 items-center justify-center rounded-full"
          >
            {row.key === 'goal' && GoalIcon ? (
              <Image
                src={GoalIcon}
                alt=""
                width={16}
                height={16}
                className="size-4 object-contain"
              />
            ) : (
              <Check className="size-4" />
            )}
          </span>

          <span className="text-caption text-content-muted w-16 shrink-0">{row.label}</span>

          {/*
            The value stays on one line and truncates, as it always did. A note
            wraps beneath it rather than competing for that line — the amount is
            what the row is for, and the explanation is what makes it safe to
            read.
          */}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body text-content truncate font-medium">{row.value}</span>
            {row.note ? <span className="text-caption text-content-muted">{row.note}</span> : null}
          </span>

          <button
            type="button"
            onClick={() => {
              onEdit(row.key);
            }}
            className="focus-ring text-caption text-content-brand duration-fast hover:bg-surface-brand-subtle -mr-2 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 font-medium transition ease-out"
          >
            <Pencil aria-hidden="true" className="size-3" />
            Change
            <span className="sr-only"> {row.label.toLowerCase()}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
