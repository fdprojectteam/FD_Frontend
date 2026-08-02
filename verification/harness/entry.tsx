/**
 * Runtime harness entry — mounts the REAL Marketplace Home.
 *
 * The only substitution is `next/navigation` (aliased at bundle time). The
 * provider stack mirrors `app/providers.tsx` minus the MSW browser worker:
 * the harness serves the project's own handlers through msw/node instead, so
 * the data path — repository → service → React Query — is untouched.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { ROUTES } from '@/constants/routes';
import { CompareScreen } from '@/modules/marketplace/components/compare-screen';
import { HomeScreen } from '@/modules/marketplace/components/home-screen';
import { CompareSelectionProvider } from '@/modules/marketplace/hooks/use-compare-selection';
import { createQueryClient } from '@/services/query';

export {
  currentUrl,
  historyBack,
  historyForward,
  historyStack,
  pushCalls,
  replaceCalls,
  resetHistory,
  visit,
} from './next-navigation';

/**
 * The service is exported so the comparison batch can be exercised without a
 * component (T2.7.1a). `useCompareProducts` has no consumer until T2.7.3, but
 * the data path it depends on — repository → axios → MSW → mapper — is real
 * now and is the only layer where the project's own handlers run.
 */
export { productService } from '@/modules/marketplace/services';

let root: Root | null = null;

/**
 * The harness's stand-in for the App Router: it picks the **real screen** for
 * the current path, exactly as `app/(public)/…/page.tsx` does.
 *
 * This is a router substitute, not a test double. It renders no markup of its
 * own and defines no behaviour — the alternative, a bespoke component that
 * hosts a hook, would test a tree the application never renders, which is the
 * one thing this harness refuses to do.
 *
 * The Suspense boundary that `compare/page.tsx` carries is a *prerendering*
 * concern (defect C2); there is no prerendering here, so it is not reproduced.
 * Its presence in the route is asserted statically instead.
 */
function ScreenForRoute() {
  const pathname = usePathname();
  return pathname === ROUTES.compare ? <CompareScreen /> : <HomeScreen />;
}

/**
 * Mounts the screen for the current URL. Call `unmount()` first to simulate a
 * full refresh.
 */
export function mount(container: HTMLElement) {
  const queryClient = createQueryClient();
  root = createRoot(container);
  root.render(
    // StrictMode double-invokes render and effects in development, which is
    // how the M2.4 render-loop defect (C1) would surface again.
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {/*
          Mirrors app/(public)/layout.tsx, which mounts the compare selection
          provider for the public routes (M2.6, D6). The harness must reproduce
          the real provider stack, or it tests a tree the application never
          renders.
        */}
        <CompareSelectionProvider>
          <ScreenForRoute />
        </CompareSelectionProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

export function unmount() {
  root?.unmount();
  root = null;
}
