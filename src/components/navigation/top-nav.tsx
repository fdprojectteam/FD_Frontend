'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BrandMark } from '@/components/navigation/brand-mark';
import { MobileNavPanel } from '@/components/navigation/mobile-nav';
import { PRIMARY_NAV, isNavItemActive } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

/**
 * TopNav — the public shell header from the approved Marketplace UI
 * (T1.13). Presentation-only: no business logic, no notification or
 * profile behaviour (both are future approved tasks).
 *
 * Desktop (≥768px): wordmark · centre nav links · notifications · avatar.
 * Mobile (<768px): menu toggle · wordmark · notifications · avatar, with
 * the nav links in an inline expandable panel beneath the bar.
 *
 * The active item is derived from the current pathname via the typed
 * navigation configuration — never hardcoded. Items whose destination does
 * not exist yet render identically but non-interactive (aria-disabled).
 */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="bg-surface-card border-border-default sticky top-0 z-(--ds-z-sticky) border-b">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MobileNavPanel pathname={pathname} />
          <Link href={ROUTES.home} className="focus-ring rounded-md">
            <BrandMark />
          </Link>
        </div>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {PRIMARY_NAV.map((item) => {
              const active = isNavItemActive(item, pathname);
              const base = 'text-body font-medium transition duration-fast ease-out';

              if (!item.enabled || !item.route) {
                return (
                  <li key={item.label}>
                    {/* Destination not implemented — routing is wired when it exists. */}
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
                    className={cn(
                      base,
                      'focus-ring inline-flex h-16 items-center border-b-2',
                      active
                        ? 'border-border-primary text-content-brand'
                        : 'hover:text-content text-content-muted border-transparent',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            aria-disabled="true"
            className="focus-ring text-content-muted hover:bg-surface-muted duration-fast inline-flex size-10 items-center justify-center rounded-full transition ease-out"
          >
            <Bell aria-hidden="true" className="size-5" />
          </button>
          <span
            aria-label="Account"
            className="bg-surface-muted text-caption text-content-muted inline-flex size-10 items-center justify-center rounded-full font-medium"
          >
            PS
          </span>
        </div>
      </div>
    </header>
  );
}
