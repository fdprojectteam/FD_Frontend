'use client';

import { BankBadge } from '@/components/business/bank-badge';
import { InterestRateDisplay } from '@/components/business/interest-rate-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

import type { ProductSummary } from '../types/product';
import { formatProductTenure } from '../utils';
import { addLabel } from '../utils/compare-labels';
// import { formatTenure } from '../utils/format';

/**
 * ComparePicker — the approved "Add another FD" dialog (M2.7, T2.7.6).
 *
 * **Presentation-only** (I3): no data hook, no router, no store, no knowledge
 * that a URL exists. It receives **answers, not inputs** — `isSelected` and
 * `isFull` arrive already derived from the route's authority, so the picker
 * never chooses between the URL and the store and cannot disagree with the
 * screen about either.
 *
 * That prop shape is also what would let a future Booking flow reuse it: the
 * rule that keeps it presentation-only is the rule that keeps it portable.
 *
 * **It renders its own row rather than `FDProductCard`** (plan D-M4). The card
 * is prop-compatible to a suspicious degree, but it carries a real `<Link>` to
 * the product route, and inside a dialog that navigates away — unmounting the
 * comparison the user is assembling. Its action also reads "Compare", which on
 * Home writes the store and here must write the URL: one component, two
 * authorities.
 *
 * Three reasons an Add can be unavailable, and the user is told which:
 *   • the product is already being compared — a visible "Added" badge;
 *   • the comparison is full — a status line above the list, because at four
 *     selected *every* row is disabled and a wall of disabled controls with no
 *     explanation is the accessibility failure mode of a limit;
 *   • an Add is in flight — the screen's pending guard (plan D-PENDING).
 */
export interface ComparePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ProductSummary[];
  isLoading: boolean;
  /** True once the comparison holds its maximum. Derived by the screen. */
  isFull: boolean;
  /** The maximum itself, for the description — stated before anything is disabled. */
  max: number;
  isSelected: (productId: string) => boolean;
  /** True while an Add is in flight and the URL has not caught up. */
  isAddPending: boolean;
  onAdd: (productId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ComparePicker({
  open,
  onOpenChange,
  items,
  isLoading,
  isFull,
  max,
  isSelected,
  isAddPending,
  onAdd,
  page,
  totalPages,
  onPageChange,
}: ComparePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a Fixed Deposit</DialogTitle>
          <DialogDescription>Compare up to {max} Fixed Deposits side by side.</DialogDescription>
        </DialogHeader>

        {isFull ? (
          <p role="status" className="text-body text-content-muted">
            You are comparing {max} products, the maximum. Remove one to add another.
          </p>
        ) : null}

        <ul className="flex max-h-96 list-none flex-col gap-2 overflow-y-auto">
          {isLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-16 w-full" />
                </li>
              ))
            : items.map((product) => {
                const added = isSelected(product.id);

                return (
                  <li
                    key={product.id}
                    // Test-visible identity only. Bank names are not unique
                    // across the catalogue, so without this a journey cannot
                    // name which product it accepted — which is how L3b came to
                    // assert an id it had never clicked.
                    data-product-id={product.id}
                    className="border-border-default rounded-card flex items-center gap-4 border p-3"
                  >
                    <BankBadge bank={product.bank} decorative />

                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="text-body text-content font-medium">{product.bank.name}</p>
                      <p className="text-caption text-content-muted">
                        {formatProductTenure(product)}
                      </p>
                    </div>

                    <InterestRateDisplay rate={product.interestRate} size="sm" layout="inline" />

                    {added ? <Badge variant="neutral">Added</Badge> : null}

                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={addLabel(product.bank.name)}
                      disabled={added || isFull || isAddPending}
                      onClick={() => onAdd(product.id)}
                    >
                      Add
                    </Button>
                  </li>
                );
              })}
        </ul>

        {/*
          Dormant today: `PICKER_PAGE_SIZE` covers the whole catalogue, so
          `totalPages` is 1 and this never renders. It exists so a larger
          catalogue stays reachable rather than silently truncated — recorded as
          a dormant path (plan D-O3) rather than presented as covered.
        */}
        {totalPages > 1 ? (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
