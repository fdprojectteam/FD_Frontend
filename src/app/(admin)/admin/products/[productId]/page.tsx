import type { Metadata } from 'next';

import { AdminProductDetailScreen } from '@/modules/admin';

export const metadata: Metadata = {
  title: 'FD product — FD Platform Operations',
  description: 'One product, and the controlled workflow for proposing a change.',
};

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <AdminProductDetailScreen productId={productId} />;
}
