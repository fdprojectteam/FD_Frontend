'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/types/admin';

import { PERMISSIONS_ARE_NOT_AUTHORISATION, ROLE_LABEL } from '../utils/permissions';

/**
 * The operations console shell.
 *
 * ## Separate from the customer product, deliberately
 *
 * Its own navigation, its own header, its own density. The customer shell is a
 * marketing-grade top bar for someone browsing deposits; this is a left rail
 * for someone working a queue, and mixing them would make both worse. Nothing
 * in the customer experience links here.
 *
 * ## The role switcher is the honest part
 *
 * It sits in the header and changes what the console *renders*. It is not a
 * login, and the banner beneath it says so: there is no authentication in this
 * build and choosing a role grants nothing. In production the same choice would
 * be a claim on a token and every action would be checked on a server that does
 * not exist here.
 *
 * ## Dense, not cluttered
 *
 * One rail, one header, one content column. No breadcrumbs, no tab strips, no
 * cards wrapping cards — an operator reads this screen dozens of times a day
 * and every ornament is something they have to look past.
 */
const NAV: readonly { label: string; route: string; exact?: boolean }[] = [
  { label: 'Overview', route: ROUTES.admin, exact: true },
  { label: 'Customers', route: ROUTES.adminCustomers },
  { label: 'Applications', route: ROUTES.adminApplications },
  { label: 'FD products', route: ROUTES.adminProducts },
  { label: 'Verification', route: ROUTES.adminVerification },
  { label: 'Support', route: ROUTES.adminSupport },
  { label: 'Audit log', route: ROUTES.adminAudit },
];

const ROLES: readonly AdminRole[] = ['operations', 'product', 'support', 'auditor'];

export interface AdminShellProps {
  role: AdminRole;
  adminName: string;
  onRoleChange: (role: AdminRole) => void;
  children: ReactNode;
}

export function AdminShell({ role, adminName, onRoleChange, children }: AdminShellProps) {
  const pathname = usePathname();

  const isCurrent = (route: string, exact = false) =>
    exact ? pathname === route : pathname === route || pathname.startsWith(`${route}/`);

  return (
    <div className="bg-surface-page min-h-screen">
      <header className="border-border-default bg-surface-card border-b">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={ROUTES.admin} className="focus-ring rounded-md">
              <span className="text-body text-content font-semibold">FD Platform</span>
              <span className="text-content-muted"> · Operations</span>
            </Link>

            <Badge variant="neutral" size="sm">
              Demo environment
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-caption text-content font-medium">{adminName}</span>
              <span className="text-caption text-content-muted">{ROLE_LABEL[role]}</span>
            </div>

            <label className="sr-only" htmlFor="admin-role">
              Demonstration role
            </label>
            <select
              id="admin-role"
              value={role}
              onChange={(event) => {
                onRoleChange(event.target.value as AdminRole);
              }}
              className="focus-ring border-border-default bg-surface-card text-caption text-content h-9 rounded-md border px-3"
            >
              {ROLES.map((entry) => (
                <option key={entry} value={entry}>
                  {ROLE_LABEL[entry]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:px-8 md:py-8">
        <nav aria-label="Operations" className="md:w-56 md:shrink-0">
          <ul className="flex list-none flex-row gap-1 overflow-x-auto md:flex-col">
            {NAV.map((item) => {
              const current = isCurrent(item.route, item.exact);

              return (
                <li key={item.route}>
                  <Link
                    href={item.route as never}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'focus-ring text-caption block rounded-md px-3 py-2 whitespace-nowrap transition-colors',
                      current
                        ? 'bg-surface-brand-subtle text-content-brand font-semibold'
                        : 'text-content-muted hover:bg-surface-muted',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="admin-main" className="min-w-0 flex-1">
          {children}

          {/*
            Said once, at the foot of every screen. Everything above is this
            platform's own records; nothing here reaches a bank, a registry, a
            payment rail or a customer.
          */}
          <p className="text-caption text-content-muted border-border-default mt-10 border-t pt-4">
            {PERMISSIONS_ARE_NOT_AUTHORISATION} No action taken here contacts a bank, a verification
            provider, a payment system or a customer.
          </p>
        </main>
      </div>
    </div>
  );
}
