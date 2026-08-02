import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * CompareEntryBar — the Home affordance that reaches the comparison
 * (M2.7, T2.7.3b / R15a).
 *
 * **It owns nothing.** No state, no store, no router, no query: the count and
 * the href arrive derived, and Clear is reported upward. `HomeScreen` decides
 * whether it appears and what it links to — the same ownership split as
 * `CompareActionBar` (T2.7.7, D-A2).
 *
 * **The href carries `?ids=` and is built by `compareHref`.** On `/compare` the
 * URL is the selection (C4), so a bare `/compare` would render the empty state
 * however many products are selected here.
 *
 * **Clear writes the store, not a URL** — correct on Home, which carries
 * nothing about the selection in its own URL (C5). The same control on
 * `/compare` would have to write `?ids=` instead; that asymmetry is the
 * per-route authority model working, and the thing most likely to be got wrong
 * by whoever adds the next compare control.
 *
 * Sticky, like the comparison's own action bar: a sticky element keeps its
 * place in the flow, so it cannot occlude the last row of the product grid.
 */
export interface CompareEntryBarProps {
  count: number;
  href: Route;
  onClear: () => void;
}

export function CompareEntryBar({ count, href, onClear }: CompareEntryBarProps) {
  return (
    <div
      data-compare-entry=""
      className="border-border-default bg-surface-page sticky bottom-0 z-10 border-t"
    >
      <div className="container-page flex items-center justify-between gap-3 py-4">
        <p className="text-body text-content font-medium">{count} selected for comparison</p>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="lg" onClick={onClear}>
            Clear
          </Button>
          <Button asChild variant="primary" size="lg">
            <Link href={href}>Compare</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
