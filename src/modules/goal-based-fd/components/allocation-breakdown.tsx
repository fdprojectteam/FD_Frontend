import { formatCurrency } from '@/utils';

/**
 * A disclosure for a customer who explicitly chose an FD principal lower than
 * the amount they made available. The normal Emergency Fund path sends the
 * full available amount to the engine, so this remains absent unless there is
 * a real customer choice to explain.
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
    },
    {
      label: 'Outside this plan',
      value: formatCurrency(remainder),
      note: 'You chose not to invest this amount in this fixed deposit.',
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
