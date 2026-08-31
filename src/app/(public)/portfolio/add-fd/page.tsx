import type { Metadata } from 'next';

import { AddExistingFdScreen } from '@/modules/portfolio/components/add-existing-fd-screen';

export const metadata: Metadata = {
  title: 'Bring existing FDs — FD Investment Platform',
  description:
    'Add existing fixed deposits to the same portfolio you use for deposits booked here.',
};

export default function AddExistingFdPage() {
  return <AddExistingFdScreen />;
}
