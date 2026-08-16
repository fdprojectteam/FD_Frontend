import type { BankAccount } from '../types/bank-account';

/**
 * The saved funding accounts, transcribed from the approved artwork.
 *
 * ## ⚠ Demo data, and unambiguously so
 *
 * Spec 21e §11 retrieves saved accounts from an endpoint, and §6 lists partner
 * bank policies and supported verification methods as required data. **None of
 * those exist.** There is no authentication, no investor profile and no account
 * service, so there is nothing to fetch and no real person whose accounts these
 * could be.
 *
 * These three rows are read off `FD_booking_bankAccount_04.png` exactly as the
 * curated `BOOKING_OVERVIEW_FIXTURE` is read off the Overview artwork. That is
 * the established provenance rule in this module: a screen may be laid out from
 * the signed-off design, but nothing may be *invented* beside it.
 *
 * What is deliberately **not** modelled, because no source states it:
 *
 * - whether the funding and maturity accounts must match (§8 Rule 2)
 * - whether more than one account is permitted (§8 Rule 2)
 * - whether verification is mandatory for a given partner bank (§8 Rule 2)
 * - the verification mechanism itself — penny drop or otherwise (§11)
 *
 * The screen therefore lets the user choose among verified accounts and states
 * plainly that the platform holds no account of its own. Adding a real account
 * service replaces this file and nothing else: the screen already reads a list.
 *
 * ## Why no "Add New Bank Account" form
 *
 * §5C says the fields are "determined by the Partner Bank Configuration &
 * Product Rules Engine", which does not exist. Shipping an account-entry form
 * with guessed fields, guessed validation and no verification service behind it
 * would collect a real account number into a platform that cannot verify it.
 * The affordance is drawn as the artwork shows and states that it is not yet
 * available, the same treatment "Save for Later" already has.
 */
export const SAVED_BANK_ACCOUNTS: readonly BankAccount[] = [
  {
    id: 'acc-axis-4587',
    bankName: 'Axis Bank',
    bankInitials: 'AB',
    accountHolderName: 'Arjun Sharma',
    lastFourDigits: '4587',
    accountType: 'savings',
    ifsc: 'UTIB0001234',
    verification: 'verified',
    isPrimary: true,
  },
  {
    id: 'acc-hdfc-2456',
    bankName: 'HDFC Bank',
    bankInitials: 'HB',
    accountHolderName: 'Arjun Sharma',
    lastFourDigits: '2456',
    accountType: 'savings',
    ifsc: 'HDFC0005678',
    verification: 'verified',
    isPrimary: false,
  },
  {
    id: 'acc-icici-7890',
    bankName: 'ICICI Bank',
    bankInitials: 'IB',
    accountHolderName: 'Arjun Sharma',
    lastFourDigits: '7890',
    accountType: 'savings',
    ifsc: 'ICIC0009012',
    verification: 'verified',
    isPrimary: false,
  },
] as const;
