'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportRequests } from '@/hooks/use-support-requests';
import { setRequestStatus } from '@/services/support';
import type { SupportStatus } from '@/types/support';
import { formatMaturityDate } from '@/utils/finance';

import { AdminEmpty, AdminPageHeader, StatusPill, type AdminTone } from './admin-primitives';
import { useAdminConsole } from '../hooks/use-admin-console';
import { can, deniedReason } from '../utils/permissions';

/**
 * Support operations.
 *
 * ## One queue, seen from the other side
 *
 * These are the customer's own support requests, read through the platform
 * support hook. There is **no admin support store**: an operator changing a
 * status calls the support service, so the status the operator sets is the
 * status the customer sees on their own screen. A second queue would drift
 * within a session.
 *
 * ## The action is recorded twice, for two different reasons
 *
 * The support store holds *what the request's status is*; the admin journal
 * holds *that an operator changed it*. Those are different facts — a support
 * request should not carry an operator's role, and an audit log should not be
 * the source of a customer-facing status.
 *
 * ## Nothing is sent
 *
 * Resolving a request does not email, text or notify the customer. There is no
 * delivery channel in this build, and the screen says so rather than letting an
 * operator assume the customer was told.
 */
const STATUS_LABEL: Record<SupportStatus, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  'waiting-for-customer': 'Waiting for customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_TONE: Record<SupportStatus, AdminTone> = {
  open: 'warning',
  'in-progress': 'brand',
  'waiting-for-customer': 'warning',
  resolved: 'success',
  closed: 'neutral',
};

const NEXT_STATUSES: readonly SupportStatus[] = [
  'in-progress',
  'waiting-for-customer',
  'resolved',
  'closed',
];

export function AdminSupportScreen() {
  const console = useAdminConsole();
  const { requests, isLoaded, reload } = useSupportRequests();

  if (!console.isLoaded || !isLoaded) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading support requests…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!can(console.role, 'support.view')) {
    return (
      <AdminEmpty
        title="Support is not visible to this role"
        detail={deniedReason(console.role, 'support.view')}
      />
    );
  }

  const mayAct = can(console.role, 'support.act');

  const change = (id: string, status: SupportStatus) => {
    setRequestStatus(
      id,
      status,
      `Status set to “${STATUS_LABEL[status]}” by ${console.admin.displayName} in the demonstration operations console. No message was sent to you.`,
    );
    reload();

    console.record({
      actorRole: console.role,
      actorName: console.admin.displayName,
      action: 'support.status.changed',
      subject: { kind: 'support-request', id },
      summary: `Support request ${id} set to ${STATUS_LABEL[status]}`,
      change: { field: 'Status', from: 'previous', to: STATUS_LABEL[status] },
    });
  };

  return (
    <>
      <AdminPageHeader
        title="Support"
        description="The customer's own support queue. A status changed here is the status they see."
      />

      {requests.length === 0 ? (
        <AdminEmpty
          title="No support requests"
          detail="Nobody has contacted support in this session."
        />
      ) : (
        <Card variant="outlined" className="px-5">
          <ul className="divide-border-default/60 flex list-none flex-col divide-y">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-col gap-2 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-caption text-content-muted tabular-nums">
                      {request.id} · {request.category}
                    </span>
                    <span className="text-body text-content font-medium">{request.subject}</span>
                    <span className="text-caption text-content-muted">
                      {request.relatedTo.kind === 'holding'
                        ? `Related deposit ${request.relatedTo.reference}`
                        : request.relatedTo.kind === 'bank-account'
                          ? 'Related bank account'
                          : 'No related record'}
                    </span>
                  </span>

                  <span className="flex flex-col items-end gap-1">
                    <StatusPill tone={STATUS_TONE[request.status]}>
                      {STATUS_LABEL[request.status]}
                    </StatusPill>
                    <span className="text-caption text-content-placeholder tabular-nums">
                      {formatMaturityDate(new Date(request.updatedAt))}
                    </span>
                  </span>
                </div>

                {mayAct ? (
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES.filter((status) => status !== request.status).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="focus-ring border-border-default text-caption text-content-muted hover:bg-surface-muted rounded-md border px-2.5 py-1"
                        onClick={() => {
                          change(request.id, status);
                        }}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-caption text-content-muted">
                    {deniedReason(console.role, 'support.act')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-caption text-content-muted mt-4">
        Changing a status updates the customer&apos;s request and adds a note to their conversation.
        No email, message or notification is sent — no delivery channel is connected in this build.
      </p>
    </>
  );
}
