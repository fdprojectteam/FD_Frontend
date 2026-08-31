'use client';

import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils';

import { GOAL_LABELS } from '../constants/goals';
import type { GoalType } from '../types/goal';
import {
  EMERGENCY_FUND_BASIS,
  EMERGENCY_FUND_EXPLANATION,
  calculateEmergencyFundAmount,
} from '../utils/emergency-allocation';

const QUICK_AMOUNTS = [
  {
    value: 100_000,
    label: '₹1 lakh',
    description: 'Starter amount',
  },
  {
    value: 500_000,
    label: '₹5 lakh',
    description: 'Popular choice',
  },
  {
    value: 1_000_000,
    label: '₹10 lakh',
    description: 'Larger investment',
  },
] as const;

export interface AmountStepProps {
  /**
   * The goal being planned for.
   *
   * Only the emergency fund derives its allocation from the total; every other
   * goal invests the amount the customer stated. Optional because the flow
   * types it as possibly unanswered — an absent goal simply derives nothing,
   * which is the honest behaviour rather than an assertion that it is present. The step reads the goal rather
   * than being told what to suggest, so the rule stays in
   * `emergency-allocation.ts` and this component never restates it.
   */
  goalType?: GoalType;
  /** One line saying why the question is being asked. */
  hint: string;
  /** The smallest minimum investment across the loaded catalogue, when known. */
  lowestMinimum?: number;
  initialValue?: number;
  /**
   * `totalAmount` is the figure the customer entered, passed only when the
   * deposit is a share of it — the emergency fund. Every other goal invests the
   * amount typed, so there is no second number to carry.
   */
  onSubmit: (principal: number, totalAmount?: number) => void;
}

/** Digits only — the field is money, and a stray character is a silent NaN later. */
function toDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

