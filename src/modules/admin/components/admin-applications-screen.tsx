'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import type { AdminApplicationStatus } from '@/types/admin';
import { formatCurrency } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

import {
  AdminEmpty,
  AdminPageHeader,
  AdminSection,
  DemoTag,
  StatusPill,
  type AdminTone,
} from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { filterApplications, isDecidable } from '../utils/admin-projection';
import { can, deniedReason } from '../utils/permissions';

/**
 * The application queue, and one application.
 *
 * ## Two things in one file, because they are one screen
 *
 * The queue and the detail share the status vocabulary, the decision actions
 * and the honesty statement. Splitting them would mean maintaining that
 * agreement in two places.
 *
 * ## A decision is journalled, not stored
 *
 * Approving an application appends an event. The status shown here is
 * **replayed** from those events, so the queue and the audit log are the same
 * data seen two ways and cannot disagree.
 *
 * ## What a decision is not
 *
 * It is not a submission to a bank. No bank integration exists in this build,
 * and the screen says so beside the buttons rather than in a footnote — an
 * operator pressing "Approve" is entitled to know exactly what it did.
 */
export const APPLICATION_LABEL: Record<AdminApplicationStatus, string> = {
  pending: 'Pending',
  'in-review': 'In review',
  approved: 'Approved (simulated)',
  rejected: 'Rejected (simulated)',
  completed: 'Completed',
};

export const APPLICATION_TONE: Record<AdminApplicationStatus, AdminTone> = {
  pending: 'warning',
  'in-review': 'brand',
  approved: 'success',
  rejected: 'error',
  completed: 'neutral',
};

const FILTERS: readonly (AdminApplicationStatus | 'all')[] = [
  'all',
  'pending',
  'in-review',
  'approved',
  'rejected',
  'completed',
];

