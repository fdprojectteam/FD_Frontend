import type {
  BankAccountType,
  BankAccountVerification,
  ExternalBankAccount,
} from '@/types/bank-account';

/**
 * How an account is written and read across the product.
 *
 * ## Why this is platform-level rather than the vault module's
 *
 * Booking shows a funding account, the vault lists them, the account details
 * screen describes one, and the bank application prints one. Modules cannot
 * import each other, so a shared phrasing has to live here — otherwise the
 * booking screen and the vault would each grow their own way of saying
 * "verified", and one of them would eventually say something the other would
 * not.
 *
 * ## The wording is the honesty control
 *
 * `verificationLabel` never returns "Verified" alone for a demo check. It
 * returns **"Demo verified"**, because the only method this build has is a
 * simulation, and a customer reading a green tick is entitled to know what
 * checked it. Every screen goes through this function for exactly that reason.
 *
 * Pure and React-free.
 */

/** `•••• 4521` — what a customer sees, everywhere, without exception. */
export function maskAccountNumber(lastFourDigits: string): string {
  return `•••• ${lastFourDigits}`;
}

/**
 * "ending 4521" — the spoken form.
 *
 * `•••• 4521` is read aloud as "4521" at best and as nothing at worst, so the
 * accessible name says what the dots mean.
 */
export function spokenAccountNumber(lastFourDigits: string): string {
  return `ending ${lastFourDigits}`;
}

export const ACCOUNT_TYPE_LABEL: Record<BankAccountType, string> = {
  savings: 'Savings account',
  current: 'Current account',
};

/** How this build describes the only check it can perform. */
export const DEMO_VERIFICATION_LABEL = 'Demo verified';

/**
 * What to call this account's state, in the customer's words.
 *
 * The `verified` case is the one that matters: it names the method, so the
 * screen cannot imply a bank confirmed anything.
 */
export function verificationLabel(verification: BankAccountVerification): string {
  switch (verification.status) {
    case 'verified':
      return DEMO_VERIFICATION_LABEL;
    case 'verification-pending':
      return 'Verification in progress';
    case 'verification-failed':
      return 'Verification failed';
    case 'needs-attention':
      return 'Needs your attention';
    case 'unverified':
      return 'Not verified';
  }
}

/**
 * The sentence under the label.
 *
 * Every branch states a fact about *this build*, not a promise about the next
 * one: an unverified account says why nothing has checked it, rather than
 * "verification coming soon".
 */
export function verificationDescription(verification: BankAccountVerification): string {
  switch (verification.status) {
    case 'verified':
      return 'Ownership was confirmed by a simulated check in this demonstration build. No bank or verification provider was contacted.';
    case 'verification-pending':
      return 'A check is under way. The account cannot be used until it completes.';
    case 'verification-failed':
      return verification.reason;
    case 'needs-attention':
      return verification.reason;
    case 'unverified':
      return 'You have given us these details, but nothing has confirmed that the account is yours. No verification provider is connected in this build.';
  }
}

/**
 * Whether an account may fund a booking.
 *
 * One predicate, asked by the vault, by the booking step and by the removal
 * rules — so "usable" cannot mean three different things. Only a verified
 * account qualifies, which is spec 21e §8 Rule 3 applied to the canonical
 * record rather than to a screen.
 */
export function isUsableForFunding(account: ExternalBankAccount): boolean {
  return account.verification.status === 'verified';
}

/** The primary account, or `null` when none is set. */
export function primaryAccount(
  accounts: readonly ExternalBankAccount[],
): ExternalBankAccount | null {
  return accounts.find((account) => account.isPrimary) ?? null;
}

/**
 * The account a flow should start on.
 *
 * The primary one if it can be used, otherwise the first that can. Never an
 * unusable account: pre-selecting one would put the customer on a choice the
 * screen has already rejected.
 */
export function defaultFundingAccount(
  accounts: readonly ExternalBankAccount[],
): ExternalBankAccount | null {
  const primary = primaryAccount(accounts);
  if (primary !== null && isUsableForFunding(primary)) return primary;

  return accounts.find((account) => isUsableForFunding(account)) ?? null;
}

/** `Axis Bank •••• 4587` — one account named in a single line. */
export function describeAccount(account: ExternalBankAccount): string {
  return `${account.institution.name} ${maskAccountNumber(account.lastFourDigits)}`;
}
