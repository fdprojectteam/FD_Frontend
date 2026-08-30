'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/constants/routes';
import { useNotifications } from '@/hooks/use-notifications';

/**
 * The header bell, and the only thing the navigation knows about notifications.
 *
 * ## Why it is its own component
 *
 * `TopNav` is presentation-only by design and is shared by every public route.
 * Making it read notification state would give the whole shell a data
 * dependency it does not otherwise have. This is the one client island that
 * does, and it is the only reason the nav changed at all.
 *
 * ## The badge counts, it does not shout
 *
 * A number up to nine, then `9+`. No colour beyond the brand dot, no animation,
 * no sound. The count is also announced, so the badge is not the only way to
 * learn there is something waiting.
 *
 * Renders no badge at all until both sources have loaded — a badge that appears
 * and then disappears is worse than one that arrives a moment late.
 */
export function NotificationBell() {
  const { unread, isLoaded } = useNotifications();

  const showBadge = isLoaded && unread > 0;

  return (
    <Link
      href={ROUTES.notifications}
      aria-label={showBadge ? `Notifications, ${String(unread)} unread` : 'Notifications'}
      className="focus-ring text-content-muted hover:bg-surface-muted duration-fast relative inline-flex size-10 items-center justify-center rounded-full transition ease-out"
    >
      <Bell aria-hidden="true" className="size-5" />

      {showBadge ? (
        <span
          aria-hidden="true"
          className="bg-surface-brand text-content-on-brand absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold tabular-nums"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  );
}
