'use client';

import { ArrowRight, BellOff } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useNotifications } from '@/hooks/use-notifications';
import type { NotificationCategory } from '@/types/notification';

import { NotificationItem } from './notification-item';

/**
 * The notification centre.
 *
 * ## Grouped by what needs doing, not by day
 *
 * A date-grouped feed is a log. What an investor wants first is whether
 * anything is waiting on them, so the list is split into **Needs attention**
 * and **Updates** — and the first section is absent, not empty, when nothing
 * does.
 *
 * ## Read state is not automatic
 *
 * Opening this page does not silently mark everything read: a customer who
 * glances at the tab and leaves has not seen anything, and clearing the badge
 * for them loses the one signal that matters. Reading happens on a deliberate
 * act — following a notification's action, or pressing "Mark all as read".
 *
 * ## Three states, kept distinct
 *
 * Loading is not emptiness. `isLoaded` is what the screen branches on, so an
 * investor with deposits never sees the empty state flash.
 */
const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  booking: 'Booking',
  identity: 'Identity',
  maturity: 'Maturity',
};

export function NotificationsScreen() {
  const { notifications, unread, isLoaded, markAsRead, markAllAsRead } = useNotifications();
  const [now] = useState(() => Date.now());

  const { attention, updates } = useMemo(
    () => ({
      attention: notifications.filter((entry) => entry.severity === 'action'),
      updates: notifications.filter((entry) => entry.severity !== 'action'),
    }),
    [notifications],
  );

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-detail flex flex-col gap-6 py-10 md:py-14"
      >
        <span className="sr-only">Loading your notifications…</span>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="container-detail py-10 md:py-14">
        <section className="flex flex-col items-center gap-6 py-10 text-center md:py-16">
          <span className="bg-surface-subtle text-content-muted flex size-16 items-center justify-center rounded-full">
            <BellOff aria-hidden="true" className="size-7" />
          </span>

          <div className="flex max-w-md flex-col gap-3">
            <h1 className="text-h1 text-content">Nothing needs your attention</h1>
            <p className="text-body-lg text-content-muted">
              Updates about your bookings, identity verification and deposit maturities will appear
              here.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href={ROUTES.home}>
              Explore FDs
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-content">Notifications</h1>
          <p className="text-body-lg text-content-muted">
            {unread === 0
              ? 'You are up to date.'
              : `${String(unread)} ${unread === 1 ? 'update' : 'updates'} you have not read yet.`}
          </p>
        </div>

        {unread > 0 ? (
          <Button variant="secondary" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        ) : null}
      </header>

      {attention.length > 0 ? (
        <section aria-labelledby="notifications-attention-title" className="flex flex-col gap-3">
          <h2 id="notifications-attention-title" className="text-h3 text-content">
            Needs your attention
          </h2>

          <Card variant="outlined" className="divide-border-default/60 divide-y px-5 md:px-6">
            {attention.map((entry) => (
              <NotificationItem
                key={entry.id}
                notification={entry}
                now={now}
                onRead={(id) => {
                  markAsRead([id]);
                }}
              />
            ))}
          </Card>
        </section>
      ) : null}

      {updates.length > 0 ? (
        <section aria-labelledby="notifications-updates-title" className="flex flex-col gap-3">
          <h2 id="notifications-updates-title" className="text-h3 text-content">
            Updates
          </h2>

          <Card variant="outlined" className="divide-border-default/60 divide-y px-5 md:px-6">
            {updates.map((entry) => (
              <NotificationItem
                key={entry.id}
                notification={entry}
                now={now}
                onRead={(id) => {
                  markAsRead([id]);
                }}
              />
            ))}
          </Card>
        </section>
      ) : null}

      {/*
        Said once, at the foot, rather than on every row. No bank integration
        exists in this build, so every notification here is derived from state
        the platform holds locally — and nothing was emailed, texted or pushed.
      */}
      <p className="text-caption text-content-muted">
        Demonstration only — these updates are generated from your activity in this app. No message
        has been sent to you, and no bank has been contacted.
      </p>

      <p className="sr-only">Categories in use: {Object.values(CATEGORY_LABEL).join(', ')}.</p>
    </div>
  );
}
