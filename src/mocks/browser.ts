import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/**
 * MSW browser worker (T1.14).
 *
 * Browser-only and imported dynamically by the provider, so neither MSW
 * nor this module is ever included in a production bundle. The worker
 * script itself is the committed static asset `public/mockServiceWorker.js`.
 */
export const worker = setupWorker(...handlers);

export async function startMockWorker(): Promise<void> {
  await worker.start({
    // Unhandled requests pass through untouched — the app is unaffected
    // by endpoints that have no mock yet.
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
