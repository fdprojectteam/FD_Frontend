'use client';

import { BadgeCheck, CircleAlert, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { BankAccount, BankAccountVerification } from '../types/bank-account';

/**
 * One saved funding account, as a selectable card (spec 21e §5B).
 *
 * ## A real radio, restyled
 *
 * The same technique `RadioCardGroup` uses, and for the same reasons — roving
 * focus, one tab stop for the group, correct `radiogroup` semantics with no
 * `aria-*` at all. It is not built *on* `RadioCardGroup` because that primitive
 * takes a title, a description and an icon, and this card is a four-column
 * layout of labelled banking fields. Forcing it through would mean passing JSX
 * as a "description", which is the point at which a primitive stops helping.
 *
 * ## The account number is never whole
 *
 * `lastFourDigits` is all the type carries, so this component could not render a
 * full number if it tried — spec 21e §8 Rule 5 enforced by the data rather than
 * by the markup. The dots are decorative and the accessible label spells out
 * "ending 4587", because "•• 4587" is read aloud as nothing useful.
 *
 * Presentation only: it renders an account and reports selection.
 */
const VERIFICATION_META: Record<
  BankAccountVerification,
  { label: string; icon: typeof BadgeCheck; tone: string }
> = {
  verified: { label: 'Verified', icon: BadgeCheck, tone: 'text-success' },
  pending: { label: 'Verification pending', icon: Clock, tone: 'text-content-muted' },
  failed: { label: 'Verification failed', icon: CircleAlert, tone: 'text-error' },
};

const ACCOUNT_TYPE_LABEL: Record<BankAccount['accountType'], string> = {
  savings: 'Savings Account',
  current: 'Current Account',
};

export interface BankAccountOptionProps {
  account: BankAccount;
  name: string;
  selected: boolean;
  /** Spec 21e §8 Rule 3 — an unverified account cannot fund a booking. */
  disabled?: boolean;
  onSelect: () => void;
}

export function BankAccountOption({
  account,
  name,
  selected,
  disabled = false,
  onSelect,
}: BankAccountOptionProps) {
  const verification = VERIFICATION_META[account.verification];
  const VerificationIcon = verification.icon;

  return (
    <label
      className={cn(
        'rounded-card flex cursor-pointer items-start gap-4 border p-4 transition-colors',
        'has-[:focus-visible]:focus-ring',
        selected ? 'border-border-primary bg-surface-brand-subtle/40' : 'border-border-default',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        name={name}
        value={account.id}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className="accent-content-brand mt-1 size-4 shrink-0"
      />

      <span className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-body text-content font-semibold">{account.bankName}</span>
          <span className="text-caption text-content-muted">
            {ACCOUNT_TYPE_LABEL[account.accountType]}
            {' · '}
            <span aria-hidden="true">•• {account.lastFourDigits}</span>
            <span className="sr-only">ending {account.lastFourDigits.split('').join(' ')}</span>
          </span>

          {account.isPrimary ? (
            <Badge size="sm" className="w-fit">
              Primary Account
            </Badge>
          ) : null}
        </span>

        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-caption text-content">{account.accountHolderName}</span>
          <span className="text-caption text-content-muted">IFSC: {account.ifsc}</span>
        </span>

        <span
          className={cn(
            'text-caption inline-flex shrink-0 items-center gap-1.5',
            verification.tone,
          )}
        >
          <VerificationIcon aria-hidden="true" className="size-4" />
          {verification.label}
        </span>
      </span>
    </label>
  );
}
