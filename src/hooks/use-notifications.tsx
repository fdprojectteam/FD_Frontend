'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { usePortfolio } from '@/hooks/use-portfolio';
import { markRead, readReadIds } from '@/services/notifications';
import type { NotificationWithState } from '@/types/notification';
import { deriveNotifications, unreadCount } from '@/utils/notifications/derive-notifications';

/**
 * What the platform has to tell the investor, and what they have already seen.
 *
 * ## It composes; it owns almost nothing
 *
 * Holdings come from the portfolio hook, the identity record from the investor
 * hook, and the notifications themselves are derived from both. The only state
 * this adds is the set of ids already read — everything else is a view over
 * data that already has an owner.
 *
 * That is what keeps a notification from disagreeing with the screen it points
 * at: there is nothing to keep in step.
 */
export interface NotificationsState {
  notifications: readonly NotificationWithState[];
  unread: number;
  /** False until both sources have been read. The bell branches on this. */
  isLoaded: boolean;
  markAsRead: (ids: readonly string[]) => void;
  markAllAsRead: () => void;
}

export function useNotifications(): NotificationsState {
  const { holdings, isLoaded: holdingsLoaded } = usePortfolio();
  const { identity, readiness, isPending } = useInvestorIdentity();

  const [readIds, setReadIds] = useState<readonly string[]>([]);

  /*
    Read state is hydrated in an effect for the same reason the draft is:
    `sessionStorage` does not exist on the server, and seeding during render
    would produce a hydration mismatch.
  */
  useEffect(() => {
    setReadIds(readReadIds());
  }, []);

  /*
    The clock is read once per derivation so "matures in 40 days" and the order
    of the list are measured from the same instant.
  */
  const [now] = useState(() => Date.now());

  const derived = useMemo(
    () =>
      deriveNotifications({ holdings, readiness, investorId: identity?.investorId ?? null }, now),
    [holdings, readiness, identity?.investorId, now],
  );

  const notifications = useMemo<NotificationWithState[]>(
    () => derived.map((entry) => ({ ...entry, isRead: readIds.includes(entry.id) })),
    [derived, readIds],
  );

  const markAsRead = useCallback((ids: readonly string[]) => {
    if (ids.length === 0) return;
    setReadIds(markRead(ids));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(markRead(derived.map((entry) => entry.id)));
  }, [derived]);

  return {
    notifications,
    unread: unreadCount(derived, readIds),
    isLoaded: holdingsLoaded && !isPending,
    markAsRead,
    markAllAsRead,
  };
}
