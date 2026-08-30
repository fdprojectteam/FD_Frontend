import type { Metadata } from 'next';

import { MaturityScreen } from '@/modules/portfolio/components/maturity/maturity-screen';

/**
 * Maturity Management — nested under Portfolio, deliberately.
 *
 * A maturity is a question asked of a holding, so the route sits inside the one
 * that owns holdings. It also keeps "Portfolio" the active navigation item,
 * because the primary navigation matches on prefix.
 */
export const metadata: Metadata = {
  title: 'Your maturities — FD Investment Platform',
  description:
    'When each of your fixed deposits matures, what it is expected to pay, and the instruction that applies.',
};

export default function MaturitiesPage() {
  return <MaturityScreen />;
}
