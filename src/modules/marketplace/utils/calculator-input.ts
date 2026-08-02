import { z } from 'zod';

import { formatCurrency } from './format';

/**
 * Investment-calculator input validation (M2.6, T2.6.5).
 *
 * Zod, no React Hook Form (decision D5): the approved calculator has a single
 * editable field, and RHF plus a resolver is a meaningful addition to the
 * shared bundle for one input (Document 13). The validation *contract* is
 * still a schema, so introducing RHF later — for Booking's real forms — is a
 * change of plumbing, not of rules.
 *
 * Pure and React-free, so every rule is assertable without rendering.
 *
 * The 12-digit ceiling is not a new business rule: it mirrors `parseAmount` in
 * `url-values.ts`, which has bounded the Home search amount since M2.5. The
 * approved screen shows no maximum, so none is invented here.
 */
const MAX_DIGITS = 12;

export type CalculatorAmountResult = { ok: true; amount: number } | { ok: false; message: string };

/**
 * The minimum is per-product, so the schema is built per product rather than
 * declared once — the message has to name the actual figure.
 */
export function createAmountSchema(minInvestment: number) {
  return amountSchema().refine(
    (amount) => amount >= minInvestment,
    `This deposit starts at ${formatCurrency(minInvestment)}.`,
  );
}

/**
 * The shape rules, without a minimum.
 *
 * The comparison's deposit amount applies to **several** products at once, so
 * there is no single minimum it could be validated against — a per-product
 * minimum there would either reject an amount that three of four products
 * accept, or silently pick one product's rule for all of them. The minimum is
 * still enforced, but as a *per-column observation* rather than a field error
 * (see `CompareScreen`), which is why the two callers share these rules and
 * differ only in whether a floor is appended.
 */
function amountSchema() {
  return z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{1,${MAX_DIGITS}}$`), 'Enter an amount in rupees, digits only.')
    .transform(Number)
    .refine((amount) => amount > 0, 'Enter an amount greater than zero.');
}

/**
 * Validates a raw field value.
 *
 * Returns a plain result rather than a ZodError so the calculator never
 * handles Zod internals — the component applies a rule, it does not own one.
 */
export function parseCalculatorAmount(raw: string, minInvestment: number): CalculatorAmountResult {
  return toResult(createAmountSchema(minInvestment).safeParse(raw));
}

/** The comparison's deposit amount — same rules, no per-product floor. */
export function parseDepositAmount(raw: string): CalculatorAmountResult {
  return toResult(amountSchema().safeParse(raw));
}

function toResult(parsed: z.ZodSafeParseResult<number>): CalculatorAmountResult {
  if (parsed.success) return { ok: true, amount: parsed.data };

  return {
    ok: false,
    message: parsed.error.issues[0]?.message ?? 'Enter a valid amount.',
  };
}
