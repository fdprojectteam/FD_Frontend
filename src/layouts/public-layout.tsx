import { Footer } from '@/components/navigation/footer';
import { MobileTabBar } from '@/components/navigation/mobile-nav';
import { TopNav } from '@/components/navigation/top-nav';

/**
 * PublicLayout — the public application shell (T1.13), matching the
 * approved Marketplace UI. Structure and landmarks only: no business
 * logic, no page content.
 *
 * Layout notes:
 * - Skip link is the first focusable element (Document 05 §19).
 * - `pb-16 md:pb-0` reserves the fixed mobile tab bar's height (64px =
 *   --ds-space-16) so content is never obscured.
 * - `scroll-mt-16` on <main> keeps anchored content clear of the sticky
 *   header when jumping to in-page targets.
 */
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-page flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="focus-ring bg-surface-card text-body text-content-brand sr-only rounded-md px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-(--ds-z-popover)"
      >
        Skip to content
      </a>

      <TopNav />

      <main id="main-content" className="flex-1 scroll-mt-16 pb-16 md:pb-0">
        {children}
      </main>

      <Footer />
      <MobileTabBar />
    </div>
  );
}
