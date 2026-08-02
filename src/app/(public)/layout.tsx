import { PublicLayout } from '@/layouts/public-layout';
import { CompareSelectionProvider } from '@/modules/marketplace/hooks/use-compare-selection';

/**
 * Public experience layout — wires the approved public shell (T1.13):
 * top navigation, footer, mobile tab bar, skip link, and the shared
 * responsive page container. Page content supplies its own sections.
 *
 * **CompareSelectionProvider is mounted here, not in `app/providers.tsx`**
 * (M2.6, decision D6). It holds Marketplace feature state, and `providers.tsx`
 * is the platform-wide composition point; a feature provider there would
 * outlive and outscope the routes that need it. Here its lifetime matches the
 * public routes — which is exactly what the selection has to survive:
 * navigating between the listing and a product's details.
 */
export default function PublicRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CompareSelectionProvider>
      <PublicLayout>{children}</PublicLayout>
    </CompareSelectionProvider>
  );
}
