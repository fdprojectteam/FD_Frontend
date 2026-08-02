'use client';

import { ArrowRight } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { AmountDisplay } from '@/components/business/amount-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { MaturityResult } from '../types/calculator';
import type { ProductSummary } from '../types/product';
import { parseCalculatorAmount } from '../utils/calculator-input';
import { formatTenure } from '../utils/format';

/**
 * InvestmentCalculator — the approved calculator card (M2.6, T2.6.5).
 *
 * **Presentation-only, and it computes nothing** (Document 07 §15). It owns
 * the draft amount — transient UI state, never the URL (invariant I6, decision
 * D3) — validates it against a shared schema, and reports a valid amount
 * upward. `ProductDetailScreen` owns the maturity calculation and passes the
 * figures back as `result`. The same split as `SearchBar`.
 *
 * **Tenure is fixed** (decision D2). A fixed deposit is a rate-for-tenure
 * contract: this product has one rate and one tenure, so offering other
 * tenures would quote a return the user cannot obtain. Doing it honestly needs
 * rate slabs, which M2.1 excluded. The field is kept, as the approved screen
 * draws it, and marked read-only.
 *
 * Layout (plan §2.7.2): both inputs share a row at every width; from `md` the
 * Calculate button joins them, below `md` it drops to its own row. Results run
 * in one line from `md` and wrap so the Maturity Value box takes its own row
 * below.
 */
export interface InvestmentCalculatorProps {
  product: ProductSummary;
  /** Figures to display — computed by the screen, never here. */
  result: MaturityResult;
  onCalculate: (amount: number) => void;
}

/** Decorative: the labels already say what each figure is. */
function ResultArrow() {
  return <ArrowRight aria-hidden="true" className="text-content-muted size-4 shrink-0" />;
}

export function InvestmentCalculator({ product, result, onCalculate }: InvestmentCalculatorProps) {
  const fieldId = useId();
  const amountId = `${fieldId}-amount`;
  const tenureId = `${fieldId}-tenure`;
  const errorId = `${fieldId}-error`;

  // Opens at the reference amount the approved screen shows (₹1,00,000).
  const [draft, setDraft] = useState(String(result.principal));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = parseCalculatorAmount(draft, product.minInvestment);

    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setError(null);
    onCalculate(parsed.amount);
  };

  return (
    <section
      aria-labelledby={`${fieldId}-title`}
      className="border-border-default bg-surface-card rounded-card flex flex-col gap-6 border p-6"
    >
      <h2 id={`${fieldId}-title`} className="text-body-lg text-content font-semibold">
        Investment calculator
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 md:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-2">
          <label htmlFor={amountId} className="text-caption text-content-muted font-medium">
            Amount
          </label>
          <Input
            id={amountId}
            size="lg"
            inputMode="numeric"
            value={draft}
            invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={tenureId} className="text-caption text-content-muted font-medium">
            Tenure
          </label>
          <Input
            id={tenureId}
            size="lg"
            readOnly
            aria-readonly="true"
            value={formatTenure(product.tenureMonths)}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="col-span-2 w-fit justify-self-start md:col-span-1"
        >
          Calculate
        </Button>

        {error ? (
          <p id={errorId} role="alert" className="text-caption text-error col-span-2 md:col-span-3">
            {error}
          </p>
        ) : null}
      </form>

      <div className="border-border-default border-t border-dashed" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <AmountDisplay label="Principal" value={result.principal} />
        <ResultArrow />
        <AmountDisplay label="Interest Earned" value={result.interestEarned} />
        <ResultArrow />
        <div className="bg-surface-brand-subtle rounded-card px-6 py-4">
          <AmountDisplay
            label="Maturity Value"
            value={result.maturityValue}
            size="lg"
            tone="brand"
          />
        </div>
      </div>
    </section>
  );
}
