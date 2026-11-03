'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  BOOKING_SELECTION_PARAM,
  parseBookingTermsSnapshot,
  type BookingTermsSnapshot,
} from '@/types/booking-selection';
import { formatRate } from '@/utils';

import { createBookingOverviewService } from '../services/booking-overview-service';
import type { BookingOverview } from '../types/booking';

/**
 * The deposit being booked — resolved once per booking session.
 *
 * ## Why this exists
 *
 * Overview resolved its deposit from `productId` while Investment Details and
 * Nominee each defaulted to a hardcoded fixture. Three screens, three
 * mechanisms, one fact — and the two that defaulted would have shown the
 * approved Axis deposit no matter which product the user had actually chosen.
 *
 * The resolution now happens **once**, in `booking/[productId]/layout.tsx`, and
 * every screen reads it from here. There is no prop to override it and nothing
 * to resolve a second time, so the three screens cannot disagree about which
 * deposit the user is partway through booking.
 *
 * ## Why it is separate from `useBookingDraft`
 *
 * They are different kinds of state and it is worth keeping them apart:
 *
 * - **The product is immutable session context** — resolved from the URL,
 *   never edited, identical for the life of the booking.
 * - **The draft is mutable feature state** — the amount, tenure, payout and
 *   nominee the user is entering.
 *
 * Folding the product into the draft would make `useBookingDraft()` return
 * something that is not a draft, and would put an immutable value behind an API
 * whose whole purpose is mutation.
 *
 * ## What replaces it
 *
 * A `useBookingOverview(productId)` query, when the Booking API exists. The
 * layout is the only file that changes; every screen already reads a hook and
 * knows nothing about where the object came from.
 */
const BookingProductContext = createContext<BookingOverview | null>(null);

export interface BookingProductProviderProps {
  /** The id from the route. The deposit is resolved from it, here, once. */
  productId: string;
  children: ReactNode;
}

/**
 * Resolves the deposit for `productId` and holds it for the booking session.
 *
 * ## Why resolution is on the client
 *
 * It used to happen in the route's server layout, which worked only for the one
 * deposit that resolves from a local fixture. Every other id fell through to the
 * catalogue over HTTP — and the catalogue is served by MSW, which runs **in the
 * browser only**. A server component fetching `/api/v1/...` has no origin to
 * resolve the relative base URL against and no worker to answer it, so the
 * request failed and surfaced as `ApiError`.
 *
 * Moving resolution here puts Booking on the same footing as every other
 * data-driven screen in this codebase: React Query, the existing repository, the
 * existing service. Nothing about the transport, the contract or the fail-closed
 * behaviour changes — only *where* the call is made.
 *
 * ## Still resolved once, still fails closed
 *
 * One query per booking session, keyed on the id, shared by all three steps
 * through this context. `notFound()` on an id the catalogue does not know, so an
 * unknown product still reaches Booking's not-found boundary rather than
 * rendering a substitute deposit.
 */
export function BookingProductProvider({ productId, children }: BookingProductProviderProps) {
  const service = useMemo(() => createBookingOverviewService(), []);
  const searchParams = useSearchParams();
  const initialSelection = useRef<BookingTermsSnapshot | null | undefined>(undefined);
  const hasMalformedSelection = useRef(false);
  if (initialSelection.current === undefined) {
    const values = searchParams.getAll(BOOKING_SELECTION_PARAM);
    const parsed = parseBookingTermsSnapshot(values.length === 1 ? values[0] : null);
    hasMalformedSelection.current = values.length > 0 && parsed === null;
    initialSelection.current = parsed;
  }
  const selection = initialSelection.current ?? null;
  const [acceptedUpdatedRate, setAcceptedUpdatedRate] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['booking', 'overview', productId, selection],
    queryFn: () => service.findByProductId(productId, selection ?? undefined),
  });

  if (isPending) return <BookingProductSkeleton />;

  /* A failed lookup is recoverable; only an explicit null means the id is stale. */
  if (isError) return <BookingLookupError onRetry={() => void refetch()} />;

  if (!data) return <BookingProductUnavailable onRetry={() => void refetch()} />;

  if (hasMalformedSelection.current) {
    return <BookingTermsUnavailable message="The selected FD terms could not be verified." />;
  }

  const selectionProblem = selection === null ? null : selectionConsistencyProblem(selection, data);
  if (selectionProblem !== null) return <BookingTermsUnavailable message={selectionProblem} />;

  if (
    selection !== null &&
    selection.annualRate !== data.deposit.terms.interestRate &&
    !acceptedUpdatedRate
  ) {
    return (
      <UpdatedRateReview
        previousRate={selection.annualRate}
        currentRate={data.deposit.terms.interestRate}
        onAccept={() => setAcceptedUpdatedRate(true)}
      />
    );
  }

  return <BookingProductContext.Provider value={data}>{children}</BookingProductContext.Provider>;
}

