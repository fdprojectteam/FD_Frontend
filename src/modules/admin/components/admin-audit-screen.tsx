'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMaturityDate } from '@/utils/finance';

import { AdminEmpty, AdminPageHeader, StatusPill } from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { ROLE_LABEL, can, deniedReason } from '../utils/permissions';

/**
 * The audit log.
 *
 * ## Five questions, answered on every line
 *
 * Who, what, when, to which object, and with what outcome. Each row is an
 * immutable event: nothing here can be edited or removed, because the value of
 * an audit trail is precisely that it cannot.
 *
 * ## It is the source, not a copy
 *
 * Application statuses and product proposals are **projected from these
 * events** rather than stored beside them, so the log cannot disagree with the
 * queues it describes. That is also why it starts empty: an audit trail
 * pre-populated with actions nobody took would be the one piece of
 * demonstration data that destroys the point of the feature.
 *
 * ## Every line says it is simulated
 *
 * Not once at the foot of the page — on each event. A row read on its own must
 * still make clear that no bank, provider or customer was contacted.
 */
export function AdminAuditScreen() {
  const console = useAdminConsole();

  if (!console.isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading the audit log…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'audit.view')) {
    return (
      <AdminEmpty
        title="The audit log is not visible to this role"
        detail={deniedReason(console.role, 'audit.view')}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Every operational action taken in this session, in the order it happened."
      />

      {console.events.length === 0 ? (
        <AdminEmpty
          title="No actions recorded"
          detail="The log is written by operational actions only. Reviewing an application, proposing a product change or updating a support request will appear here — nothing is pre-populated."
        />
      ) : (
        <Card variant="outlined" className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <thead>
              <tr className="border-border-default border-b">
                {['When', 'Who', 'What', 'Object', 'Change', 'Status'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="text-caption text-content-muted px-5 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {console.events.map((event) => (
                <tr key={event.id} className="border-border-default/50 border-b last:border-b-0">
                  <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                    {formatMaturityDate(new Date(event.at))}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-body text-content">{event.actorName}</span>
                      <span className="text-caption text-content-muted">
                        {ROLE_LABEL[event.actorRole]}
                      </span>
                    </div>
                  </td>
                  <td className="text-body text-content px-5 py-3">{event.summary}</td>
                  <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                    {event.subject.kind} · {event.subject.id}
                  </td>
                  <td className="text-caption text-content-muted px-5 py-3 tabular-nums">
                    {event.change === null
                      ? '—'
                      : `${event.change.field}: ${event.change.from} → ${event.change.to}`}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill tone="neutral">Simulated</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-caption text-content-muted mt-4">
        Records are append-only and are kept for this browser session. Every entry describes a
        change to this platform&apos;s own records: no bank, verification provider, payment system
        or customer was contacted by any action listed here.
      </p>
    </>
  );
}
