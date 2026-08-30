import { z } from 'zod';

import type { ExternalBankAccount } from '@/types/bank-account';

/**
 * The customer's bank account vault.
 *
 * ## One store, and it is this one
 *
 * Booking had a hard-coded list of three accounts inside its own module. Every
 * other domain that needed an account would have needed its own. This is the
 * canonical record: the vault writes it, and Booking, Portfolio and anything
 * later *refer to it by id*.
 *
 * ## What is kept, and what is refused
 *
 * Kept: the institution, the last four digits, the IFSC, the branch, the name
 * on the account, the type, the verification state and which one is primary.
 * That is what it takes to recognise an account and to fill in a bank form.
 *
 * Refused: the account number. `ExternalBankAccount` has no field for it, so
 * this store could not persist one if a caller tried. The whole number exists
 * only in the add form's own component state, for as long as it takes to check
 * the two entries match and take the last four digits.
 *
 * The name on the account is kept because an account belongs to a *named*
 * person and the platform has to be able to show a mismatch. It is the same
 * name the investor record already holds.
 *
 * ## `sessionStorage`, like every other client record here
 *
 * The same choice the booking draft and the holdings store make, for the same
 * reason: this build has no server and no authentication, so a record that
 * outlived the tab would be an unowned one. It also means the demonstration
 * starts clean.
 *
 * ## Seeded, because a demo customer has accounts
 *
 * A first read seeds the vault with the demonstration accounts — the same three
 * Booking used to hard-code, plus their verification states. Without them the
 * booking journey would begin at "add your first account", which is not the
 * journey this product is showing. `clearAccounts()` empties the vault and the
 * empty state is reachable from the screen itself, by removing them.
 */

const STORAGE_VERSION = 1;
const STORAGE_KEY = `fd:bank-accounts:v${STORAGE_VERSION}`;

const verificationSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('unverified') }),
  z.object({ status: z.literal('verification-pending'), requestedAt: z.number().int() }),
  z.object({
    status: z.literal('verified'),
    method: z.literal('demo'),
    verifiedAt: z.number().int(),
  }),
  z.object({
    status: z.literal('verification-failed'),
    reason: z.string().min(1),
    failedAt: z.number().int(),
  }),
  z.object({ status: z.literal('needs-attention'), reason: z.string().min(1) }),
]);

/**
 * The stored shape.
 *
 * `lastFourDigits` is pinned to exactly four digits by the schema, so a payload
 * that had somehow acquired a full account number fails to parse rather than
 * being read back and rendered.
 */
const accountSchema = z.object({
  id: z.string().min(1),
  institution: z.object({ name: z.string().min(1), initials: z.string().min(1) }),
  lastFourDigits: z.string().regex(/^\d{4}$/),
  accountHolderName: z.string().min(1),
  ifsc: z.string().min(1),
  branch: z.object({ name: z.string().min(1), city: z.string().min(1) }).nullable(),
  accountType: z.enum(['savings', 'current']),
  verification: verificationSchema,
  isPrimary: z.boolean(),
  createdAt: z.number().int().nonnegative(),
});

const payloadSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  accounts: z.array(accountSchema),
});

/** Storage access, guarded — private browsing and policy can both throw. */
function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * The demonstration vault.
 *
 * Two accounts a customer can use and one that needs a decision, so the states
 * this product models are visible rather than merely declared. Every one is
 * marked `method: 'demo'` where verified, and the screens say so.
 */
export const DEMO_BANK_ACCOUNTS: readonly ExternalBankAccount[] = [
  {
    id: 'ba-demo-axis',
    institution: { name: 'Axis Bank', initials: 'AB' },
    lastFourDigits: '4587',
    accountHolderName: 'Arjun Sharma',
    ifsc: 'UTIB0001234',
    branch: { name: 'Indiranagar', city: 'Bengaluru' },
    accountType: 'savings',
    verification: { status: 'verified', method: 'demo', verifiedAt: 0 },
    isPrimary: true,
    createdAt: 0,
  },
  {
    id: 'ba-demo-hdfc',
    institution: { name: 'HDFC Bank', initials: 'HB' },
    lastFourDigits: '2456',
    accountHolderName: 'Arjun Sharma',
    ifsc: 'HDFC0005678',
    branch: { name: 'Koramangala', city: 'Bengaluru' },
    accountType: 'savings',
    verification: { status: 'verified', method: 'demo', verifiedAt: 0 },
    isPrimary: false,
    createdAt: 0,
  },
  {
    id: 'ba-demo-icici',
    institution: { name: 'ICICI Bank', initials: 'IB' },
    lastFourDigits: '7890',
    accountHolderName: 'A. Sharma',
    ifsc: 'ICIC0009012',
    branch: { name: 'Anna Nagar', city: 'Chennai' },
    accountType: 'savings',
    /*
      A real and common situation, modelled rather than invented: the name on
      the account is not written the way the identity record has it. Nothing
      here decides whether that is the same person — a human does.
    */
    verification: {
      status: 'needs-attention',
      reason:
        'The name on this account (A. Sharma) does not match the name on your identity record. Confirm the account belongs to you before using it.',
    },
    isPrimary: false,
    createdAt: 0,
  },
] as const;