function selectionConsistencyProblem(
  selection: BookingTermsSnapshot,
  overview: BookingOverview,
): string | null {
  const { deposit } = overview;
  if (selection.productId !== deposit.productId || selection.bankId !== deposit.bank.id) {
    return 'The selected bank product no longer matches the product that Booking resolved.';
  }
  if (selection.tenureMonths !== deposit.terms.tenureMonths) {
    return 'The selected FD term is no longer available for this product.';
  }
  if (
    selection.payout !== deposit.payout ||
    selection.interestType !== deposit.interestType ||
    selection.compoundingFrequency !== (deposit.compoundingFrequency ?? null)
  ) {
    return 'The selected FD payout or compounding terms have changed.';
  }
  return null;
}

function BookingTermsUnavailable({ message }: { message: string }) {
  return (
    <div className="container-page flex flex-col items-start gap-5 py-24" role="alert">
      <h1 className="text-h2 text-content">This FD&apos;s terms have changed</h1>
      <p className="text-body text-content-muted max-w-prose">{message}</p>
      <Button asChild>
        <Link href={ROUTES.home}>Browse current FDs</Link>
      </Button>
    </div>
  );
}

function UpdatedRateReview({
  previousRate,
  currentRate,
  onAccept,
}: {
  previousRate: number;
  currentRate: number;
  onAccept: () => void;
}) {
  return (
    <div className="container-page flex flex-col items-start gap-5 py-24" role="alert">
      <h1 className="text-h2 text-content">The FD rate has changed</h1>
      <p className="text-body text-content-muted max-w-prose">
        The bank&apos;s current rate is different from the rate shown in your recommendation. Review
        the updated rate before continuing; all booking figures will use the current rate.
      </p>
      <dl className="border-border-default rounded-card grid w-full max-w-md grid-cols-2 gap-3 border p-5">
        <dt className="text-body text-content-muted">Recommended rate</dt>
        <dd className="text-body text-content font-semibold">{formatRate(previousRate)} p.a.</dd>
        <dt className="text-body text-content-muted">Current rate</dt>
        <dd className="text-body text-content font-semibold">{formatRate(currentRate)} p.a.</dd>
      </dl>
      <Button type="button" onClick={onAccept}>
        Review updated terms and continue
      </Button>
    </div>
  );
}

function BookingLookupError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="container-page flex flex-col items-start gap-5 py-24" role="alert">
      <h1 className="text-h2 text-content">We couldn&apos;t verify this FD right now</h1>
      <p className="text-body text-content-muted max-w-prose">
        The demonstration catalogue could not be reached. No booking has been started and we have
        not treated this FD as unavailable.
      </p>
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function BookingProductUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="container-page flex flex-col items-start gap-5 py-24">
      <h1 className="text-h2 text-content">
        This FD is not in the current demonstration catalogue
      </h1>
      <p className="text-body text-content-muted max-w-prose">
        The selection may be out of date or the product may have changed. No product has been
        substituted and no booking has been started.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={ROUTES.home}>Browse current FDs</Link>
        </Button>
        <Button type="button" variant="secondary" onClick={onRetry}>
          Check again
        </Button>
      </div>
    </div>
  );
}

/** The shape of the Booking chrome while the deposit is in flight. */
function BookingProductSkeleton() {
  return (
    <div
      className="container-page flex flex-col gap-6 py-8 md:py-12"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading the deposit you selected…</span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Throws outside a provider rather than falling back to a fixture.
 *
 * A fallback is precisely the defect being removed: a booking screen that
 * quietly renders *some* deposit is worse than one that fails to render, because
 * the first ships and the second is caught the moment it is opened.
 */
export function useBookingProduct(): BookingOverview {
  const overview = useContext(BookingProductContext);

  if (!overview) {
    throw new Error('useBookingProduct must be used within a BookingProductProvider.');
  }

  return overview;
}
