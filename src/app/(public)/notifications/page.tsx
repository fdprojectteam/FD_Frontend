import type { Metadata } from 'next';

import { NotificationsScreen } from '@/modules/notifications';

/**
 * The notification centre.
 *
 * A server component owning metadata and composition only; notifications are
 * derived in the screen from the platform-level hook, which reads holdings and
 * the investor's record rather than a feed of its own.
 */
export const metadata: Metadata = {
  title: 'Notifications — FD Investment Platform',
  description:
    'Updates about your fixed deposit bookings, identity verification and upcoming maturities.',
};

export default function NotificationsPage() {
  return <NotificationsScreen />;
}
