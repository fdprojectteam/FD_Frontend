'use client';

import type { ReactNode } from 'react';

import { AdminShell } from './admin-shell';
import { AdminConsoleProvider, useAdminConsole } from '../hooks/use-admin-console';

/**
 * The console's chrome, wired to the console's state.
 *
 * ## One instance, created here
 *
 * The provider is mounted at the portal boundary and the shell reads from it,
 * so the role in the header and the role a screen enforces are necessarily the
 * same value. They were not, briefly: each screen called the hook directly and
 * got its own state, which meant switching role in the header changed the
 * header and nothing else. The provider is what makes that unrepresentable.
 */
function AdminChrome({ children }: { children: ReactNode }) {
  const { role, admin, setRole } = useAdminConsole();

  return (
    <AdminShell role={role} adminName={admin.displayName} onRoleChange={setRole}>
      {children}
    </AdminShell>
  );
}

export function AdminPortal({ children }: { children: ReactNode }) {
  return (
    <AdminConsoleProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminConsoleProvider>
  );
}
