'use client';

import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';

import { KYC_TONE } from './admin-customers-screen';
import { AdminEmpty, AdminPageHeader, AdminSection, DemoTag, StatusPill } from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { can, deniedReason } from '../utils/permissions';

/**
 * Verification operations.
 *
 * ## What an operator can see, and what nobody can
 *
 * Which customers have a case outstanding and why — a mismatch, or an
 * incomplete verification. **No document, no PAN, no Aadhaar, no date of
 * birth.** This build has no verification provider, no registry lookup and no
 * document store, so there is nothing of that kind to show and nothing is
 * invented to fill the screen.
 *
 * ## Reviewing records that it was looked at
 *
 * The only action is to record that a case was reviewed. It resolves nothing:
 * deciding a verification case needs the evidence a provider would supply, and
 * a button that marked a customer "verified" here would be the console
 * asserting something no part of this platform checked.
 */
export function AdminKycScreen() {
  const console = useAdminConsole();

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading verification cases…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'kyc.view')) {
    return (
      <AdminEmpty
        title="Verification is not visible to this role"
        detail={deniedReason(console.role, 'kyc.view')}
      />
    );
  }

  const cases = console.customers.filter((row) => row.kycState !== 'verified');
  const verified = console.customers.filter((row) => row.kycState === 'verified');

  return (
    <>
      <AdminPageHeader
        title="Verification"
        description="Cases needing a decision, and the customers already cleared. No external verification provider is connected in this build."
      />

      <AdminSection title="Needs a decision">
        {cases.length === 0 ? (
          <AdminEmpty
            title="No case is outstanding"
            detail="Every customer on the platform is currently marked verified."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {cases.map((row) => (
                <li key={row.id} className="flex flex-col gap-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-body text-content flex items-center gap-2 font-medium">
                      {row.displayName}
                      {row.isDemo ? <DemoTag /> : null}
                    </span>

                    <StatusPill tone={KYC_TONE[row.kycState]}>
                      {row.kycState === 'pending' ? 'Verification pending' : 'Needs attention'}
                    </StatusPill>
                  </div>

                  <p className="text-caption text-content-muted">
                    {row.kycNote ??
                      'Verification has not been completed. The platform holds no further detail about why.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={ROUTES.adminCustomer(row.id)}
                      className="focus-ring text-caption text-content-brand rounded-md font-medium"
                    >
                      Open customer
                    </Link>

                    <button
                      type="button"
                      className="focus-ring text-caption text-content-muted hover:text-content rounded-md"
                      onClick={() => {
                        console.record({
                          actorRole: console.role,
                          actorName: console.admin.displayName,
                          action: 'kyc.case.reviewed',
                          subject: { kind: 'kyc-case', id: row.id },
                          summary: `Verification case reviewed for ${row.id}`,
                          change: null,
                        });
                      }}
                    >
                      Record that this case was reviewed
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminSection>

      <AdminSection title="Cleared">
        {verified.length === 0 ? (
          <AdminEmpty
            title="No customer is verified"
            detail="Nobody on the platform has completed verification."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {verified.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-body text-content flex items-center gap-2">
                    {row.displayName}
                    {row.isDemo ? <DemoTag /> : null}
                  </span>
                  <StatusPill tone="success">Verified</StatusPill>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminSection>

      <p className="text-caption text-content-muted">
        Verification states shown here are the platform&apos;s own records. No Aadhaar, DigiLocker,
        registry or bureau check has been performed, and no identity document is held or displayed
        by this console.
      </p>
    </>
  );
}
