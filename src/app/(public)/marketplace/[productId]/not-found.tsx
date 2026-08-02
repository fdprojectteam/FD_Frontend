import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * Not-found boundary for the product details route (M2.6, T2.6.2).
 *
 * Rendered when the screen calls `notFound()` because the API reported
 * `PRODUCT_NOT_FOUND` (404). A server error is a different thing entirely and
 * must **not** land here — it renders the retryable error card instead, so a
 * transient outage never tells the user the product does not exist (E1). That
 * distinction is wired in T2.6.3; this file is its destination.
 *
 * The link targets `ROUTES.home`, not `ROUTES.marketplace`: the approved UI
 * renders the listing inline on Home, so `/marketplace` has no page (see
 * `constants/routes.ts`).
 *
 * Copy is new — the approved screens show no 404 state. Tokens and primitives
 * only, no new pattern, but the wording is worth confirming with design.
 */
export default function ProductNotFound() {
  return (
    <div className="container-page flex flex-col items-start gap-6 py-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-content">Product not found</h1>
        <p className="text-body text-content-muted max-w-prose">
          This Fixed Deposit is no longer available, or the link may be out of date. The rest of the
          marketplace is unaffected.
        </p>
      </div>

      <Button asChild variant="primary" size="lg">
        <Link href={ROUTES.home}>Back to Marketplace</Link>
      </Button>
    </div>
  );
}
