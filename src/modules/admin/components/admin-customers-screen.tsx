'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import type { DemoKycState } from '@/services/admin';
import { formatCurrency } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

import {
  AdminEmpty,
  AdminPageHeader,
  DemoTag,
  StatusPill,
  type AdminTone,
} from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { filterCustomers } from '../utils/admin-projection';
import { can, deniedReason } from '../utils/permissions';

/**
 * The customer register.
 *
 * ## One live record, the rest demonstration
 *
 * This build has a single investor — the person using the customer portal — and
 * no authentication. Their row is assembled from the canonical identity and
 * portfolio and is live; every other row is synthetic and tagged as such on the
 * row itself, not in a footnote.
 *
 * ## Only operational information
 *
 * A name, a city, when they joined, their verification state and what they
 * hold. **No PAN, no Aadhaar, no date of birth, no address, no account
 * number** — the customer row type has no field for any of them, so this screen
 * could not show one. An operations console identifies a customer; it is not a
 * copy of their file.
 *
 * ## Figures are the platform's own
 *
 * Deposit counts and totals come from `summarisePortfolio`, the same derivation
 * the customer's own dashboard uses. Admin computes nothing.
 */
const KYC_LABEL: Record<DemoKycState, string> = {
  verified: 'Verified',
  pending: 'Verification pending',
  'needs-attention': 'Needs attention',
};

export const KYC_TONE: Record<DemoKycState, AdminTone> = {
  verified: 'success',
  pending: 'neutral',
  'needs-attention': 'warning',
};

const FILTERS: readonly (DemoKycState | 'all')[] = [
  'all',
  'verified',
  'pending',
  'needs-attention',
];

export function AdminCustomersScreen() {
  const console = useAdminConsole();
  const [query, setQuery] = useState('');
  const [kyc, setKyc] = useState<DemoKycState | 'all'>('all');

  const rows = useMemo(
    () => filterCustomers(console.customers, query, kyc),
    [console.customers, query, kyc],
  );

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading customers…</span>
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

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="One live record for this session's investor; the remainder are demonstration data."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <label htmlFor="admin-customer-search" className="text-caption text-content-muted">
            Search
          </label>
          <Input
            id="admin-customer-search"
            type="search"
            placeholder="Name, customer id or city"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="admin-customer-kyc" className="text-caption text-content-muted">
            Verification
          </label>
          <select
            id="admin-customer-kyc"
            value={kyc}
            onChange={(event) => {
              setKyc(event.target.value as DemoKycState | 'all');
            }}
            className="focus-ring border-border-default bg-surface-card text-body text-content h-11 rounded-md border px-3"
          >
            {FILTERS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All' : KYC_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p role="status" className="sr-only">
        {`${String(rows.length)} ${rows.length === 1 ? 'customer' : 'customers'} listed.`}
      </p>

      {rows.length === 0 ? (
        <AdminEmpty
          title="No customer matched"
          detail="No record matches that search and filter. Clear the search to see the full register."
        />
      ) : (
        <Card variant="outlined" className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-border-default border-b">
                {['Customer', 'Verification', 'Deposits', 'Invested', 'Joined', ''].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="text-caption text-content-muted px-5 py-3 font-medium"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-border-default/50 border-b last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-body text-content flex items-center gap-2 font-medium">
                        {row.displayName}
                        {row.isDemo ? <DemoTag /> : null}
                      </span>
                      <span className="text-caption text-content-muted tabular-nums">
                        {row.id} · {row.location}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <StatusPill tone={KYC_TONE[row.kycState]}>{KYC_LABEL[row.kycState]}</StatusPill>
                  </td>

                  <td className="text-body text-content px-5 py-3 tabular-nums">
                    {row.activeDeposits}
                  </td>

                  <td className="text-body text-content px-5 py-3 tabular-nums">
                    {row.totalPrincipal === 0 ? '—' : formatCurrency(row.totalPrincipal)}
                  </td>

                  <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                    {row.isDemo ? formatMaturityDate(new Date(row.joinedAt)) : 'This session'}
                  </td>

                  <td className="px-5 py-3 text-right">
                    <Link
                      href={ROUTES.adminCustomer(row.id)}
                      className="focus-ring text-caption text-content-brand rounded-md font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
