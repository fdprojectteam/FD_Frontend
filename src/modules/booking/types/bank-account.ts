/**
 * The funding account a booking is paid from (spec 21e, Screen 4).
 *
 * ## Why the full account number is not in this type
 *
 * Spec 21e §8 Rule 5 requires account numbers to be masked "always … except
 * during controlled entry", and Document 19 §Security classifies them as data
 * to be protected at rest. A type that cannot hold the full number cannot leak
 * it — the same reasoning `BookingHandoff` uses to make a rate unforwardable.
 *
 * `lastFourDigits` is what the approved artwork displays and what the platform
 * needs in order to say *"debited from your account ending 4587"*. Anything
 * more belongs to the partner bank.
 *
 * ## Verification is a status, not a boolean
 *
 * Spec 21e §5D names three states and §8 Rule 3 blocks progression on one of
 * them. A boolean would collapse "pending" and "failed" into the same thing,
 * and those need different words on screen and different recovery.
 */
export type BankAccountType = 'savings' | 'current';

export type BankAccountVerification = 'verified' | 'pending' | 'failed';

export interface BankAccount {
  id: string;
  bankName: string;
  /** Two letters for the avatar, as `Bank` carries elsewhere in the platform. */
  bankInitials: string;
  accountHolderName: string;
  /**
   * The last four digits, and nothing more.
   *
   * A string rather than a number: leading zeros are significant in an account
   * number and `0045` must not become `45`.
   */
  lastFourDigits: string;
  accountType: BankAccountType;
  ifsc: string;
  verification: BankAccountVerification;
  /** The account the artwork badges "Primary Account"; pre-selected on arrival. */
  isPrimary: boolean;
}
