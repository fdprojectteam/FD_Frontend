import type { Metadata } from 'next';

import { TaxCenterScreen } from '@/modules/tax';

/**
 * Tax Center.
 *
 * A server component owning metadata and composition only; every figure is
 * derived in the screen from the canonical portfolio. Nothing here is stored,
 * and no tax liability is calculated anywhere in this route.
 */
export const metadata: Metadata = {
  title: 'Tax Center — FD Investment Platform',
  description:
    'FD interest attributable to each Tax Year, derived from the deposits recorded on this platform.',
};

export default function TaxCenterPage() {
  return <TaxCenterScreen />;
}
