'use client';

import { formatCurrency, formatRate } from '@/utils/format';

import { PAYOUT_OPTION_LABELS } from '../constants/payout-options';
import type { ReturnsResult } from '../utils/returns';

/**
 * EstimatedReturns — the four-cell figure strip (T3.2.8).
 *
 * **It computes nothing.** `calculateReturns` (T3.2.5) produces every figure
 * here, resolving the rate through the tenure rate card and applying the payout
 * model; this component decides how four numbers look. That split is why the
 * C4 rule below is enforced in a pure function the suite asserts directly,
 * rather than in JSX.
 *
 * ## The C4 rule, made visible
 *
 * > *Never display a compounded maturity for a payout product.*
 *
 * For **At Maturity**, interest compounds and Maturity Amount is principal plus
 * interest. For **Monthly / Quarterly / Half-Yearly / Annual**, interest leaves
 * the deposit as it accrues, so Maturity Amount **is the principal** and the
 * interest has already been paid out.
 *
 * The domain layer guarantees the figures. What this component adds is the
 * sentence that makes them make sense: a strip showing "Maturity Amount
 * ₹5,00,000" beside "Total Interest ₹72,500" looks like an error unless it also
 * says the interest arrives monthly. So a payout deposit gets an extra line
 * naming the instalment — without it the correct numbers read as broken ones.
 *
 * ## The awaiting state
 *
 * `result` is `null` whenever the configuration cannot be priced — no amount
 * yet, no tenure chosen, or a tenure this product does not publish a rate for.
 * The strip then says what is missing rather than rendering zeros. A zero
 * maturity value is a claim about the deposit; an absent one is the truth.
 *
 * The tenure and payout controls arrive in T3.2.9 and T3.2.10, so on this task
 * the awaiting state is what the screen shows until they do — which is honest
 * rather than incomplete.
 *
 * ## Live region
 *
 * `aria-live="polite"` on the figures: they change in response to the amount
 * field, and a sighted user sees that immediately while a screen-reader user
 * would otherwise have to go looking. Polite rather than assertive — this is a
 * recalculation, not an alert, and it must not interrupt the field being typed
 * into.
 */
export interface EstimatedReturnsProps {
  /** From `calculateReturns`; `null` when the configuration cannot be priced. */
  result: ReturnsResult | null;
  /** Why there are no figures yet — shown in the awaiting state. */
  awaitingMessage?: string;
}

export function EstimatedReturns({
  result,
  /*
    Names only what the user still has to do.

    This previously read "Enter an amount and choose a tenure and payout option",
    which was written before T3.2.9 and T3.2.10 began seeding both of those on
    arrival. It asked the user to make two choices the screen had already made
    for them — and on a screen whose job is to reduce uncertainty, an instruction
    to do something already done is worse than no instruction.
  */
  awaitingMessage = 'Enter an amount to see your estimated returns.',
}: EstimatedReturnsProps) {
  if (result === null) {
    return (
      <div
        aria-live="polite"
        className="border-border-default rounded-card border border-dashed p-6"
      >
        <p className="text-body text-content-muted text-center">{awaitingMessage}</p>
      </div>
    );
  }

  const { isCumulative, instalmentAmount, payoutOption } = result;

  const cells = [
    { id: 'principal', label: 'Principal Amount', value: formatCurrency(result.principal) },
    {
      id: 'interest',
      label: 'Total Interest',
      value: formatCurrency(result.totalInterest),
      tone: 'success' as const,
    },
    {
      id: 'maturity',
      label: 'Maturity Amount',
      value: formatCurrency(result.maturityValue),
      tone: 'brand' as const,
    },
    {
      id: 'rate',
      label: 'Interest Rate (p.a.)',
      value: formatRate(result.annualRate),
      tone: 'brand' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div
        aria-live="polite"
        className="border-border-default rounded-card grid grid-cols-2 border md:grid-cols-4"
      >
        {cells.map((cell) => (
          <div
            key={cell.id}
            data-returns-cell={cell.id}
            /*
              Dividers between cells, never around the block — the border above
              already encloses it. `-mt-px`-style tricks are avoided by drawing
              only left and top borders and suppressing them on the first
              column and row at each breakpoint.
            */
            className="border-border-default flex flex-col items-center gap-1 border-t border-l p-4 first:border-l-0 md:border-t-0 [&:nth-child(-n+2)]:border-t-0 md:[&:nth-child(3)]:border-l"
          >
            <span className="text-caption text-content-muted text-center">{cell.label}</span>
            <span
              className={
                cell.tone === 'success'
                  ? 'text-body-lg text-success text-center font-semibold tabular-nums'
                  : cell.tone === 'brand'
                    ? 'text-body-lg text-content-brand text-center font-semibold tabular-nums'
                    : 'text-body-lg text-content text-center font-semibold tabular-nums'
              }
            >
              {cell.value}
            </span>
          </div>
        ))}
      </div>

      {/*
        **Per Instalment** — required by C4 for every non-cumulative payout, and
        the figure that stops the other three reading as wrong ones. A strip
        showing "Maturity Amount ₹5,00,000" beside "Total Interest ₹72,500" looks
        like a bug until it also says the interest arrives monthly.

        A labelled figure rather than a fifth cell: the approved strip is four
        cells wide, and adding a fifth would reflow a layout this task may not
        redesign. It sits directly beneath, inside the same live region, so a
        screen reader hears it as part of the same recalculation.

        Only when there is a whole instalment to name — a term shorter than one
        payout period pays nothing periodically, and claiming otherwise would be
        worse than saying nothing.
      */}
      {!isCumulative && instalmentAmount !== null ? (
        <div
          aria-live="polite"
          data-returns-cell="instalment"
          className="bg-surface-subtle rounded-card flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
        >
          <span className="text-caption text-content-muted">
            Per Instalment ({PAYOUT_OPTION_LABELS[payoutOption].toLowerCase()})
          </span>
          {/*
            "approx." is not hedging — it is accurate. A rupee-rounded instalment
            cannot divide an arbitrary total evenly: ₹72,500 over 24 months is
            ₹3,020.83, shown as ₹3,021, which multiplies back to ₹72,504. Banks
            resolve the difference in the final instalment. Presenting the figure
            as exact would invite a user to multiply it and find the platform
            four rupees out.
          */}
          <span className="text-body text-content font-semibold tabular-nums">
            ~{formatCurrency(instalmentAmount)}
          </span>
          <p className="text-caption text-content-muted w-full">
            Your interest is paid out {PAYOUT_OPTION_LABELS[payoutOption].toLowerCase()} —
            approximately {formatCurrency(instalmentAmount)} each time, with any rounding difference
            settled in the final payment. The principal of {formatCurrency(result.principal)} is
            returned at maturity.
          </p>
        </div>
      ) : null}

      {/*
        The approved disclaimer, verbatim. It is the screen's own statement that
        these are estimates — and, given that the platform engine and the design
        artwork disagree by ₹10,792 (conflict C2, still open with Design), the
        sentence is currently carrying more weight than it was drawn to.
      */}
      <p className="text-caption text-content-muted">
        * The above calculation is an estimate. Actual returns may vary based on bank terms and
        conditions.
      </p>
    </div>
  );
}
