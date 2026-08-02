import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * CompareEmptyState — `/compare` with nothing to compare (M2.7, T2.7.3).
 *
 * **Not in the approved designs.** The comparison screens all show products, so
 * this follows the M2.6 empty-state pattern rather than inventing a new one: a
 * short line and one way out. The copy is **assumption A2** and still needs
 * design confirmation — it is recorded in the plan's assumption register rather
 * than presented as approved.
 *
 * On this route the empty state is a state of the **URL**, not of the store
 * (contract C4): `/compare` with no `?ids=` is empty even when products are
 * selected elsewhere in the session.
 */
export function CompareEmptyState() {
  return (
    <div className="border-border-default bg-surface-card rounded-card flex flex-col items-start gap-4 border p-8">
      <div className="flex flex-col gap-1">
        <p className="text-body text-content font-medium">Nothing to compare yet</p>
        <p className="text-body text-content-muted">
          Choose Compare on a Fixed Deposit to see it side by side with others.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href={ROUTES.home}>Browse Fixed Deposits</Link>
      </Button>
    </div>
  );
}
