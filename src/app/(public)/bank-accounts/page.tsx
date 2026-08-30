import type { Metadata } from 'next';

import { BankAccountsScreen } from '@/modules/bank-accounts';

/**
 * The bank account vault — top-level, because an account belongs to the
 * customer rather than to the deposits they hold.
 *
 * A server component owning metadata and composition only; the accounts are
 * read in the screen through the platform-level vault hook.
 */
export const metadata: Metadata = {
  title: 'Bank accounts — FD Investment Platform',
  description: 'Manage the bank accounts you use to fund investments and receive proceeds.',
};

export default function BankAccountsPage() {
  return <BankAccountsScreen />;
}
