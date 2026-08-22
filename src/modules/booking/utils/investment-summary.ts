import { formatCurrency, formatRate, formatTenure } from '@/utils/format';

import { resolveRate } from './tenure-rates';
import { PAYOUT_OPTION_LABELS } from '../constants/payout-options';
import type {
  DemoTermId,
  DepositTerms,
  InvestmentSummaryRow,
  SelectedDeposit,
} from '../types/booking';
import type { InvestmentConfiguration } from '../types/draft';

/**
 * buildInvestmentSummaryRows — the Investment Summary panel's row model (T3.1).
 *
 * The Booking equivalent of `buildCompareRows`, and it exists for the same
 * reason: the panel is a **derivation**, not a layout. Nine labelled values in a
 * fixed order, each formatted by the platform's own formatters — that is logic,
 * and logic in JSX is logic that cannot be tested without rendering.
 *
 * Pure and React-free: no hooks, no service, no router. Give it a deposit, get
 * rows back.
 *
 * **Every money and rate string goes through `@/utils/format`.** `AmountDisplay`
 * exists so that ₹1,07,978 is grouped the Indian way everywhere; a panel that
 * built "₹5,00,000" with its own template would be the second implementation of
 * that rule, and the two would diverge on the first product priced in crores.
 * These rows are strings rather than components because the panel is a
 * definition list of heterogeneous values — ranges and word lists sit beside
 * amounts, and only some of them are money.
 */
/**
 * Copy for a term the product does not publish.
 *
 * Deliberately a statement of fact rather than a dash: a blank row reads as a
 * rendering fault, and a placeholder figure reads as a bank term.
 *
 * ## Why it no longer says "Confirmed with the bank"
 *
 * Because nothing has been. There is no bank integration in this build, so a
 * row claiming a value was confirmed with the partner bank asserted something
 * that had not happened — on the screen where a customer decides to commit
 * money, and in front of investors being shown the product. "Not specified" is
 * what is actually true: the catalogue does not carry this term.
 *
 * The rule this encodes: **never present an absent value as a bank-confirmed
 * fact.** An invariant holds the phrase out of the codebase.
 */
const NOT_PUBLISHED = 'Not specified';

/**
 * Drops the rows this deposit has nothing to say about.
 *
 * ## Why omit rather than list
 *
 * Stating "Not specified" three times in a seven-row panel reads as a broken
 * screen, not as candour — and on the summary a customer uses to decide, a
 * column of absences is worse than a shorter, complete list. A summary should
 * say what this deposit *is*.
 *
 * This is not the honesty rule being softened. The rule is **never present an
 * absent value as a fact**, and omitting the row satisfies it more cleanly than
 * printing a placeholder: nothing is claimed, and nothing invites the reader to
 * infer a term the catalogue does not carry. The moment the catalogue publishes
 * one, the row returns with a real figure and no other change.
 */
function withoutUnpublished(rows: InvestmentSummaryRow[]): InvestmentSummaryRow[] {
  return rows.filter((row) => row.value !== NOT_PUBLISHED);
}

/** Whether this deposit carries a real value for a given term. */
function isDemo(deposit: SelectedDeposit, id: DemoTermId): boolean {
  return deposit.demoTerms?.includes(id) === true;
}

/**
 * A row's value, or the unpublished statement when the term is a placeholder.
 *
 * Every demo-marked field goes through here, so a placeholder can never reach
 * the screen dressed as a published term.
 */
function published(deposit: SelectedDeposit, id: DemoTermId, value: string): string {
  return isDemo(deposit, id) ? NOT_PUBLISHED : value;
}

export function buildInvestmentSummaryRows(deposit: SelectedDeposit): InvestmentSummaryRow[] {
  const { terms } = deposit;

  return withoutUnpublished([
    { id: 'bank', icon: 'bank', label: 'Partner Bank', value: deposit.bank.name },
    { id: 'product', icon: 'product', label: 'Product Name', value: deposit.productName },
    {
      id: 'rate',
      icon: 'rate',
      label: 'Interest Rate (p.a.)',
      value: formatRate(terms.interestRate),
      // The one figure the approved screen emphasises: it is why the user
      // chose this deposit, and the row they will look for first.
      emphasis: true,
    },
    {
      id: 'min-investment',
      icon: 'min-investment',
      label: 'Min. Investment',
      value: formatCurrency(terms.minInvestment),
    },
    {
      id: 'max-investment',
      icon: 'max-investment',
      label: 'Max. Investment',
      value: published(deposit, 'max-investment', formatCurrency(terms.maxInvestment)),
    },
    /*
      The advertised range where the product publishes one; otherwise the term
      this deposit actually runs for, which the catalogue does carry. Real data
      in both branches — the row states a fact rather than an absence.
    */
    isDemo(deposit, 'tenure-range')
      ? {
          id: 'tenure',
          icon: 'tenure' as const,
          label: 'Tenure',
          value: terms.tenureMonths > 0 ? formatTenure(terms.tenureMonths) : NOT_PUBLISHED,
        }
      : {
          id: 'tenure',
          icon: 'tenure' as const,
          label: 'Tenure Options',
          value: formatTenureRange(terms.tenureRange),
        },
    {
      id: 'payout',
      icon: 'payout',
      label: 'Interest Payout Options',
      // A comma-joined list rather than a sentence, so a bank offering two
      // payout types reads correctly without anyone rewriting the copy.
      value: published(deposit, 'payout-options', terms.payoutOptions.join(', ')),
    },
    {
      id: 'withdrawal',
      icon: 'withdrawal',
      label: 'Premature Withdrawal',
      value: published(
        deposit,
        'premature-withdrawal',
        WITHDRAWAL_LABEL[terms.prematureWithdrawal],
      ),
    },
    {
      id: 'renewal',
      icon: 'renewal',
      label: 'Auto Renewal',
      value: published(deposit, 'auto-renewal', terms.autoRenewal ? 'Available' : 'Not available'),
    },
  ]);
}

