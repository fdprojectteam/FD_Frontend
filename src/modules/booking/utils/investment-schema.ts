import { formatCurrency, formatTenure } from '@/utils/format';

import { isSupportedTenure, selectableTenures } from './tenure-rates';
import type { DepositTerms } from '../types/booking';
import type { InvestmentConfiguration, PayoutOptionId } from '../types/draft';

/**
 * Investment configuration validation (T3.2.6).
 *
 * Implements the business rules the Details phase is accountable for:
 *
 * | Rule | Meaning |
 * |---|---|
 * | **BR-INV-001** | amount ≥ the product minimum |
 * | **BR-INV-002** | amount ≤ the product maximum |
 * | **BR-INV-003** | amount in the product's supported increment |
 * | spec 21b §8 | tenure must be one the product supports |
 * | spec 21b §8 | payout option must exist for the product |
 * | **FR-CONF-001** | validation runs immediately after a change |
 *
 * ## Messages are the feature, not a by-product
 *
 * Founder Vision §4 requires senior-citizen usability — *"plain English"* — and
 * spec 21b §9 gives the exact standard:
 *
 * > Instead of ❌ *"Invalid Amount"*, show
 * > ✅ *"Increase your investment by ₹2,000 to qualify for this FD."*
 *
 * So every message here states **what to do**, not what is wrong. That is why
 * validation returns rendered strings rather than error codes: the shortfall has
 * to be computed to be stated, and computing it in the component would put this
 * rule in three places.
 *
 * ## Why not Zod
 *
 * Zod validates a shape; these rules validate a value **against a product**.
 * Minimum, maximum, increment, tenure list and payout list are all per-product
 * data, so a static schema would have to be rebuilt on every keystroke and each
 * message would still need the arithmetic below. A plain function is smaller,
 * faster and directly testable. Zod is still the right tool at the storage
 * boundary, where the shape is fixed and untrusted — see `draft-storage.ts`.
 *
 * Pure and React-free.
 */

export type InvestmentField = 'amount' | 'tenureMonths' | 'payoutOption';

export interface FieldError {
  field: InvestmentField;
  /** Plain-English, actionable, ready to render. */
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
  /** Convenience for per-field display: at most one message per field. */
  byField: Partial<Record<InvestmentField, string>>;
}

/**
 * Validates the amount alone.
 *
 * Separate from the whole-configuration check because the amount field must
 * report as the user types, while tenure and payout cannot be "in progress" —
 * they are chosen from a list or not chosen at all.
 */
export function validateAmount(amount: number | null, terms: DepositTerms): string | null {
  if (amount === null) return 'Enter the amount you want to invest.';

  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Enter the amount you want to invest.';
  }

  /*
    Whole rupees only.

    Checked *before* the range rules on purpose: ₹4,99,999.50 is both fractional
    and below the minimum, and "enter a whole rupee amount" is the more useful
    of the two messages — it names the thing the user can actually see is wrong
    with what they typed.

    Unreachable from the UI (the field strips non-digits, quick amounts are
    integers), so this guards a hand-edited draft or a future API rather than a
    typo. The persisted schema refuses the same value independently.
  */
  if (!Number.isInteger(amount)) {
    return `Enter a whole rupee amount — ${formatCurrency(Math.round(amount))}, for example.`;
  }

  // BR-INV-001 — say how much more, not that it is wrong.
  if (amount < terms.minInvestment) {
    const shortfall = terms.minInvestment - amount;
    return `Increase your investment by ${formatCurrency(shortfall)} to qualify for this FD. The minimum is ${formatCurrency(terms.minInvestment)}.`;
  }

  // BR-INV-002 — same shape, other direction.
  if (amount > terms.maxInvestment) {
    const excess = amount - terms.maxInvestment;
    return `Reduce your investment by ${formatCurrency(excess)}. The maximum for this FD is ${formatCurrency(terms.maxInvestment)}.`;
  }

  /*
    BR-INV-003 — increments.

    Measured from the minimum, not from zero. A product with a ₹10,000 minimum
    and a ₹1,000 increment accepts ₹15,000; measuring from zero would reach the
    same verdict here but the wrong one wherever a minimum is not itself a
    multiple of the increment, which is a normal thing for a bank to publish.

    `investmentIncrement` is optional, and absent means any amount inside the
    range is acceptable — the fixture's product has no increment rule, and
    inventing one would be inventing a business rule.
  */
  const increment = terms.investmentIncrement;
  if (increment && increment > 0) {
    const excessOverMinimum = amount - terms.minInvestment;
    const remainder = excessOverMinimum % increment;

    if (remainder !== 0) {
      const nextValid = amount + (increment - remainder);
      return `This FD accepts amounts in steps of ${formatCurrency(increment)}. Try ${formatCurrency(nextValid)}.`;
    }
  }

  return null;
}

/**
 * Validates the tenure against the product's **rate card**, not its advertised
 * range.
 *
 * `tenureRange` says "7 Days – 10 Years" on the summary panel; that is marketing
 * copy, not a list of terms the bank has priced. A tenure with no rate cannot be
 * quoted, so it cannot be booked — see `tenure-rates.ts`.
 */
export function validateTenure(tenureMonths: number | null, terms: DepositTerms): string | null {
  if (tenureMonths === null) return 'Choose how long you want to invest for.';

  if (isSupportedTenure(terms, tenureMonths)) return null;

  const available = selectableTenures(terms);

  if (available.length === 0) {
    return 'This FD has no tenures available right now. Please choose another product.';
  }

  const list = available.map((rate) => formatTenure(rate.tenureMonths));
  const readable =
    list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} or ${list[list.length - 1]}`;

  return `This FD is available for ${readable}. Choose one of these to continue.`;
}

export function validatePayoutOption(
  payoutOption: PayoutOptionId | null,
  terms: DepositTerms,
  supportedIds: readonly PayoutOptionId[],
): string | null {
  if (payoutOption === null) return 'Choose how you want to receive your interest.';

  if (!supportedIds.includes(payoutOption)) {
    return `This FD does not offer that payout option. Available options are ${terms.payoutOptions.join(', ')}.`;
  }

  return null;
}

/**
 * Whole-configuration validation — what Continue is gated on (FR-CONF-001).
 *
 * Reports **every** failing field rather than stopping at the first. A form that
 * reveals one problem at a time makes the user submit repeatedly to discover how
 * many there are, which is the opposite of the guided experience the module
 * summary asks for.
 *
 * Field order is the screen's reading order, so the first error is also the
 * topmost — which is where focus should go.
 */
export function validateInvestmentConfiguration(
  configuration: InvestmentConfiguration,
  terms: DepositTerms,
  supportedPayouts: readonly PayoutOptionId[],
): ValidationResult {
  const candidates: FieldError[] = [
    { field: 'amount' as const, message: validateAmount(configuration.amount, terms) },
    { field: 'tenureMonths' as const, message: validateTenure(configuration.tenureMonths, terms) },
    {
      field: 'payoutOption' as const,
      message: validatePayoutOption(configuration.payoutOption, terms, supportedPayouts),
    },
  ].filter((entry): entry is FieldError => entry.message !== null);

  const byField: Partial<Record<InvestmentField, string>> = {};
  for (const error of candidates) byField[error.field] = error.message;

  return { isValid: candidates.length === 0, errors: candidates, byField };
}