function write(accounts: readonly ExternalBankAccount[]): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, accounts }));
  } catch {
    /* Quota or policy. The list is still correct for this render. */
  }
}

/**
 * Every saved account, in the order they were added.
 *
 * A first read seeds the demonstration accounts. An unreadable or invalid
 * payload is treated as an empty vault rather than partially trusted — a
 * half-parsed bank account is worse than none.
 */
export function readAccounts(): ExternalBankAccount[] {
  const storage = safeStorage();
  if (!storage) return [...DEMO_BANK_ACCOUNTS];

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [...DEMO_BANK_ACCOUNTS];
  }

  if (raw === null) {
    const seeded = [...DEMO_BANK_ACCOUNTS];
    write(seeded);
    return seeded;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = payloadSchema.safeParse(parsed);
  return result.success ? result.data.accounts : [];
}

/** One account by id, or `null`. The lookup every other domain uses. */
export function findAccount(id: string | null): ExternalBankAccount | null {
  if (id === null) return null;
  return readAccounts().find((account) => account.id === id) ?? null;
}

/**
 * What the add flow supplies.
 *
 * Note what is absent: no id, no `createdAt`, no verification and no primary
 * flag. Those are the store's to decide — a caller that could set its own
 * verification state could add a "verified" account nobody checked.
 */
export interface NewBankAccountInput {
  institution: ExternalBankAccount['institution'];
  lastFourDigits: string;
  accountHolderName: string;
  ifsc: string;
  branch: ExternalBankAccount['branch'];
  accountType: ExternalBankAccount['accountType'];
}

/** Opaque, and carrying no part of the account number. */
function newAccountId(now: number): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `ba-${now.toString(36)}-${random}`;
}

/**
 * Adds an account.
 *
 * **Always `unverified`.** Nothing has checked that the customer owns it, and
 * the store is the last place that could quietly decide otherwise. It becomes
 * primary only when it is the first account, because a vault with accounts but
 * no default is a worse state than a single account being the default.
 */
export function addAccount(
  input: NewBankAccountInput,
  now: number = Date.now(),
): ExternalBankAccount[] {
  const existing = readAccounts();

  const account: ExternalBankAccount = {
    ...input,
    id: newAccountId(now),
    verification: { status: 'unverified' },
    isPrimary: existing.length === 0,
    createdAt: now,
  };

  const next = [...existing, account];
  write(next);
  return next;
}

/**
 * Makes one account primary, and therefore every other one not.
 *
 * Exactly one primary is an invariant of the vault, not a convention of the
 * screen: two defaults is a question no flow can answer.
 */
export function setPrimaryAccount(id: string): ExternalBankAccount[] {
  const existing = readAccounts();
  if (!existing.some((account) => account.id === id)) return existing;

  const next = existing.map((account) => ({ ...account, isPrimary: account.id === id }));
  write(next);
  return next;
}

/**
 * Records the demonstration's own check.
 *
 * Named for what it is. There is no provider, no penny drop and no consent
 * flow; this is the operator of a demo saying "treat this as verified", and the
 * resulting record says `method: 'demo'` forever after, which is what every
 * screen reads when it writes "Demo verified".
 */
export function markDemoVerified(id: string, now: number = Date.now()): ExternalBankAccount[] {
  const existing = readAccounts();

  const next = existing.map((account) =>
    account.id === id
      ? {
          ...account,
          verification: { status: 'verified' as const, method: 'demo' as const, verifiedAt: now },
        }
      : account,
  );

  write(next);
  return next;
}

/**
 * Removes an account.
 *
 * Refuses silently-unsafe removals: the caller decides *whether* removal is
 * allowed from the dependencies it can see, and this refuses the one rule the
 * store itself owns — the primary account cannot be removed while another
 * account exists, because that would leave the vault with no default and no
 * way to choose one.
 */
export function removeAccount(id: string): ExternalBankAccount[] {
  const existing = readAccounts();
  const target = existing.find((account) => account.id === id);
  if (target === undefined) return existing;

  if (target.isPrimary && existing.length > 1) return existing;

  const next = existing.filter((account) => account.id !== id);
  write(next);
  return next;
}

/** Empties the vault. For tests and an explicit reset; never called by a screen. */
export function clearAccounts(): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, accounts: [] }));
  } catch {
    /* Already unreachable. */
  }
}

export const BANK_ACCOUNTS_STORAGE_KEY = STORAGE_KEY;
