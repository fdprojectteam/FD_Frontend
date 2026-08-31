'use client';

import { CircleQuestionMark, House, Menu, User, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import { MOBILE_TAB_NAV, PRIMARY_NAV, isNavItemActive } from '@/constants/navigation';
import { cn } from '@/lib/utils';

/**
 * Mobile navigation (T1.13) — two pieces from the approved mobile UI:
 *
 * `MobileNavPanel` — the menu toggle plus an inline panel that expands
 * beneath the top bar (approved Decision (a): no Drawer/Sheet primitive is
 * introduced; the approved expand/collapse motion is reused).
 *
 * `MobileTabBar` — the fixed four-item icon-only bottom bar. PublicLayout
 * reserves matching bottom padding so content is never obscured.
 *
 * Both are presentation-only and derive active state from the pathname.
 */

const ICONS = {
  home: House,
  portfolio: Wallet,
  profile: User,
  help: CircleQuestionMark,
} as const;

export function MobileNavPanel({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Escape closes the panel (parity with the platform's overlay behaviour).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="focus-ring text-content-muted hover:bg-surface-muted duration-fast inline-flex size-10 items-center justify-center rounded-full transition ease-out xl:hidden"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="border-border-default bg-surface-card animate-expand-down absolute inset-x-0 top-16 overflow-hidden border-b xl:hidden"
        >
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="flex flex-col">
              {PRIMARY_NAV.map((item) => {
                const active = isNavItemActive(item, pathname);
                const base = 'text-body flex items-center py-3 font-medium';

                if (!item.enabled || !item.route) {
                  return (
                    <li key={item.label}>
                      {/* Destination not implemented — wired when it exists. */}
                      <span aria-disabled="true" className={cn(base, 'text-content-muted')}>
                        {item.label}
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.route}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        base,
                        'focus-ring rounded-md',
                        active ? 'text-content-brand' : 'text-content-muted',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="bg-surface-card border-border-default fixed inset-x-0 bottom-0 z-(--ds-z-sticky) border-t xl:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {MOBILE_TAB_NAV.map((item) => {
          const Icon = ICONS[item.icon ?? 'home'];
          const active = isNavItemActive(item, pathname);
          const base = 'flex h-full w-full items-center justify-center';

          return (
            <li key={item.label} className="flex-1">
              {item.enabled && item.route ? (
                <Link
                  href={item.route}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    base,
                    'focus-ring',
                    active ? 'text-content-brand' : 'text-content-muted',
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </Link>
              ) : (
                /* Destination not implemented — wired when it exists. */
                <span
                  aria-label={item.label}
                  aria-disabled="true"
                  className={cn(base, 'text-content-muted')}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