/**
 * The **configured** summary — the right rail of the Investment Details screen
 * (T3.2.7).
 *
 * A second builder beside `buildInvestmentSummaryRows`, not a replacement, and
 * the difference is the whole point:
 *
 * - **Overview** lists what the product *can* do — `Tenure Options 7 Days – 10
 *   Years`, `Interest Payout Options  Monthly, Quarterly, Cumulative, At
 *   Maturity`. Nine rows, no bank header.
 * - **Investment Details** lists what the user *has chosen* — `Tenure 24
 *   Months`, `Interest Payout At Maturity`. Seven rows, with the bank named
 *   above them.
 *
 * That is two row models, one panel. Reading the approved artwork side by side
 * is what makes it unambiguous: the same card carries capability on one screen
 * and configuration on the next.
 *
 * ## Unset values
 *
 * The controls that populate this arrive in T3.2.8–T3.2.10, so on the shell the
 * tenure and payout rows have nothing to state. They render an em dash with a
 * "Not selected yet" reading rather than being omitted: a row that disappears
 * makes the panel change height as the user fills the form, and a rail that
 * reflows while you are reading it is worse than one with two blanks in it.
 *
 * ## The rate row
 *
 * Once a tenure is chosen the rate shown is the one **resolved for that
 * tenure**, not the headline. A rail that kept advertising 7.25% beside a
 * tenure priced at 6.90% would be the exact defect the tenure→rate model was
 * built to prevent (T3.2.4b).
 *
 * Before a tenure is chosen there is nothing to resolve, so the row shows the
 * product's headline rate — which is what the product is advertised at and what
 * the Overview screen has already shown. That is not a fallback for an unpriced
 * tenure; `resolveTenureRate` still returns `null` for those, and this function
 * never substitutes the headline once a tenure is actually selected.
 *
 * Pure and React-free, like its sibling.
 */
export function buildConfiguredSummaryRows(
  deposit: SelectedDeposit,
  configuration: InvestmentConfiguration,
): InvestmentSummaryRow[] {
  const { terms } = deposit;
  const { tenureMonths, payoutOption } = configuration;

  /*
    `resolveTenureRate` is the only source of a tenure's rate. When no tenure is
    selected there is no tenure to price, so the headline stands; when one is
    selected and unpriced the row states that plainly rather than inventing a
    figure.
  */
  const resolvedRate =
    tenureMonths === null
      ? terms.interestRate
      : (resolveRate(terms, { tenureMonths })?.annualRate ?? null);

  return withoutUnpublished([
    {
      id: 'rate',
      icon: 'rate',
      label: 'Interest Rate (p.a.)',
      value: resolvedRate === null ? NOT_AVAILABLE : formatRate(resolvedRate),
      emphasis: true,
    },
    {
      id: 'min-investment',
      icon: 'min-investment',
      label: 'Min. Investment',
      value: formatCurrency(terms.minInvestment),
    },
    {
      id: 'max-investment',
      icon: 'max-investment',
      label: 'Max. Investment',
      value: published(deposit, 'max-investment', formatCurrency(terms.maxInvestment)),
    },
    {
      id: 'tenure',
      icon: 'tenure',
      label: 'Tenure',
      value: tenureMonths === null ? NOT_SELECTED : formatTenure(tenureMonths),
    },
    {
      id: 'payout',
      icon: 'payout',
      label: 'Interest Payout',
      value: payoutOption === null ? NOT_SELECTED : PAYOUT_OPTION_LABELS[payoutOption],
    },
    {
      id: 'withdrawal',
      icon: 'withdrawal',
      label: 'Premature Withdrawal',
      value: published(
        deposit,
        'premature-withdrawal',
        WITHDRAWAL_LABEL[terms.prematureWithdrawal],
      ),
    },
    {
      id: 'renewal',
      icon: 'renewal',
      label: 'Auto Renewal',
      value: published(deposit, 'auto-renewal', terms.autoRenewal ? 'Available' : 'Not available'),
    },
  ]);
}

/**
 * An em dash carries no meaning to a screen reader, so the words are the value
 * and the dash is not used at all. "Not selected yet" is also what a sighted
 * user needs: it says the row is waiting rather than that the product lacks the
 * feature.
 */
const NOT_SELECTED = 'Not selected yet';

/** A tenure the product does not price. Distinct from "not selected". */
const NOT_AVAILABLE = 'Not available for this tenure';

/**
 * "7 Days – 10 Years".
 *
 * An en dash, not a hyphen: it is a range, and the approved screen sets it as
 * one. Singulars are handled because "1 Days" is the kind of detail that makes a
 * financial product look unfinished.
 */
function formatTenureRange({ minDays, maxYears }: DepositTerms['tenureRange']): string {
  return `${plural(minDays, 'Day')} – ${plural(maxYears, 'Year')}`;
}

function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

const WITHDRAWAL_LABEL: Record<DepositTerms['prematureWithdrawal'], string> = {
  'allowed-with-terms': 'Allowed (Terms Apply)',
  allowed: 'Allowed',
  'not-allowed': 'Not allowed',
};

/**
 * The four figures in the deposit card's stat row.
 *
 * Derived here beside the summary rows rather than inline in the card, so the
 * two panels on this screen quote the same numbers from the same place. Tenure
 * uses the shared `formatTenure`, which is what the marketplace card and the
 * comparison table already speak.
 */
export function formatSelectedTenure(deposit: SelectedDeposit): string {
  return formatTenure(deposit.terms.tenureMonths);
}
