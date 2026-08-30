import type { MaturityInstruction } from '@/types/portfolio';

/**
 * The investor's maturity choice, from whichever bank's form asked it.
 *
 * ## Why a translation exists at all
 *
 * SBI and AU ask the same question with different option values —
 * `renew-principal-payback-interest` against `renew-principal-repay-interest`
 * for the same instruction. Those strings belong to the banks' forms; the
 * portfolio needs one vocabulary it can reason about, so this is where the two
 * meet.
 *
 * It lives in Booking because Booking is what knows the templates. The
 * portfolio never sees a bank's own option id.
 *
 * ## Unrecognised means unknown, never a default
 *
 * An id this map does not cover yields `null`, and the maturity screens say the
 * instruction is not recorded. Falling back to "renew" would tell someone their
 * money rolls over when the bank may be paying it out — the single most
 * consequential thing this module could get wrong.
 */
const BY_TEMPLATE_VALUE: Record<string, MaturityInstruction> = {
  /* SBI — Account Opening Form Part II §4. */
  'renew-principal-payback-interest': 'renew-principal-only',
  'renew-principal-and-interest': 'renew-principal-and-interest',
  'pay-principal-and-interest': 'pay-out',
  /* AU Small Finance Bank — Term Deposit Form. */
  'repay-principal-and-interest': 'pay-out',
  'renew-principal-repay-interest': 'renew-principal-only',
};

export function toMaturityInstruction(answer: string | undefined): MaturityInstruction | null {
  if (answer === undefined) return null;

  return BY_TEMPLATE_VALUE[answer] ?? null;
}
