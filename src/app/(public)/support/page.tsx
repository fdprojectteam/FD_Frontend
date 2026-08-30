import type { Metadata } from 'next';

import { SupportHomeScreen } from '@/modules/support';

/**
 * Help & support.
 *
 * A server component owning metadata and composition only; the help content and
 * the customer's requests are read in the screen.
 */
export const metadata: Metadata = {
  title: 'Help & support — FD Investment Platform',
  description:
    'Search help about your fixed deposits, bookings, verification, bank accounts and statements, or send a support request.',
};

export default function SupportPage() {
  return <SupportHomeScreen />;
}
