import type { Metadata } from 'next';

import { AddAccountScreen } from '@/modules/bank-accounts';

/**
 * Adding an account.
 *
 * A static segment rather than a query parameter on the vault: adding is a
 * place the customer can be, can navigate back from, and can land on directly
 * from Booking.
 */
export const metadata: Metadata = {
  title: 'Add a bank account — FD Investment Platform',
  description:
    'Add a bank account by account number and IFSC. Your bank and branch are identified from the code.',
};

export default function AddBankAccountPage() {
  return <AddAccountScreen />;
}
