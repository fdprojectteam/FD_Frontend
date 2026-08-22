import type { Metadata } from 'next';

import { PortfolioScreen } from '@/modules/portfolio/components/portfolio-screen';

/**
 * Portfolio — the investor's confirmed fixed deposits.
 *
 * A server component owning metadata and composition only; the holdings are
 * read in the screen through the platform-level portfolio hook.
 *
 * **No Suspense boundary** — nothing on this route reads `useSearchParams`, so
 * there is no prerender bailout to contain.
 */
export const metadata: Metadata = {
  title: 'Your portfolio — FD Investment Platform',
  description:
    'Every fixed deposit you hold: how much you have invested, what each one will pay, and when it matures.',
};

export default function PortfolioPage() {
  return <PortfolioScreen />;
}
