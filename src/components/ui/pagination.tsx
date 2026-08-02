'use client';

import { cva } from 'class-variance-authority';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Pagination — platform page navigation (T1.10).
 *
 * Purpose: the numbered pager of the approved UI (`‹ 1 2 3 4 ›`).
 * Presentation-only: it renders the control and emits `onPageChange`.
 * It performs no URL/searchParams synchronisation, no router navigation,
 * no data fetching, and makes no assumptions about page size or record
 * counts — callers own all of that.
 *
 * Every page in `1…totalPages` is rendered. There is no ellipsis or
 * truncation: the approved UI shows the full range, and truncation would
 * be an unapproved visual pattern (hence no `siblingCount` prop).
 *
 * Styling: `button-sm` squares at `radius-sm`; the active page is
 * outlined (brand border + brand-subtle fill + brand text) exactly as in
 * the approved Marketplace UI — see Component Token Mapping §2e.
 *
 * Accessibility: <nav aria-label="Pagination"> landmark wrapping a list;
 * every item is a real <button type="button">; the current page carries
 * aria-current="page" and its accessible name is the visible number;
 * icon-only previous/next buttons have explicit labels and are genuinely
 * disabled at the range boundaries.
 */
const paginationItemVariants = cva(
  'focus-ring text-caption inline-flex size-8 items-center justify-center rounded-sm border font-medium transition duration-fast ease-out disabled:pointer-events-none disabled:border-border-default disabled:bg-surface-muted disabled:text-content-placeholder disabled:opacity-70',
  {
    variants: {
      active: {
        true: 'border-border-primary bg-surface-brand-subtle text-content-brand',
        false: 'border-border-default bg-surface-card text-content-muted hover:bg-surface-muted',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page, 1-based. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Emitted with the requested page. Never called for the current page. */
  onPageChange: (page: number) => void;
  /** Disables every control in the pager. */
  disabled?: boolean;
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  ({ className, currentPage, totalPages, onPageChange, disabled = false, ...props }, ref) => {
    const pages = Array.from({ length: Math.max(totalPages, 0) }, (_, index) => index + 1);
    const isFirst = currentPage <= 1;
    const isLast = currentPage >= totalPages;

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <ul className="flex list-none items-center gap-2">
          <li>
            <button
              type="button"
              aria-label="Go to previous page"
              disabled={disabled || isFirst}
              onClick={() => onPageChange(currentPage - 1)}
              className={paginationItemVariants({ active: false })}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
          </li>

          {pages.map((page) => {
            const isCurrent = page === currentPage;
            return (
              <li key={page}>
                <button
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  disabled={disabled}
                  onClick={() => {
                    if (!isCurrent) onPageChange(page);
                  }}
                  className={paginationItemVariants({ active: isCurrent })}
                >
                  {page}
                </button>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              aria-label="Go to next page"
              disabled={disabled || isLast}
              onClick={() => onPageChange(currentPage + 1)}
              className={paginationItemVariants({ active: false })}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </li>
        </ul>
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';

export { paginationItemVariants };
