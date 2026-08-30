import { AdminPortal } from '@/modules/admin';

/**
 * The operations portal shell.
 *
 * A route group of its own, so the console does not inherit the customer
 * product's top navigation, footer or mobile tab bar. Nothing in the customer
 * experience links here, and nothing here links back into it: they are two
 * portals over one platform.
 */
export default function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminPortal>{children}</AdminPortal>;
}
