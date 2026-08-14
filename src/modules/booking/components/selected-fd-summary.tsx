import { CalendarDays, IndianRupee, Lock, Percent, ShieldCheck, Star } from 'lucide-react';
import type { ReactNode } from 'react';

import { BankBadge } from '@/components/business/bank-badge';
import { InterestRateDisplay } from '@/components/business/interest-rate-display';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

import { ImportantInformation } from './important-information';
import type { DepositHighlightId, SelectedDeposit } from '../types/booking';
import { formatSelectedTenure } from '../utils/investment-summary';

/**
 * SelectedFdSummary — "the FD you chose", the left column of the approved
 * Overview screen (T3.1).
 *
 * The screen exists to answer one question — *is this the deposit I meant?* —
 * so this component's job is recognition, not persuasion: the bank's own logo,
 * the product's name, the four figures that identify it, and the plain-language
 * description underneath.
 *
 * **Presentation-only** (I3). Every value arrives derived; nothing here
 * calculates, fetches, or navigates. The two figures that are formatted —
 * tenure and the minimum — go through the module's derivation util and the
 * platform formatters respectively, so this screen and the Investment Summary
 * beside it cannot disagree about the same number.
 *
 * **Composed from platform components**, not from copies of them: `BankBadge`
 * for the logo (with its monogram fallback and `next/image` handling),
 * `InterestRateDisplay` for the rate, `Badge` for the partner flag, `Card` for
 * the surface. The only bespoke markup is layout.
 */
const HIGHLIGHT_ICONS: Record<DepositHighlightId, typeof Percent> = {
  'guaranteed-returns': Percent,
  'secure-investment': Lock,
  'flexible-tenure': CalendarDays,
  'payout-options': IndianRupee,
  'regulated-bank': ShieldCheck,
};

export interface SelectedFdSummaryProps {
  deposit: SelectedDeposit;
  /** Notes for the callout that closes the card. */
  importantInformation: string[];
}

export function SelectedFdSummary({ deposit, importantInformation }: SelectedFdSummaryProps) {
  const { bank, terms } = deposit;

  return (
    <section aria-labelledby="selected-fd-heading" className="flex flex-col">
      {/*
        The approved "SELECTED FD" tab sits on the card's top-left edge. Rendered
        as a Badge in normal flow rather than absolutely positioned: an absolute
        tab would need a reserved gutter above the card and would collide with
        the product name at 320px.
      */}
      <Badge size="md" className="rounded-b-none px-3 py-1.5 font-semibold tracking-wide uppercase">
        Selected FD
      </Badge>

      <Card variant="outlined" className="rounded-tl-none">
        <div className="flex flex-col gap-4 p-5 md:p-6">
          {/*
            Wraps rather than truncates: the product name is the thing being
            confirmed, so on a narrow screen it takes a second line and the
            partner flag drops beneath it.
          */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <BankBadge bank={bank} size="lg" />

              <div className="flex min-w-0 flex-col gap-1">
                <h2 id="selected-fd-heading" className="text-h3 text-content break-words">
                  {deposit.productName}
                </h2>
                {/*
                  The tagline is partner marketing copy. A deposit derived from
                  the catalogue has none, so nothing is shown rather than the
                  approved product's line being reused as if it were this bank's.
                */}
                {deposit.demoTerms?.includes('tagline') === true ? null : (
                  <p className="text-body text-content-muted">{deposit.tagline}</p>
                )}
              </div>
            </div>

            {deposit.isPreferredPartner ? (
              <Badge variant="brand" leftIcon={<Star className="size-3" />}>
                Preferred Partner
              </Badge>
            ) : null}
          </div>
        </div>

        {/*
          The four identifying figures. Two columns below `md`, four from it —
          four across a 320px screen would give each figure roughly 70px, which
          is not enough for "₹5,00,000".

          A definition list, because that is what it is: each figure is a value
          with a name, and a screen reader should read them as pairs rather than
          as eight loose strings.
        */}
        <dl className="border-border-default grid grid-cols-2 border-t md:grid-cols-4">
          <Figure label="Interest Rate (p.a.)">
            <InterestRateDisplay rate={terms.interestRate} size="md" showCaption={false} />
          </Figure>
          <Figure label="Tenure">
            <span className="text-body-lg text-content font-semibold tabular-nums">
              {formatSelectedTenure(deposit)}
            </span>
          </Figure>
          <Figure label="Min. Investment">
            <span className="text-body-lg text-content font-semibold tabular-nums">
              {formatCurrency(terms.minInvestment)}
            </span>
          </Figure>
          <Figure label="Bank Rating">
            <span className="text-body-lg text-content inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck aria-hidden="true" className="text-success size-4" />
              {bank.rating ?? 'Not rated'}
            </span>
          </Figure>
        </dl>

        <div className="border-border-default flex flex-col gap-5 border-t p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-body-lg text-content font-semibold">About this Fixed Deposit</h3>
            <p className="text-body text-content-muted">{deposit.about}</p>
          </div>

          {/*
            The highlight row. Two columns on the narrowest phones, three from
            412px-ish is not expressible in this theme (no `sm`), so it steps
            straight to five from `md` — which is where the approved single row
            actually fits. Below that, two columns keep the labels readable
            instead of stacking five one-word columns.
          */}
          <ul className="grid list-none grid-cols-2 gap-y-5 md:grid-cols-5">
            {(deposit.demoTerms?.includes('highlights') === true ? [] : deposit.highlights).map(
              (highlight) => {
                const Icon = HIGHLIGHT_ICONS[highlight.id];

                return (
                  <li
                    key={highlight.id}
                    className="flex flex-col items-center gap-2 px-1 text-center"
                  >
                    <span className="bg-surface-brand-subtle text-content-brand flex size-10 items-center justify-center rounded-full">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-caption text-content-muted">{highlight.label}</span>
                  </li>
                );
              },
            )}
          </ul>

          <ImportantInformation notes={importantInformation} />
        </div>
      </Card>
    </section>
  );
}

/**
 * One figure in the identifying row.
 *
 * Local to this file on purpose: it is this card's internal rhythm — the
 * dividers between columns and the label/value order — not a pattern the
 * platform has approved. `KeyInfoGrid` is the Marketplace equivalent and cannot
 * be imported across the module boundary; if a third screen needs this, it is
 * promoted to `components/business`, not copied a third time.
 */
function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    /*
      `border-r` on odd columns only below `md` would need a selector the
      utility layer does not have, so the divider is drawn on every cell and
      clipped by the grid's own edge. Vertical padding is the approved rhythm.
    */
    <div className="border-border-default flex flex-col items-center gap-1 border-b p-4 text-center last:border-b-0 md:border-b-0 md:not-last:border-r">
      <dd className="order-1 flex items-center justify-center">{children}</dd>
      <dt className="text-caption text-content-muted order-2">{label}</dt>
    </div>
  );
}
