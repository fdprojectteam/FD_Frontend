import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContactSupportScreen } from '@/modules/support';

/**
 * Contacting support.
 *
 * **A Suspense boundary is required here.** The screen reads `useSearchParams`
 * to pick up the deposit or account the customer arrived from, which throws
 * `BailoutToCSRError` during prerendering — the same defect Home's boundary
 * contains. Without it this route fails the production build.
 */
export const metadata: Metadata = {
  title: 'Contact support — FD Investment Platform',
  description: 'Send a support request about a deposit, an account, or anything else.',
};

export default function ContactSupportPage() {
  return (
    <Suspense fallback={null}>
      <ContactSupportScreen />
    </Suspense>
  );
}
