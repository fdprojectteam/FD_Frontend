import type { ExternalBankAccount } from '@/types/bank-account';
import type { PortfolioHolding } from '@/types/portfolio';

/**
 * What an account is used for, and whether it can be removed.
 *
 * ## Only relationships that exist
 *
 * One relationship is real today: a confirmed deposit records the account that
 * funded it. That is a **reference** — `PortfolioHolding.fundingAccountId` — not
 * a copy of the account, so the deposit does not carry a bank name, an IFSC or
 * four digits that could drift from the vault.
 *
 * Nothing here claims maturity proceeds were paid anywhere. The platform has no
 * settlement integration; what it knows is which account the customer nominated
 * at the time of booking, and that is what it says.
 *
 * ## Removal is refused for a reason, or allowed
 *
 * Two rules, both derived rather than configured:
 *
 * 1. An account that funded a deposit the customer still holds cannot be
 *    removed — the record of how that deposit was funded would lose its
 *    referent, and a statement would be unable to say where the money came
 *    from.
 * 2. The primary account cannot be removed while another account exists,
 *    because it would leave the vault with no default and no basis for
 *    choosing one. Making another account primary first is one click.
 *
 * A single account that funds nothing is removable. Nothing else is invented:
 * there is no in-flight payment to check, because there is no payment rail.
 *
 * Pure and React-free.
 */

export interface AccountUsage {
  /** Deposits this account funded, most recent first. */
  fundedHoldings: readonly PortfolioHolding[];
  canRemove: boolean;
  /** Why removal is refused, in the customer's words. `null` when it is allowed. */
  removalBlockedReason: string | null;
}

export function describeAccountUsage(
  account: ExternalBankAccount,
  accounts: readonly ExternalBankAccount[],
  holdings: readonly PortfolioHolding[],
): AccountUsage {
  const fundedHoldings = holdings
    .filter((holding) => holding.fundingAccountId === account.id && holding.status !== 'closed')
    .toSorted((a, b) => b.startedAt - a.startedAt);

  if (fundedHoldings.length > 0) {
    const count = fundedHoldings.length;

    return {
      fundedHoldings,
      canRemove: false,
      removalBlockedReason: `This account funded ${String(count)} ${count === 1 ? 'investment you still hold' : 'investments you still hold'}, so it cannot be removed.`,
    };
  }

  if (account.isPrimary && accounts.length > 1) {
    return {
      fundedHoldings,
      canRemove: false,
      removalBlockedReason:
        'This is your primary account. Make another account primary before removing it.',
    };
  }

  return { fundedHoldings, canRemove: true, removalBlockedReason: null };
}

/**
 * Whether the name on the account matches the name on the identity record.
 *
 * Compared loosely — case and spacing only — because that is all a comparison
 * of two free-text names can honestly claim. "A. Sharma" against "Arjun Sharma"
 * is reported as a difference for a person to judge, and never resolved by the
 * platform in either direction.
 */
export function nameMatchesIdentity(
  accountHolderName: string,
  identityName: string | null,
): boolean | null {
  if (identityName === null) return null;

  const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalise(accountHolderName) === normalise(identityName);
}
