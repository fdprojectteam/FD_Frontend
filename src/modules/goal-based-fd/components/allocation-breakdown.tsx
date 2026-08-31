import { formatCurrency } from '@/utils';

import { EMERGENCY_FUND_BASIS } from '../utils/emergency-allocation';

/**
 * Where the money the customer entered went.
 *
 * ## The question this answers
 *
 * > *"I entered ₹1,00,000. Why does this say ₹10,000?"*
 *
 * For the emergency-fund goal the two figures are genuinely different, and
 * genuinely correct: the customer states a total, and the deposit is the share
 * of it that this goal calls for. `calculateEmergencyFundAmount` is the one
 * authority on that share, and it is unchanged — this component computes
 * nothing, it reports.
 *
 * The Amount step already explained the split at the moment of entry. What was
 * missing is everything after: the trail, the recommendation and the booking
 * showed the deposit alone, so a customer who scrolled past the explanation or
 * came back to the page later had no way to reconstruct it. A number that
 * changed and cannot be traced is the worst kind of number to put next to
 * somebody's savings.
 *
 * ## Why the third row is worded the way it is
 *
 * The remainder is **not** "available to invest in this deposit". The engine
 * reserves the smaller figure *for* the emergency fund and leaves the rest for
 * the customer's other goals — that is what the multi-goal planner does with
 * the identical rule. Calling it "available" here would invite the customer to
 * expect a ₹90,000 deposit, which is the opposite of what the plan says. So it
 * is named for what it is: not part of this plan, and where to take it next.
 *
 * ## Why it is three plain rows
 *
 * A card, a chart or a set of badges would make an arithmetic identity look
 * like a feature. Three labelled figures, in the order the money moves, is the
 * whole explanation — and the last row carries the only sentence that is not a
 * number.
 *
 * Pure presentation: both figures arrive derived, and `remainder` is a
 * subtraction of two values the caller already holds.
 */
export interface AllocationBreakdownProps {
  /** What the customer entered. */
  totalAmount: number;
  /** What goes into this deposit — the engine's figure, never recomputed here. */
  investedAmount: number;
  /** Where the rest is planned, when there is somewhere to point. */
  planHref?: string;
  className?: string;
}

export function AllocationBreakdown({
  totalAmount,
  investedAmount,
  className,
}: AllocationBreakdownProps) {
  const remainder = totalAmount - investedAmount;

  /*
    Nothing to explain when nothing was split. Rendering "₹0 not in this plan"
    would add a row that only ever says the obvious.
  */
  if (remainder <= 0) return null;

  const rows: { label: string; value: string; note?: string }[] = [
    { label: 'You entered', value: formatCurrency(totalAmount) },
    {
      label: 'Into this fixed deposit',
      value: formatCurrency(investedAmount),
      note: EMERGENCY_FUND_BASIS,
    },
    {
      label: 'Not part of this plan',
      value: formatCurrency(remainder),
      note: 'Stays with you to plan for other goals.',
    },
  ];

  return (
    <dl
      className={className}
      /*
        A definition list, so the relationship between each label and its figure
        is in the markup rather than only in the visual pairing.
      */
    >
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={
            index === rows.length - 1
              ? 'border-border-default flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-2'
              : 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2'
          }
        >
          <dt className="text-caption text-content-muted min-w-0">
            {row.label}
            {row.note ? <span className="text-content-placeholder block">{row.note}</span> : null}
          </dt>
          <dd className="text-body text-content shrink-0 font-semibold tabular-nums">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
