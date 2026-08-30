'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

import { KYC_TONE } from './admin-customers-screen';
import { AdminEmpty, AdminPageHeader, AdminSection, DemoTag, StatusPill } from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { can, deniedReason } from '../utils/permissions';

/**
 * One customer, at the level of detail operations is entitled to.
 *
 * ## What is shown
 *
 * Verification state, deposits, applications in the queue, and support requests
 * — each resolved from its own canonical domain at render time rather than
 * copied into an admin record. The deposits list shows what the customer's own
 * portfolio shows, because it *is* their portfolio.
 *
 * ## What is never shown
 *
 * No PAN, no Aadhaar, no date of birth, no address, no bank account number, no
 * document. Operations needs to know that a case needs a decision and what the
 * customer holds; nothing on this screen requires an identity document, so none
 * is rendered.
 */
export interface AdminCustomerDetailScreenProps {
  customerId: string;
}

export function AdminCustomerDetailScreen({ customerId }: AdminCustomerDetailScreenProps) {
  const console = useAdminConsole();

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading this customer…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'customers.view')) {
    return (
      <AdminEmpty
        title="Customers are not visible to this role"
        detail={deniedReason(console.role, 'customers.view')}
      />
    );
  }

  const customer = console.customers.find((row) => row.id === customerId) ?? null;

  if (customer === null) {
    return (
      <>
        <AdminPageHeader title="Customer not found" />
        <AdminEmpty
          title={`No customer with id ${customerId}`}
          detail="The register holds this session's investor and the demonstration customers. An id outside that set resolves to nothing."
        />
        <Link
          href={ROUTES.adminCustomers}
          className="focus-ring text-caption text-content-brand mt-4 inline-block rounded-md font-medium"
        >
          Back to customers
        </Link>
      </>
    );
  }

  const applications = console.applications.filter((row) => row.customerId === customer.id);

  return (
    <>
      <Link
        href={ROUTES.adminCustomers}
        className="focus-ring text-caption text-content-muted hover:text-content mb-3 inline-flex items-center gap-1.5 rounded-md"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Customers
      </Link>

      <AdminPageHeader
        title={customer.displayName}
        description={`${customer.id} · ${customer.location}`}
        actions={customer.isDemo ? <DemoTag /> : null}
      />

      <AdminSection title="Verification">
        <Card variant="outlined" className="flex flex-col gap-2 p-5">
          <StatusPill tone={KYC_TONE[customer.kycState]}>
            {customer.kycState === 'verified'
              ? 'Verified'
              : customer.kycState === 'pending'
                ? 'Verification pending'
                : 'Needs attention'}
          </StatusPill>

          <p className="text-caption text-content-muted">
            {customer.kycNote ??
              'No case is outstanding. Verification state is read from the platform’s own record; no external registry or provider is connected in this build.'}
          </p>
        </Card>
      </AdminSection>

      <AdminSection title="Fixed deposits" description="Read from the customer’s own portfolio.">
        {customer.summary.holdings.length === 0 ? (
          <AdminEmpty
            title="No deposits"
            detail="This customer does not hold a fixed deposit on the platform."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {customer.summary.holdings.map((view) => (
                <li
                  key={view.holding.reference}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body text-content font-medium">
                      {view.holding.bank.name}
                    </span>
                    <span className="text-caption text-content-muted tabular-nums">
                      {view.holding.reference} ·{' '}
                      {view.maturesOn === null
                        ? 'No maturity date recorded'
                        : `matures ${formatMaturityDate(view.maturesOn)}`}
                    </span>
                  </span>

                  <span className="text-caption text-content-muted tabular-nums">
                    {formatCurrency(view.holding.principal)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminSection>

      <AdminSection title="Applications">
        {applications.length === 0 ? (
          <AdminEmpty
            title="Nothing in the queue"
            detail="This customer has no application awaiting an operational decision."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {applications.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                >
                  <Link
                    href={ROUTES.adminApplication(row.id)}
                    className="focus-ring text-body text-content-brand rounded-md font-medium"
                  >
                    {row.id}
                  </Link>
                  <span className="text-caption text-content-muted">
                    {row.bankName} · {row.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminSection>
    </>
  );
}
