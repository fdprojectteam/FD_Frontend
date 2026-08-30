import type { NewBankAccountInput } from '@/services/bank-accounts';
import type { BankAccountType } from '@/types/bank-account';

/**
 * What the add form accepts, and what it refuses.
 *
 * ## Pure, so the rules are testable without a screen
 *
 * Every decision the form makes is a function of what has been typed. Keeping
 * that here means the rules can be asserted directly, and the component is left
 * with rendering — the same split `investment-schema.ts` uses for Booking.
 *
 * ## The whole account number exists here and nowhere else
 *
 * `AccountEntryDraft` is component state on one screen. Nothing derived from it
 * carries the full number: `toNewAccount` returns the last four digits, and the
 * canonical type has no field that could hold more. This is the only place in
 * the product where a complete account number is a value at all, and it lives
 * for as long as the customer is on the form.
 *
 * ## Typed twice, on purpose
 *
 * The one input a customer cannot check by reading it back is a long string of
 * digits. Confirming it is the cheapest defence against a transposed pair —
 * cheaper than any amount of validation, because no format check can tell a
 * valid wrong account from a valid right one.
 */

export interface AccountEntryDraft {
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  accountHolderName: string;
  accountType: BankAccountType;
}

export const EMPTY_ACCOUNT_ENTRY: AccountEntryDraft = {
  accountNumber: '',
  confirmAccountNumber: '',
  ifsc: '',
  accountHolderName: '',
  accountType: 'savings',
};

/**
 * Indian account numbers run from about 9 to 18 digits and differ by bank.
 *
 * The bounds are deliberately wide: **no source in this repository states a
 * per-bank length**, and a narrower rule would reject real accounts to look
 * precise. What is enforced is that it is digits, and enough of them to be an
 * account number rather than a slip of the keyboard.
 */
export const MIN_ACCOUNT_DIGITS = 9;
export const MAX_ACCOUNT_DIGITS = 18;

/** Digits only — a stray space or dash is a silent mismatch later. */
export function toAccountDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, MAX_ACCOUNT_DIGITS);
}

/** The last four, which is all that survives this screen. */
export function lastFourOf(accountNumber: string): string {
  return accountNumber.slice(-4);
}

export type AccountEntryField =
  'accountNumber' | 'confirmAccountNumber' | 'ifsc' | 'accountHolderName';

export type AccountEntryErrors = Partial<Record<AccountEntryField, string>>;

/**
 * What is wrong, in the customer's words.
 *
 * Only reports a field once the customer could reasonably have finished it —
 * the component decides when to show these, and this decides what they say.
 * `ifscResolved` is passed in rather than looked up here, so this stays pure
 * and the directory stays a service.
 */
export function validateAccountEntry(
  draft: AccountEntryDraft,
  ifscResolved: boolean,
): AccountEntryErrors {
  const errors: AccountEntryErrors = {};

  if (draft.accountNumber.length < MIN_ACCOUNT_DIGITS) {
    errors.accountNumber = `An account number is at least ${String(MIN_ACCOUNT_DIGITS)} digits.`;
  }

  if (draft.confirmAccountNumber !== draft.accountNumber) {
    errors.confirmAccountNumber = 'The two account numbers do not match.';
  }

  if (!ifscResolved) {
    errors.ifsc = 'Bank details couldn’t be identified from this IFSC.';
  }

  if (draft.accountHolderName.trim() === '') {
    errors.accountHolderName = 'Tell us the name the account is held in.';
  }

  return errors;
}

export function isAccountEntryComplete(draft: AccountEntryDraft, ifscResolved: boolean): boolean {
  return Object.keys(validateAccountEntry(draft, ifscResolved)).length === 0;
}

export interface ResolvedInstitution {
  institution: { name: string; initials: string };
  branch: { name: string; city: string } | null;
  ifsc: string;
}

/**
 * The record to save — with the account number already reduced to four digits.
 *
 * Returns `null` rather than a partial account when anything is missing, so
 * there is no path on which an incomplete record reaches the vault.
 */
export function toNewAccount(
  draft: AccountEntryDraft,
  resolved: ResolvedInstitution | null,
): NewBankAccountInput | null {
  if (resolved === null) return null;
  if (!isAccountEntryComplete(draft, true)) return null;

  return {
    institution: resolved.institution,
    lastFourDigits: lastFourOf(draft.accountNumber),
    accountHolderName: draft.accountHolderName.trim(),
    ifsc: resolved.ifsc,
    branch: resolved.branch,
    accountType: draft.accountType,
  };
}
