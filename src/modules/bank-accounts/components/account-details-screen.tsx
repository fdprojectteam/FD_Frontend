'use client';

import { ArrowLeft, ArrowRight, BadgeCheck, CircleAlert, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { usePortfolio } from '@/hooks/use-portfolio';
import { formatCurrency } from '@/utils';
import {
  ACCOUNT_TYPE_LABEL,
  maskAccountNumber,
  verificationDescription,
  verificationLabel,
} from '@/utils/bank-account';

import { describeAccountUsage, nameMatchesIdentity } from '../utils/account-usage';

/**
 * One account: what it is, what it is used for, and what can be done with it.
 *
 * ## Only actions that work
 *
 * Three: make it primary, record the demonstration's own verification, and
 * remove it. Each appears only when it would do something — the primary account
 * is not offered a "set as primary" button, a verified account is not offered a
 * check, and removal is replaced by the reason it is refused rather than by a
 * disabled control the customer has to guess at.
 *
 * ## The verification action is named for what it is
 *
 * "Mark as verified (demo)". There is no provider, no penny drop and no consent
 * flow in this build, and the record it writes says `method: 'demo'` for the
 * rest of its life — which is why every screen reads "Demo verified" rather
 * than "Verified".
 *
 * ## Used for is a reference, not a copy
 *
 * The deposits listed here are found by matching `fundingAccountId`. The
 * deposit does not carry the bank name or the four digits, so nothing on this
 * screen can disagree with the vault.
 */
export interface AccountDetailsScreenProps {
  accountId: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border-default/50 flex flex-col gap-0.5 border-b py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-caption text-content-muted shrink-0">{label}</dt>
      <dd className="text-body text-content min-w-0 font-medium break-words sm:text-right">
        {value}
      </dd>
    </div>
  );
}

export function AccountDetailsScreen({ accountId }: AccountDetailsScreenProps) {
  const router = useRouter();
  const { accounts, isLoaded, setPrimary, verifyForDemo, remove } = useBankAccounts();
  const { holdings, isLoaded: holdingsLoaded } = usePortfolio();
  const { identity } = useInvestorIdentity();

  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const account = accounts.find((entry) => entry.id === accountId) ?? null;

  const usage = useMemo(
    () => (account === null ? null : describeAccountUsage(account, accounts, holdings)),
    [account, accounts, holdings],
  );

  if (!isLoaded || !holdingsLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-detail flex flex-col gap-6 py-10 md:py-14"
      >
        <span className="sr-only">Loading this account…</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (account === null || usage === null) {
    return (
      <div className="container-detail flex flex-col gap-6 py-10 md:py-14">
        <div className="flex max-w-lg flex-col gap-3">
          <h1 className="text-h1 text-content">This account is not in your vault</h1>
          <p className="text-body-lg text-content-muted">
            It may have been removed, or it may belong to a session that has ended. Your saved
            accounts are listed under bank accounts.
          </p>
        </div>

        <Button asChild size="lg" className="w-fit">
          <Link href={ROUTES.bankAccounts}>
            Back to bank accounts
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const nameMatch = nameMatchesIdentity(
    account.accountHolderName,
    identity?.profile.fullName ?? null,
  );
  const isVerified = account.verification.status === 'verified';

  return (
    <div className="container-detail flex flex-col gap-6 py-8 md:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href={ROUTES.bankAccounts}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Bank accounts
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-h1 text-content">{account.institution.name}</h1>
            <p className="text-body-lg text-content-muted tabular-nums">
              {ACCOUNT_TYPE_LABEL[account.accountType]} ·{' '}
              {maskAccountNumber(account.lastFourDigits)}
            </p>
          </div>

          {account.isPrimary ? (
            <Badge variant="brand" size="md">
              Primary
            </Badge>
          ) : null}
        </div>
      </header>

      <Card variant="outlined" className="px-5 md:px-6">
        <dl className="flex flex-col">
          <Row label="Account holder" value={account.accountHolderName} />
          <Row label="IFSC" value={account.ifsc} />
          <Row
            label="Branch"
            value={
              account.branch === null
                ? 'Not identified'
                : `${account.branch.name}, ${account.branch.city}`
            }
          />
          <Row label="Account type" value={ACCOUNT_TYPE_LABEL[account.accountType]} />
          <Row
            label="Primary"
            value={
              account.isPrimary
                ? 'Default account for supported funding and payout flows'
                : 'Not your primary account'
            }
          />
        </dl>
      </Card>

      {/* Verification — its own block, because it is the thing most easily misread. */}
      <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {isVerified ? (
            <BadgeCheck aria-hidden="true" className="text-success size-4" />
          ) : (
            <CircleAlert aria-hidden="true" className="text-content-muted size-4" />
          )}
          <h2 className="text-body-lg text-content font-semibold">
            {verificationLabel(account.verification)}
          </h2>
        </div>

        <p className="text-caption text-content-muted">
          {verificationDescription(account.verification)}
        </p>

        {nameMatch === false ? (
          <p className="text-caption text-content-muted">
            The name on this account differs from the name on your identity record
            {identity?.profile.fullName === undefined || identity.profile.fullName === null
              ? ''
              : ` (${identity.profile.fullName})`}
            . That can be normal — banks abbreviate names — but nothing here decides whether it is
            the same person.
          </p>
        ) : null}

        {isVerified ? null : (
          <Button
            variant="secondary"
            className="w-fit"
            onClick={() => {
              verifyForDemo(account.id);
            }}
          >
            Mark as verified (demo)
          </Button>
        )}
      </Card>

      {/* Used for — real relationships only. */}
      <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
        <h2 className="text-body-lg text-content font-semibold">Used for</h2>

        {usage.fundedHoldings.length === 0 ? (
          <p className="text-caption text-content-muted">
            Fixed deposit investments. Nothing has been funded from this account yet.
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-2">
            {usage.fundedHoldings.map((holding) => (
              <li key={holding.reference} className="text-caption text-content-muted">
                <span className="text-content font-medium">{holding.bank.name}</span> ·{' '}
                {formatCurrency(holding.principal)} · {holding.reference}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/*
        Support, carrying this account with it (Module 13). Its opaque id is the
        only thing passed: nothing about the account number reaches the URL.
      */}
      <Link
        href={ROUTES.supportNew({ account: account.id })}
        className="focus-ring text-caption text-content-muted hover:text-content w-fit rounded-md"
      >
        Need help with this account?
      </Link>

      <div className="flex flex-wrap gap-3">
        {account.isPrimary ? null : (
          <Button
            variant="secondary"
            onClick={() => {
              setPrimary(account.id);
            }}
          >
            <Star aria-hidden="true" className="size-4" />
            Set as primary
          </Button>
        )}

        {usage.canRemove ? (
          confirmingRemoval ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-caption text-content-muted">Remove this account?</span>
              <Button
                variant="outline"
                onClick={() => {
                  remove(account.id);
                  router.push(ROUTES.bankAccounts);
                }}
              >
                Yes, remove it
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmingRemoval(false);
                }}
              >
                Keep it
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmingRemoval(true);
              }}
            >
              Remove account
            </Button>
          )
        ) : (
          <p className="text-caption text-content-muted max-w-md">{usage.removalBlockedReason}</p>
        )}
      </div>
    </div>
  );
}
