'use client';

import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { formatMaturityDate } from '@/utils/finance';

import { AdminEmpty, AdminKpiRow, AdminPageHeader, AdminSection } from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';

/**
 * The operations overview.
 *
 * ## It answers one question first
 *
 * *What needs my attention?* — before any total, any chart and any list. An
 * operations console whose first screen is a set of pleasing figures teaches
 * its operators to scroll past it; this one leads with the queue and states the
 * counts underneath.
 *
 * ## Counts, not metrics
 *
 * Four figures, each of which is a count of records the platform actually has.
 * There is no conversion rate, no growth percentage and no revenue: this build
 * has one investor and a demonstration fixture, and any trend computed from
 * that would be fiction dressed as insight.
 *
 * ## Recent activity is the audit journal
 *
 * Not a second feed. What appears here is exactly what the audit log holds, and
 * it is empty until an operator does something — an activity list seeded with
 * actions nobody took is the one thing an audit trail must never contain.
 */
export function AdminDashboardScreen() {
  const console = useAdminConsole();

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Loading the operations overview…</span>
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const activeDeposits = console.customers.reduce(
    (total, customer) => total + customer.activeDeposits,
    0,
  );
  const pendingApplications = console.applications.filter(
    (row) => row.status === 'pending' || row.status === 'in-review',
  ).length;
  const attentionTotal = console.attention.reduce((total, item) => total + item.count, 0);

  return (
    <>
      <AdminPageHeader
        title="Operations overview"
        description={`Read at ${formatMaturityDate(new Date(console.now))}. Figures are counts of records this platform holds.`}
      />

      <AdminKpiRow
        items={[
          {
            label: 'Customers',
            value: String(console.customers.length),
            hint: '1 live, rest demo',
          },
          { label: 'Active FDs', value: String(activeDeposits) },
          { label: 'Pending applications', value: String(pendingApplications) },
          { label: 'Attention required', value: String(attentionTotal) },
        ]}
      />

      <AdminSection
        title="Needs attention"
        description="Only items with something outstanding are listed."
      >
        {console.attention.length === 0 ? (
          <AdminEmpty
            title="Nothing is waiting on operations"
            detail="No application, verification case, product change or support request is currently outstanding."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {console.attention.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body text-content font-medium">{item.label}</span>
                    <span className="text-caption text-content-muted">{item.detail}</span>
                  </span>

                  <span className="text-body text-content font-semibold tabular-nums">
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminSection>

      <AdminSection
        title="Recent activity"
        description="Every operational action recorded in this session."
        actions={
          <Link
            href={ROUTES.adminAudit}
            className="focus-ring text-caption text-content-brand rounded-md font-medium"
          >
            Full audit log
          </Link>
        }
      >
        {console.events.length === 0 ? (
          <AdminEmpty
            title="No actions have been taken yet"
            detail="Reviewing an application, proposing a product change or updating a support request will appear here."
          />
        ) : (
          <Card variant="outlined" className="px-5">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {console.events.slice(0, 6).map((event) => (
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