export function AmountStep({
  goalType,
  hint,
  lowestMinimum,
  initialValue,
  onSubmit,
}: AmountStepProps) {
  const fieldId = useId();
  const hintId = useId();
  const allocationFieldId = useId();
  const [digits, setDigits] = useState(initialValue ? String(initialValue) : '');

  const amount = digits === '' ? 0 : Number(digits);

  /**
   * The emergency fund's own allocation.
   *
   * For this one goal the figure above is the customer's **total investment**,
   * and what they put into an emergency deposit is a share of it — the policy
   * `calculateEmergencyFundAmount` owns. Every other goal invests the stated
   * amount directly and never sees this control.
   *
   * ## Suggested, not imposed
   *
   * The field is editable, and once the customer changes it their figure wins.
   * `editedAllocation` is `null` until they do; while it is null the suggestion
   * tracks the total, so correcting ₹25,00,000 to ₹30,00,000 moves the
   * suggestion with it. After an edit the suggestion is shown as a hint and
   * never re-applied — a value the customer typed must not be overwritten by a
   * later render.
   */
  const derivesAllocation = goalType === 'emergency';
  const [editedAllocation, setEditedAllocation] = useState<string | null>(null);

  const suggestedAllocation = calculateEmergencyFundAmount(amount);
  const allocationDigits =
    editedAllocation ?? (suggestedAllocation > 0 ? String(suggestedAllocation) : '');
  const allocation = allocationDigits === '' ? 0 : Number(allocationDigits);

  /* What is actually invested — the allocation for an emergency fund, else the total. */
  const investedAmount = derivesAllocation ? allocation : amount;
  const canContinue = investedAmount > 0;

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={(event) => {
        event.preventDefault();

        if (canContinue) {
          /*
            The total travels with the deposit whenever the two differ. Sending
            only `investedAmount` is what made ₹1,00,000 become ₹10,000 with no
            explanation anywhere after this screen.
          */
          onSubmit(investedAmount, derivesAllocation ? amount : undefined);
        }
      }}
    >
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Investment amount
        </span>

        <label htmlFor={fieldId} className="text-h2 text-content">
          How much are you planning to invest?
        </label>

        <p id={hintId} className="text-body-lg text-content-muted max-w-2xl">
          {hint}
        </p>
      </div>

      {/* Amount input */}
      <div className="border-border-default bg-surface-card focus-within:border-border-primary relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 focus-within:shadow-lg sm:p-6">
        {/* Background glow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-purple-300/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-content text-sm font-semibold">
              {derivesAllocation ? 'Total investment' : 'Investment amount'}
            </span>

            {lowestMinimum !== undefined ? (
              <span className="text-content-muted text-xs">
                From {formatCurrency(lowestMinimum)}
              </span>
            ) : null}
          </div>

          <Input
            id={fieldId}
            aria-describedby={hintId}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1,00,000"
            prefix="₹"
            className="h-16 max-w-full rounded-2xl text-2xl font-semibold sm:text-3xl"
            value={digits === '' ? '' : new Intl.NumberFormat('en-IN').format(amount)}
            onChange={(event) => {
              setDigits(toDigits(event.target.value));
            }}
          />

          <div className="text-content-muted flex items-center gap-2 text-xs">
            <span className="bg-surface-brand-subtle text-content-brand flex size-5 items-center justify-center rounded-full">
              <Check className="size-3" />
            </span>

            <span>
              {derivesAllocation
                ? 'We’ll set aside part of this for your emergency fund.'
                : 'We’ll use this amount to compare relevant FD options.'}
            </span>
          </div>
        </div>
      </div>

      {/*
        The derived allocation. Rendered only for the goal whose size is a
        function of the whole portfolio, and only once there is a total to take
        a share of.
      */}
      {derivesAllocation && amount > 0 ? (
        <div className="border-border-default bg-surface-card flex flex-col gap-3 rounded-3xl border p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor={allocationFieldId} className="text-content text-sm font-semibold">
              {GOAL_LABELS.emergency}
            </label>
            <span className="text-content-muted text-xs">{EMERGENCY_FUND_BASIS}</span>
          </div>

          <p className="text-content-muted text-sm">
            Based on your total investment of {formatCurrency(amount)}, we suggest{' '}
            {formatCurrency(suggestedAllocation)}.
          </p>

          <Input
            id={allocationFieldId}
            inputMode="numeric"
            autoComplete="off"
            prefix="₹"
            className="h-14 max-w-full rounded-2xl text-xl font-semibold"
            value={allocation === 0 ? '' : new Intl.NumberFormat('en-IN').format(allocation)}
            onChange={(event) => {
              setEditedAllocation(toDigits(event.target.value));
            }}
          />

          <p className="text-content-muted text-xs">
            {EMERGENCY_FUND_EXPLANATION} You can change this amount.
          </p>

          {/*
            Once edited, the suggestion becomes a way back rather than something
            that silently reasserts itself.
          */}
          {editedAllocation !== null && allocation !== suggestedAllocation ? (
            <button
              type="button"
              onClick={() => {
                setEditedAllocation(null);
              }}
              className="focus-ring text-content-brand w-fit rounded-md text-xs font-medium"
            >
              Use the suggested {formatCurrency(suggestedAllocation)}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Quick amounts */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-content text-sm font-semibold">Choose a quick amount</p>

          <p className="text-content-muted mt-1 text-xs">Or enter any amount above.</p>
        </div>

        {/* `grid-cols-1` bounds the track — see the note in `planner-results.tsx`. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_AMOUNTS.map((quick) => {
            const selected = amount === quick.value;

            return (
              <button
                key={quick.value}
                type="button"
                onClick={() => {
                  setDigits(String(quick.value));
                }}
                className={`group relative flex min-h-20 flex-col items-start justify-center rounded-2xl border px-4 py-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md ${
                  selected
                    ? 'border-border-primary bg-surface-brand-subtle shadow-sm'
                    : 'border-border-default bg-surface-card hover:border-border-primary'
                } `}
              >
                {selected ? (
                  <span className="bg-surface-brand text-content-on-brand absolute top-3 right-3 flex size-5 items-center justify-center rounded-full">
                    <Check className="size-3" />
                  </span>
                ) : null}

                <span className="text-body text-content font-semibold">{quick.label}</span>

                <span className="text-content-muted mt-0.5 text-xs">{quick.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendation explanation */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"
        >
          <Sparkles className="size-4" />
        </span>

        <div>
          <p className="text-content text-sm font-semibold">Why does the amount matter?</p>

          <p className="text-content-muted mt-1 text-sm leading-5">
            Your investment amount helps us check FD minimums, compare suitable options and build a
            recommendation around your plan.
          </p>
        </div>
      </div>

      {/* Continue */}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="lg" disabled={!canContinue} className="w-full sm:w-auto">
          Continue
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </form>
  );
}