export function AdminApplicationsScreen() {
  const console = useAdminConsole();
  const [status, setStatus] = useState<AdminApplicationStatus | 'all'>('all');

  const rows = useMemo(
    () => filterApplications(console.applications, status),
    [console.applications, status],
  );

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading the application queue…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'applications.view')) {
    return (
      <AdminEmpty
        title="Applications are not visible to this role"
        detail={deniedReason(console.role, 'applications.view')}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Applications"
        description="Applications in flight are demonstration data. Completed rows are deposits this platform recorded as confirmed."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={status === option ? 'primary' : 'secondary'}
            aria-pressed={status === option}
            onClick={() => {
              setStatus(option);
            }}
          >
            {option === 'all' ? 'All' : APPLICATION_LABEL[option]}
          </Button>
        ))}
      </div>

      <p role="status" className="sr-only">
        {`${String(rows.length)} ${rows.length === 1 ? 'application' : 'applications'} listed.`}
      </p>

      {rows.length === 0 ? (
        <AdminEmpty
          title="Nothing in this view"
          detail="No application currently has that status. Choose “All” to see the whole queue."
        />
      ) : (
        <Card variant="outlined" className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-border-default border-b">
                {['Reference', 'Customer', 'Bank', 'Amount', 'Status', 'Submitted', ''].map(
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
                  <td className="text-body text-content px-5 py-3 font-medium tabular-nums">
                    <span className="flex items-center gap-2">
                      {row.id}
                      {row.isDemo ? <DemoTag /> : null}
                    </span>
                  </td>
                  <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                    {row.customerId}
                  </td>
                  <td className="text-caption text-content-muted px-5 py-3">{row.bankName}</td>
                  <td className="text-body text-content px-5 py-3 tabular-nums">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill tone={APPLICATION_TONE[row.status]}>
                      {APPLICATION_LABEL[row.status]}
                    </StatusPill>
                  </td>
                  <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                    {formatMaturityDate(new Date(row.submittedAt))}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={ROUTES.adminApplication(row.id)}
                      className="focus-ring text-caption text-content-brand rounded-md font-medium"
                    >
                      Open
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

export interface AdminApplicationDetailScreenProps {
  applicationId: string;
}

export function AdminApplicationDetailScreen({ applicationId }: AdminApplicationDetailScreenProps) {
  const console = useAdminConsole();

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading this application…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'applications.view')) {
    return (
      <AdminEmpty
        title="Applications are not visible to this role"
        detail={deniedReason(console.role, 'applications.view')}
      />
    );
  }

  const application = console.applications.find((row) => row.id === applicationId) ?? null;

  if (application === null) {
    return (
      <>
        <AdminPageHeader title="Application not found" />
        <AdminEmpty
          title={`No application with reference ${applicationId}`}
          detail="The queue holds the demonstration applications and the deposits this platform recorded. A reference outside that set resolves to nothing."
        />
        <Link
          href={ROUTES.adminApplications}
          className="focus-ring text-caption text-content-brand mt-4 inline-block rounded-md font-medium"
        >
          Back to applications
        </Link>
      </>
    );
  }

  const timeline = console.events
    .filter((event) => event.subject.kind === 'application' && event.subject.id === application.id)
    .sort((a, b) => b.at - a.at);

  const mayDecide = can(console.role, 'applications.decide');
  const decidable = isDecidable(application);

  const record = (
    action: 'application.reviewed' | 'application.approved' | 'application.rejected',
    verb: string,
  ) => {
    console.record({
      actorRole: console.role,
      actorName: console.admin.displayName,
      action,
      subject: { kind: 'application', id: application.id },
      summary: `Application ${application.id} ${verb}`,
      change: null,
    });
  };

  return (
    <>
      <Link
        href={ROUTES.adminApplications}
        className="focus-ring text-caption text-content-muted hover:text-content mb-3 inline-flex items-center gap-1.5 rounded-md"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Applications
      </Link>

      <AdminPageHeader
        title={application.id}
        description={`${application.bankName} · ${formatCurrency(application.amount)}`}
        actions={application.isDemo ? <DemoTag /> : null}
      />

      <AdminSection title="Status">
        <Card variant="outlined" className="flex flex-col gap-2 p-5">
          <StatusPill tone={APPLICATION_TONE[application.status]}>
            {APPLICATION_LABEL[application.status]}
          </StatusPill>

          <dl className="mt-1 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              ['Customer', application.customerId],
              ['Product', application.productId],
              ['Submitted', formatMaturityDate(new Date(application.submittedAt))],
              ['Source', application.isDemo ? 'Demonstration queue' : 'Confirmed deposit'],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="text-caption text-content-muted">{label}</dt>
                <dd className="text-body text-content tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </AdminSection>

      <AdminSection
        title="Decision"
        description="Recorded in this platform's audit journal. No bank receives an application from this console."
      >
        {!decidable ? (
          <AdminEmpty
            title="No decision is available"
            detail={
              application.status === 'completed'
                ? 'This is a deposit the customer already holds. It was confirmed through the booking journey and is not an operational decision.'
                : 'This application has already been decided in this session.'
            }
          />
        ) : !mayDecide ? (
          <AdminEmpty
            title="This role cannot decide applications"
            detail={deniedReason(console.role, 'applications.decide')}
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                record('application.reviewed', 'marked in review');
              }}
            >
              Mark in review
            </Button>
            <Button
              onClick={() => {
                record('application.approved', 'approved (simulated)');
              }}
            >
              Approve (demo)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                record('application.rejected', 'rejected (simulated)');
              }}
            >
              Reject (demo)
            </Button>
          </div>
        )}
      </AdminSection>

      <AdminSection title="Activity">
        {timeline.length === 0 ? (
          <AdminEmpty
            title="No action recorded"
            detail="Nothing has been done to this application in this session."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {timeline.map((event) => (
                <li key={event.id} className="flex flex-col gap-0.5 py-3">
                  <span className="text-body text-content">{event.summary}</span>
                  <span className="text-caption text-content-muted tabular-nums">
                    {event.actorName} · {formatMaturityDate(new Date(event.at))} · Simulated
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
