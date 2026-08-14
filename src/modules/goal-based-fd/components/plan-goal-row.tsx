'use client';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/utils';

import { GOAL_LABELS, GOAL_TYPES } from '../constants/goals';
import { PLAN_HORIZON_PRESETS, planHorizonLabel } from '../constants/plan-horizons';
import type { GoalDraft } from '../hooks/use-multi-goal-plan';
import type { GoalType } from '../types/goal';

/**
 * One goal inside a multi-goal plan — type, amount and horizon, independently.
 *
 * ## Why each row owns all three
 *
 * The client source document's Use Case 2 gives every goal its own amount *and*
 * its own timeline: ₹5,00,000 for 91 days, ₹10,00,000 for 3 years, ₹10,00,000
 * for 10 years. A shared horizon or a proportional split would make two of those
 * three impossible to express.
 *
 * ## The horizon keeps its unit
 *
 * The options are `Tenure` values, not month counts, so choosing "91 days"
 * stores 91 days. Deposits are matched within a unit, so that choice reaches the
 * engine as the customer made it — the platform never restates it as "3 months".
 *
 * Presentation only. It reads labels and presets and decides nothing.
 */
export interface PlanGoalRowProps {
  draft: GoalDraft;
  /** Removal is refused for the last remaining row, so the control is hidden. */
  canRemove: boolean;
  onChange: (patch: Partial<Omit<GoalDraft, 'id'>>) => void;
  onRemove: () => void;
}

/** Digits only — the field is money, and a stray character is a silent NaN later. */
function toDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

export function PlanGoalRow({ draft, canRemove, onChange, onRemove }: PlanGoalRowProps) {
  const amount = draft.amount === '' ? 0 : Number(draft.amount);

  return (
    <li className="border-border-default rounded-card bg-surface-card flex flex-col gap-4 border p-4 md:p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-content-muted">Goal</span>
          <Select
            aria-label="Goal"
            value={draft.goalType}
            options={GOAL_TYPES.map((type) => ({ value: type, label: GOAL_LABELS[type] }))}
            onValueChange={(value) => {
              onChange({ goalType: value as GoalType });
            }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-content-muted">Amount</span>
          <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="5,00,000"
            prefix="₹"
            aria-label="Amount for this goal"
            value={draft.amount === '' ? '' : new Intl.NumberFormat('en-IN').format(amount)}
            onChange={(event) => {
              onChange({ amount: toDigits(event.target.value) });
            }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-content-muted">When you need it</span>
          <Select
            aria-label="When you need this money"
            value={planHorizonLabel(draft.horizon)}
            options={PLAN_HORIZON_PRESETS.map((preset) => ({
              value: preset.label,
              label: preset.label,
            }))}
            onValueChange={(value) => {
              const preset = PLAN_HORIZON_PRESETS.find((entry) => entry.label === value);
              if (preset) onChange({ horizon: preset.tenure });
            }}
          />
        </label>
      </div>

      {/*
        The document's own `Intent` column. Optional, free text, and consulted by
        no rule — it is recorded because the customer said it, and shown back on
        the plan so their words survive the round trip.
      */}
      <label className="flex flex-col gap-1.5">
        <span className="text-caption text-content-muted">
          What is this money for? <span className="font-normal">(optional)</span>
        </span>
        <Input
          autoComplete="off"
          placeholder="Short-term liquidity"
          aria-label="What this money is for"
          value={draft.intent}
          onChange={(event) => {
            onChange({ intent: event.target.value.slice(0, 80) });
          }}
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <p className="text-caption text-content-muted">
          {amount > 0
            ? `${formatCurrency(amount)} for ${planHorizonLabel(draft.horizon)}`
            : 'Enter an amount for this goal.'}
        </p>

        {canRemove ? (
          <Button variant="ghost" size="sm" onClick={onRemove} className="shrink-0">
            <Trash2 aria-hidden="true" className="size-4" />
            Remove
            <span className="sr-only"> {GOAL_LABELS[draft.goalType]} goal</span>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
