import type { Metadata } from 'next';

import { AccountDetailsScreen } from '@/modules/bank-accounts';

/**
 * One account.
 *
 * The id in the path is opaque and carries no part of the account number, so
 * nothing sensitive reaches the address bar, browser history or a referrer.
 *
 * **Metadata is static.** Naming the bank in the title would require reading
 * the vault, which lives in this device's session storage rather than on a
 * server — there is nothing for `generateMetadata` to read, and a per-account
 * title would leak which bank the customer uses into the tab title anyway.
 */
export const metadata: Metadata = {
  title: 'Bank account — FD Investment Platform',
  description: 'The details, verification state and usage of one saved bank account.',
};

export default async function BankAccountPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;

  return <AccountDetailsScreen accountId={accountId} />;
}
