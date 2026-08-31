import type { Metadata } from 'next';

import { ManualFdScreen } from '@/modules/portfolio/components/manual-fd-screen';

export const metadata: Metadata = {
  title: 'Add existing FD — FD Investment Platform',
  description: 'Record a fixed deposit you already hold so it appears in your unified portfolio.',
};

export default function ManualFdPage() {
  return <ManualFdScreen />;
}
