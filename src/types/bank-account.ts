/**
 * An account the customer holds **at another institution**.
 *
 * ## One vault, not one per product
 *
 * Booking used to own its own `BankAccount` type and its own hard-coded list of
 * three. That was fine while a bank account existed only to fund a fixed
 * deposit — and wrong the moment anything else needed one. An account is a
 * property of the *customer*, not of the transaction that happens to use it, so
 * the vocabulary is platform-level and every domain refers to the same record:
 *
 * ```
 * Customer → Bank Account Vault → ExternalBankAccount
 *                                   ├── funds a booking
 *                                   ├── receives supported proceeds
 *                                   └── future products
 * ```
 *
 * `External` is deliberate. A platform account — one this product itself holds
 * for the customer — is a different thing with different rules, and naming this
 * one honestly leaves room for it without pretending it exists.
 *
 * ## The full account number is not in this type
 *
 * There is no field for it, so nothing can render it, log it, put it in a URL,
 * or persist it. `lastFourDigits` is what the customer needs in order to
 * recognise their own account, and the entry form is the only place the whole
 * number exists at all — in component state, on the way to being reduced to
 * four digits. Document 19 §Security requires account numbers to be protected
 * at rest; a type that cannot hold one cannot fail to.
 *
 * ## "Details entered" and "ownership verified" are different facts
 *
 * A customer typing an account number tells the platform what they *say* they
 * own. Confirming that they own it requires a provider this build does not
 * have. `BankAccountVerification` keeps the two apart, and its shape makes the
 * dishonest claim unrepresentable — see below.
 */

export type BankAccountType = 'savings' | 'current';

/**
 * How ownership was established.
 *
 * One member, because one is all this build can produce. A penny drop, a bank
 * API or an account-aggregator consent flow each arrives as a new member with
 * the integration that justifies it — never as a relabelling of a demo.
 */
export type BankAccountVerificationMethod = 'demo';

/**
 * Where an account stands.
 *
 * A discriminated union rather than a status string beside optional metadata:
 * a `verified` account **must** carry how and when it was verified, and an
 * unverified one has no `verifiedAt` to render. The type is what stops a screen
 * from printing "Verified by bank" over a record nobody checked.
 *
 * - `unverified` — details supplied, ownership not established. The state every
 *   newly added account starts in, because nothing has checked it.
 * - `verification-pending` — a check is genuinely under way. Only reachable
 *   when something is actually running; this build's demo check is instant, so
 *   it is modelled but not produced.
 * - `verified` — ownership established, by `method`, at `verifiedAt`.
 * - `verification-failed` — a check ran and did not pass.
 * - `needs-attention` — the account is usable in principle but something about
 *   it needs a human decision, such as a name that does not match the record on
 *   file.
 */
export type BankAccountVerification =
  | { status: 'unverified' }
  | { status: 'verification-pending'; requestedAt: number }
  | { status: 'verified'; method: BankAccountVerificationMethod; verifiedAt: number }
  | { status: 'verification-failed'; reason: string; failedAt: number }
  | { status: 'needs-attention'; reason: string };

export type BankAccountVerificationStatus = BankAccountVerification['status'];

/** The institution, as far as the IFSC directory could identify it. */
export interface BankInstitution {
  name: string;
  /** Two letters for the avatar, as `Bank` carries elsewhere in the platform. */
  initials: string;
}

/** Where the account is held. `null` when the IFSC resolved to a bank but no branch. */
export interface BankBranch {
  name: string;
  city: string;
}

export interface ExternalBankAccount {
  /**
   * Opaque, and deliberately carries no part of the account number.
   *
   * The id appears in URLs. `acc-hdfc-4521` would have put the digits the
   * screen masks into the address bar, the browser history and any referrer —
   * masking on screen and leaking in the URL is not masking.
   */
  id: string;
  institution: BankInstitution;
  /**
   * The last four digits, and nothing more.
   *
   * A string rather than a number: leading zeros are significant in an account
   * number, and `0045` must not become `45`.
   */
  lastFourDigits: string;
  accountHolderName: string;
  ifsc: string;
  branch: BankBranch | null;
  accountType: BankAccountType;
  verification: BankAccountVerification;
  /** The default account for supported funding and payout flows. At most one. */
  isPrimary: boolean;
  /** Epoch ms the account was added to the vault. */
  createdAt: number;
}
