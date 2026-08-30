'use client';

import { Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBankAccounts } from '@/hooks/use-bank-accounts';

import { AccountCard } from './account-card';

/**
 * The bank account vault.
 *
 * ## What this screen is
 *
 * The customer's accounts, held once, for every product that will ever need
 * one. It is not a booking screen that happens to list accounts — Booking
 * *refers* to what is managed here.
 *
 * ## Calm by construction
 *
 * A heading, a line of supporting copy, the accounts, and one way to add
 * another. No summary tiles, no counts, no reassurance panels: a vault is a
 * place you visit knowing what you came for, and everything that is not an
 * account is in the way of finding one.
 *
 * ## Three states, kept distinct
 *
 * Loading is not emptiness. `isLoaded` is what the screen branches on, so the
 * empty state never flashes at a customer who has accounts.
 */
export function BankAccountsScreen() {
  const { accounts, isLoaded } = useBankAccounts();

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-detail flex flex-col gap-6 py-10 md:py-14"
      >
        <span className="sr-only">Loading your bank accounts…</span>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="container-detail flex flex-col gap-8 py-10 md:py-14">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-content">Bank accounts</h1>
        </div>

        <section className="flex flex-col items-center gap-6 py-10 text-center md:py-16">
          <span className="bg-surface-subtle text-content-muted flex size-16 items-center justify-center rounded-full">
            <ShieldCheck aria-hidden="true" className="size-7" />
          </span>

          <div className="flex max-w-md flex-col gap-3">
            <h2 className="text-h2 text-content">No accounts yet</h2>
            <p className="text-body-lg text-content-muted">
              Add a bank account to fund your investments and receive supported proceeds.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href={ROUTES.bankAccountNew}>
              <Plus aria-hidden="true" className="size-4" />
              Add bank account
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-h1 text-content">Bank accounts</h1>
          <p className="text-body-lg text-content-muted">
            Manage the bank accounts you use to fund investments and receive proceeds.
          </p>
        </div>

        <Button asChild variant="secondary">
          <Link href={ROUTES.bankAccountNew}>
            <Plus aria-hidden="true" className="size-4" />
            Add bank account
          </Link>
        </Button>
      </header>

      <ul className="flex list-none flex-col gap-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </ul>

      {/*
        Said once, at the foot. Everything above is the customer's own data, and
        the one thing they cannot tell by looking is that no bank was contacted
        to confirm any of it.
      */}
      <p className="text-caption text-content-muted">
        We never ask for your internet banking password, UPI PIN or any other banking credential,
        and we do not store your full account number. Demonstration build: no verification provider
        or banking rail is connected, so account ownership has not been confirmed with any bank.
      </p>
    </div>
  );
}
