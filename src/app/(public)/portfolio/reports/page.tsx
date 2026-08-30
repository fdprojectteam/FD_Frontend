import type { Metadata } from 'next';

import { ReportsScreen } from '@/modules/portfolio/components/reports';

/**
 * Reports & statements — nested under Portfolio, deliberately.
 *
 * A statement is a document about a holding, so the route sits inside the one
 * that owns holdings. It also keeps "Portfolio" the active navigation item,
 * because the primary navigation matches on prefix.
 */
export const metadata: Metadata = {
  title: 'Reports & statements — FD Investment Platform',
  description:
    'Statements, booking records and maturity advices for the fixed deposits you hold, generated from your own records.',
};

export default function ReportsPage() {
  return <ReportsScreen />;
}
