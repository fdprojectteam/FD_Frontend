import { setupWorker } from 'msw/browser';

import { env } from '@/config/env';

import { handlers } from './handlers';

/**
 * MSW browser worker (T1.14).
 *
 * Browser-only and imported dynamically by the provider, so neither MSW
 * nor this module is ever included in a production bundle. The worker
 * script itself is the committed static asset `public/mockServiceWorker.js`.
 */
export const worker = setupWorker(...handlers);

/**
 * Is this one of *our* API calls?
 *
 * Resolved through `URL` rather than a string prefix so it holds for both forms
 * `NEXT_PUBLIC_API_URL` can take: the relative `/api/v1` this POC uses, and an
 * absolute origin once a real backend exists.
 *
 * Note what this can and cannot see: it runs only for requests the worker
 * actually intercepted. A request made while the page is not controlled by the
 * Service Worker never reaches this function at all — which is why the
 * misclassification is fixed in `api-error.ts` rather than here.
 */
function isApiRequest(requestUrl: string): boolean {
  const api = new URL(env.apiUrl, window.location.origin);
  const url = new URL(requestUrl);

  return url.origin === api.origin && url.pathname.startsWith(api.pathname);
}

export async function startMockWorker(): Promise<void> {
  await worker.start({
    /**
     * Bypass everything the app legitimately loads — Next's HMR socket, chunks,
     * fonts, images — and **speak up for `/api/v1/*`** (2026-08-02).
     *
     * `'bypass'` alone was silent, and that silence cost a day. In this POC the
     * versioned API exists *only* inside this worker: `src/app/api/` holds no
     * route handlers by design, so an API request that reaches the network is
     * answered by the Next dev server with its own **HTML 404**. Downstream that
     * looked exactly like the catalogue saying "this product does not exist" —
     * see `docs/development/api-404-misclassification.md`.
     *
     * The classification defect is fixed at its source in `api-error.ts`; this
     * is the other half. A request the mock API should have handled and did not
     * is now a named, loud console error rather than an invisible passthrough
     * that surfaces three layers later as a 404 page.
     *
     * Everything outside the API base still passes through untouched. Inside it,
     * a missing handler is now a failure rather than a passthrough — which is
     * the correct trade for a path that has no server behind it in this POC.
     */
    onUnhandledRequest(request, print) {
      if (!isApiRequest(request.url)) return;

      // `print.error()` logs *and* throws, so MSW answers with a 500 rather
      // than letting the request reach the dev server. That is the point: a
      // 500 is honestly "the mock API failed", which the app already renders as
      // its retryable error state, whereas the dev server's 404 was read as a
      // verdict about the product.
      print.error();
    },
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
