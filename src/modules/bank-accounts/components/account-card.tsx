'use client';

import { ArrowRight, BadgeCheck, CircleAlert, Clock, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import type { BankAccountVerificationStatus, ExternalBankAccount } from '@/types/bank-account';
import {
  ACCOUNT_TYPE_LABEL,
  maskAccountNumber,
  spokenAccountNumber,
  verificationLabel,
} from '@/utils/bank-account';

/**
 * One account in the vault.
 *
 * ## A card the size of the information on it
 *
 * Six lines: bank, type, masked number, IFSC, branch, status. No progress
 * rails, no illustration, no chart. A vault is scanned rather than read — the
 * customer is looking for *which* account, and everything beyond that belongs
 * on the details screen.
 *
 * ## The whole card is the link
 *
 * One target instead of a card with a small "View details" control beside it:
 * fewer things to aim at on a phone, and the entire row reads as one object.
 *
 * Presentation only. It renders an account and links to it.
 */
const STATUS_META: Record<
  BankAccountVerificationStatus,
  { icon: typeof BadgeCheck; tone: string }
> = {
  verified: { icon: BadgeCheck, tone: 'text-success' },
  'verification-pending': { icon: Clock, tone: 'text-content-muted' },
  'verification-failed': { icon: CircleAlert, tone: 'text-error' },
  'needs-attention': { icon: CircleAlert, tone: 'text-warning' },
  unverified: { icon: ShieldQuestion, tone: 'text-content-muted' },
};

export interface AccountCardProps {
  account: ExternalBankAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const meta = STATUS_META[account.verification.status];
  const StatusIcon = meta.icon;

  return (
    <li>
      <Link
        href={ROUTES.bankAccount(account.id)}
        aria-label={`${account.institution.name} account ${spokenAccountNumber(account.lastFourDigits)}`}
        className="focus-ring rounded-card border-border-default bg-surface-card hover:border-border-primary/60 group flex items-start gap-4 border p-5 transition-colors md:p-6"
      >
        {/* The monogram, as every other bank surface in the product draws it. */}
        <span
          aria-hidden="true"
          className="bg-surface-brand-subtle text-content-brand text-caption flex size-10 shrink-0 items-center justify-center rounded-full font-semibold"
        >
          {account.institution.initials}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-body text-content font-semibold">{account.institution.name}</span>

            {account.isPrimary ? (
              <Badge variant="brand" size="sm">
                Primary
              </Badge>
            ) : null}
          </span>

          <span className="text-caption text-content-muted">
            {ACCOUNT_TYPE_LABEL[account.accountType]}
          </span>

          <span className="text-body text-content tabular-nums">
            {maskAccountNumber(account.lastFourDigits)}
          </span>

          <span className="text-caption text-content-muted break-words">
            {account.ifsc}
            {account.branch === null ? '' : ` · ${account.branch.name}, ${account.branch.city}`}
          </span>

          <span className={`text-caption mt-1 inline-flex items-center gap-1.5 ${meta.tone}`}>
            <StatusIcon aria-hidden="true" className="size-3.5" />
            {verificationLabel(account.verification)}
          </span>
        </span>

        <ArrowRight
          aria-hidden="true"
          className="text-content-muted motion-safe:duration-base mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}
