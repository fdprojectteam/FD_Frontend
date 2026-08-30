'use client';

import { ArrowRight, CalendarClock, CircleCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { NotificationCategory, NotificationWithState } from '@/types/notification';

/**
 * One notification.
 *
 * ## Unread is a dot, not a colour wash
 *
 * A tinted row for every unread item turns a calm list into a wall of
 * highlights. A single dot marks what is new; the row itself stays quiet.
 *
 * ## An action appears only when one exists
 *
 * `action` is absent on notifications that are purely informational, and the
 * link is absent with it. A control that opens nothing is worse than no
 * control — the customer clicks, nothing happens, and they trust the next one
 * less.
 */
const ICON_BY_CATEGORY: Record<NotificationCategory, ReactNode> = {
  booking: <CircleCheck aria-hidden="true" className="size-4" />,
  identity: <ShieldCheck aria-hidden="true" className="size-4" />,
  maturity: <CalendarClock aria-hidden="true" className="size-4" />,
};

const RELATIVE = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' });

/** "3 days ago" from a timestamp, in the largest unit that still reads well. */
function relativeTime(at: number, now: number): string {
  const seconds = Math.round((at - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return RELATIVE.format(Math.round(seconds / size), unit);
  }

  return 'just now';
}

export interface NotificationItemProps {
  notification: NotificationWithState;
  now: number;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, now, onRead }: NotificationItemProps) {
  const { id, category, severity, title, body, occurredAt, action, isRead } = notification;

  return (
    <article className="flex items-start gap-3 py-4">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          severity === 'action'
            ? 'bg-surface-brand-subtle text-content-brand'
            : 'bg-surface-subtle text-content-muted',
        )}
      >
        {ICON_BY_CATEGORY[category]}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start gap-2">
          <h3
            className={cn(
              'text-body min-w-0 flex-1 break-words',
              isRead ? 'text-content font-medium' : 'text-content font-semibold',
            )}
          >
            {title}
          </h3>

          {isRead ? null : (
            <>
              <span
                aria-hidden="true"
                className="bg-surface-brand mt-2 size-2 shrink-0 rounded-full"
              />
              <span className="sr-only">Unread</span>
            </>
          )}
        </div>

        <p className="text-caption text-content-muted break-words">{body}</p>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <time
            dateTime={new Date(occurredAt).toISOString()}
            className="text-caption text-content-placeholder"
          >
            {relativeTime(occurredAt, now)}
          </time>

          {action ? (
            <Link
              href={action.href}
              onClick={() => {
                onRead(id);
              }}
              className="focus-ring text-caption text-content-brand group inline-flex items-center gap-1 rounded-md font-medium"
            >
              {action.label}
              <ArrowRight
                aria-hidden="true"
                className="motion-safe:duration-base size-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
