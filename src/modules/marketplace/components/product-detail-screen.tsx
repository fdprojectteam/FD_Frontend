'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isBookableProduct } from '@/constants/booking';
import { ROUTES } from '@/constants/routes';
import { isNotFoundError } from '@/services/api';
import { publishedTenure, toWholeMonths } from '@/utils/finance';

import { formatProductTenure } from '../utils';
import { BenefitChipList } from './benefit-chip-list';
import { DetailActionBar } from './detail-action-bar';
import { EligibilityPanel } from './eligibility-panel';
import { InvestmentCalculator } from './investment-calculator';
import { KeyInfoGrid } from './key-info-grid';
import { ProductAccordions } from './product-accordions';
import { ProductHeader } from './product-header';
import { TrustBadgeRow } from './trust-badge-row';
import { useCompareSelection } from '../hooks/use-compare-selection';
import { useProduct } from '../hooks/use-product';
import { estimateReturnsFor } from '../services/product-service';
import type { MaturityResult } from '../types/calculator';

/**
 * ProductDetailScreen — composition root for `/marketplace/[productId]`
 * (M2.6, T2.6.3).
 *
 * Sole owner of hooks on this route (invariants I3, A1): sections receive
 * plain data and callbacks. It is also the route's only place where a query
 * result becomes a rendering decision.
 *
 * **This route writes no URL.** Decision D3 = A keeps the calculator's amount
 * in local state, so nothing here reads or writes `useSearchParams` — which is
 * why the route needs no Suspense boundary, unlike Home (M2.4 defect C2). A
 * probe asserts the zero-writer property so a later change cannot reverse D3
 * silently.
 *
 * **Two widths, from the approved design (§2.7.1).** Content sits in a 920 px
 * reading column (`container-detail`); the action bar spans the full 1200 px
 * page container. That is the only element wider than the column.
 *
 * **404 is not an error state.** `isNotFoundError` separates "this product does
 * not exist" from "the server failed": the first renders the route's
 * `not-found` boundary, the second a retryable card. Conflating them would
 * tell a user during an outage that a product they were looking at has been
 * withdrawn (E1). React Query never retries a 4xx, so the not-found path
 * costs no requests.
 *
 * Sections are placed here and built in T2.6.4–T2.6.7; each slot below names
 * its owning task.
 */
export interface ProductDetailScreenProps {
  productId: string;
}

/**
 * Compact section heading. The approved screen renders "Key information",
 * "Benefits", and "Eligibility" visibly smaller than Home's section titles, so
 * `SectionHeading` is deliberately **not** reused here (§2.7.3). Local to this
 * screen: it is shell structure, not a component the plan introduces.
 */
function DetailSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-body-lg text-content font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Placeholder for a section that a later task fills in. */
function PendingSection({ label, className }: { label: string; className?: string }) {
  return <Skeleton aria-hidden="true" className={className ?? 'h-24 w-full'} data-slot={label} />;
}

