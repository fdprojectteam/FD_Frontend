'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  addAccount,
  markDemoVerified,
  readAccounts,
  removeAccount,
  setPrimaryAccount,
  type NewBankAccountInput,
} from '@/services/bank-accounts';
import type { ExternalBankAccount } from '@/types/bank-account';

/**
 * The customer's bank accounts — one reader, one writer, no second copy.
 *
 * ## Why it is platform-level
 *
 * The vault manages accounts, Booking chooses one to fund a deposit, and the
 * account details screen explains what an account is used for. Modules cannot
 * import each other, so the hook belongs to the platform — exactly as
 * `usePortfolio` and `useInvestorIdentity` do. Booking therefore reads *the
 * same accounts* the vault writes, and a change made in one is visible in the
 * other without anything being synchronised.
 *
 * ## Hydration is deferred, deliberately
 *
 * `sessionStorage` does not exist on the server, so seeding state from it
 * during render produces a hydration mismatch. The list starts empty and is
 * replaced in an effect — which is why `isLoaded` exists: an empty list before
 * hydration is not the same statement as "this customer has no accounts", and
 * the empty state must not flash at someone who has three.
 *
 * ## Every mutation returns the whole list
 *
 * The store returns the new list, so the hook sets it directly rather than
 * re-reading. One write, one render, and no window in which the screen and the
 * store disagree.
 */
export interface BankAccountsState {
  accounts: readonly ExternalBankAccount[];
  /** False until the vault has been read. Screens branch on this, not on length. */
  isLoaded: boolean;
  add: (input: NewBankAccountInput) => ExternalBankAccount | null;
  setPrimary: (id: string) => void;
  /** Records the demonstration's own check. Never claims a bank verified anything. */
  verifyForDemo: (id: string) => void;
  remove: (id: string) => void;
  reload: () => void;
}

export function useBankAccounts(): BankAccountsState {
  const [accounts, setAccounts] = useState<readonly ExternalBankAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAccounts(readAccounts());
    setIsLoaded(true);
  }, []);

  /**
   * Adds an account and hands back the record that was created.
   *
   * The caller needs the new id — the add flow navigates to the account it just
   * created — and the id is the store's to mint, so it has to come back rather
   * than be guessed at.
   */
  const add = useCallback((input: NewBankAccountInput) => {
    const next = addAccount(input);
    setAccounts(next);
    return next.at(-1) ?? null;
  }, []);

  const setPrimary = useCallback((id: string) => {
    setAccounts(setPrimaryAccount(id));
  }, []);

  const verifyForDemo = useCallback((id: string) => {
    setAccounts(markDemoVerified(id));
  }, []);

  const remove = useCallback((id: string) => {
    setAccounts(removeAccount(id));
  }, []);

  const reload = useCallback(() => {
    setAccounts(readAccounts());
  }, []);

  return { accounts, isLoaded, add, setPrimary, verifyForDemo, remove, reload };
}
