import { BrandMark } from '@/components/navigation/brand-mark';
import { APP_NAME } from '@/constants/app';
import { FOOTER_COMPACT_NAV, FOOTER_NAV } from '@/constants/navigation';

/**
 * Footer — the public shell footer from the approved Marketplace UI (T1.13).
 *
 * Desktop (≥768px): wordmark + copyright on the left, three link columns
 * (Company · Legal · Support) on the right.
 * Mobile (<768px): condensed single line — copyright · Terms · Privacy · Help.
 *
 * Presentation-only. Every link destination is unimplemented, so items
 * render visually identical but non-interactive (aria-disabled); routing is
 * wired when the destinations exist.
 */
export function Footer() {
  const year = 2026;

  return (
    <footer className="bg-surface-card border-border-default border-t">
      {/* Desktop */}
      <div className="container-page hidden py-8 md:block">
        <div className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <BrandMark />
            <p className="text-caption text-content-muted">
              © {year} {APP_NAME}. All rights reserved.
            </p>
          </div>

          <div className="flex gap-16">
            {FOOTER_NAV.map((column) => (
              <div key={column.heading} className="flex flex-col gap-3">
                <h2 className="text-caption text-content font-semibold">{column.heading}</h2>
                <ul className="flex flex-col gap-2">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <span aria-disabled="true" className="text-body text-content-muted">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile — condensed single line */}
      <div className="container-page py-6 md:hidden">
        <p className="text-caption text-content-muted flex flex-wrap items-center justify-center gap-2">
          <span>
            © {year} {APP_NAME}
          </span>
          {FOOTER_COMPACT_NAV.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <span aria-hidden="true">·</span>
              <span aria-disabled="true">{item.label}</span>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