export function ProductDetailScreen({ productId }: ProductDetailScreenProps) {
  // `isPending` is deliberately not read: the skeletons below *are* the
  // pending state, driven by the absence of `product`, and a second flag
  // saying the same thing is how two loading indicators drift apart.
  const { preview, details, isError, error, refetch } = useProduct(productId);
  const compare = useCompareSelection();

  // `details ?? preview` — both satisfy ProductSummary, so the header and key
  // information render the instant the user arrives from a listing (D1 = A′).
  const product = details ?? preview;

  /**
   * The calculator's committed amount. `null` means "the user has not
   * calculated anything yet", which is not the same as zero — and it is what
   * lets the default figures come from the product rather than from a sum.
   */
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  /**
   * The screen owns the calculation (Document 07 §15); the calculator renders
   * what it is given.
   *
   * On arrival this is `product.estimatedReturns` — already computed by
   * `ProductService` at `REFERENCE_AMOUNT` and already equal to the approved
   * ₹1,07,978. **Nothing is computed on mount** (checklist E3): recomputing a
   * figure the service has already derived would be a second implementation of
   * the same rule waiting to disagree with the first.
   */
  const maturity = useMemo<MaturityResult | undefined>(() => {
    if (!product) return undefined;
    if (calculatedAmount === null) return product.estimatedReturns;

    /*
      One implementation of the pricing rule, in the service that already owns
      it. The screen renders what it is given and computes nothing.
    */
    return estimateReturnsFor(product, calculatedAmount) ?? undefined;
  }, [calculatedAmount, product]);

  const calculatorSupported =
    product !== undefined && toWholeMonths(publishedTenure(product)) !== null;

  if (isError && isNotFoundError(error)) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-10 py-8 md:py-12">
      <div className="container-detail flex flex-col gap-8">
        <Link
          href={ROUTES.home}
          className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to Marketplace
        </Link>

        {isError ? (
          <div className="border-border-default bg-surface-card rounded-card flex flex-col items-start gap-4 border p-8">
            <div className="flex flex-col gap-1">
              <p className="text-body text-content font-medium">Unable to load this product</p>
              <p className="text-body text-content-muted">
                Something went wrong while fetching the details. Please try again.
              </p>
            </div>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {product ? (
              <ProductHeader product={product} />
            ) : (
              <div role="status" aria-live="polite">
                <span className="sr-only">Loading product details…</span>
                <Skeleton className="h-28 w-full" />
              </div>
            )}

            {/*
              Trust badges come from ProductDetails, not the summary, so they
              wait for `details` — the preview cannot supply them. Rendering a
              skeleton of the same height keeps the sections below from
              shifting when they arrive (checklist C7).
            */}
            {details ? (
              <TrustBadgeRow indicators={details.trustIndicators} />
            ) : (
              <PendingSection label="trust-badges" className="h-7 w-full max-w-md" />
            )}

            <DetailSection id="product-key-info" title="Key information">
              {product ? (
                <KeyInfoGrid product={product} />
              ) : (
                <PendingSection label="key-info" className="h-24 w-full" />
              )}
            </DetailSection>

            {product && calculatorSupported ? (
              <InvestmentCalculator
                product={product}
                result={maturity ?? product.estimatedReturns}
                onCalculate={setCalculatedAmount}
              />
            ) : product ? (
              <section
                aria-labelledby="calculator-unavailable-title"
                className="border-border-default bg-surface-card rounded-card flex flex-col gap-2 border p-6"
              >
                <h2
                  id="calculator-unavailable-title"
                  className="text-body-lg text-content font-semibold"
                >
                  Maturity estimate unavailable
                </h2>
                <p className="text-body text-content-muted">
                  This product is published for {formatProductTenure(product)}. We need the
                  bank&apos;s day-count basis before calculating an estimated maturity, so no
                  estimate is shown.
                </p>
              </section>
            ) : (
              <PendingSection label="calculator" className="h-72 w-full" />
            )}

            <DetailSection id="product-benefits" title="Benefits">
              {product ? (
                <BenefitChipList benefits={product.benefits} />
              ) : (
                <PendingSection label="benefits" className="h-10 w-full max-w-lg" />
              )}
            </DetailSection>

            {/*
              Eligibility and the accordions exist only on ProductDetails, so
              they wait for `details`; the preview cannot supply them.
            */}
            <DetailSection id="product-eligibility" title="Eligibility">
              {details ? (
                <EligibilityPanel eligibility={details.eligibility} />
              ) : (
                <PendingSection label="eligibility" className="h-20 w-full" />
              )}
            </DetailSection>

            {details ? (
              <ProductAccordions product={details} />
            ) : (
              <PendingSection label="accordions" className="h-48 w-full" />
            )}
          </>
        )}
      </div>

      {/*
        Action bar — T2.6.7. Full page-container width by design: it is the one
        element wider than the reading column (§2.6). Sticky below md, static
        from md (D7); the bottom padding above reserves room for it so the last
        accordion is never obscured.
      */}
      {product && !isError ? (
        <DetailActionBar
          isComparing={compare.has(product.id)}
          compareDisabled={compare.isFull && !compare.has(product.id)}
          bookingHref={
            isBookableProduct(product.id) ? ROUTES.bookingOverview(product.id) : undefined
          }
          onCompare={() => compare.toggle(product.id)}
        />
      ) : null}
    </div>
  );
}
