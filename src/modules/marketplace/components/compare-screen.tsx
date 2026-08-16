'use client';

import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

import { CompareActionBar } from './compare-action-bar';
import { CompareAmountField } from './compare-amount-field';
import { CompareCards } from './compare-cards';
import { CompareEmptyState } from './compare-empty-state';
import { ComparePicker } from './compare-picker';
import { CompareTable } from './compare-table';
import { InvestmentPreferences } from './investment-preferences';
import { PreferenceApplyBar } from './preference-apply-bar';
import { PICKER_PAGE_SIZE } from '../constants/compare';
import { useCompareProducts } from '../hooks/use-compare-products';
import { useCompareSelection } from '../hooks/use-compare-selection';
import { useCompareUrlState } from '../hooks/use-compare-url-state';
import { useComparisonPreferences } from '../hooks/use-comparison-preferences';
import { useProducts } from '../hooks/use-products';
import { buildCompareRows } from '../utils/compare-rows';
import { formatCurrency } from '../utils/format';

/**
 * CompareScreen — the `/compare` shell (M2.7, T2.7.3).
 *
 * The route's **sole hook owner** (I2a): it reads the selection store, owns the
 * URL through `useCompareUrlState`, resolves the batch, and passes data and
 * callbacks down. Sections added in T2.7.4 onward receive props and touch
 * neither the router nor the store.
 *
 * **The URL is authoritative here** (contract C4). Removing a column writes
 * `?ids=` and nothing else; the store is synchronised from the URL by the hook.
 * That is why the screen never calls `add`, `remove`, or `toggle` — and why
 * Back and Forward restore columns rather than only the address bar.
 *
 * **Which source each branch reads is deliberate:**
 *   • *is this comparison empty?* — the **URL**, so a cold load never flashes
 *     the empty state in the frame before the store has synchronised;
 *   • *what is displayed?* — the **store**, so the cap of four governs the
 *     columns even while the URL still carries five (I7 is write-only, so an
 *     over-cap URL is not rewritten until the next user write).
 *
 * The desktop table arrived in T2.7.4 and owns the `buildCompareRows` call
 * site's output. The mobile carousel (T2.7.5), the picker (T2.7.6) and the
 * bottom action bar (T2.7.7) still follow.
 */
export function CompareScreen() {
  const selection = useCompareSelection();
  const { ids, addId, removeId } = useCompareUrlState(selection);

  /* ---- Comparison context (client change request, 2026-08-02) ----- */

  /**
   * The Investment Preferences the whole comparison is calculated against.
   *
   * Extracted into `useComparisonPreferences` rather than held as loose
   * `useState` here: the brief asks for a section that grows to Tenure, Payout,
   * Senior Citizen and Tax Saver, and preferences kept as individual state pairs
   * on this screen would meet that instruction in the components while defeating
   * it in the state. One object, one setter per field, one place to add the
   * next.
   *
   * The screen still owns the rules and the field still only applies them (I3).
   * No component calculates anything: the amount goes to the service, which is
   * where `calculateMaturity` — and now slab resolution — has always lived.
   */
  /**
   * **Draft and applied** (Comparison Experience Refinement, 2026-08-02). The
   * screen reads `preferences` — the applied context — and never the draft. The
   * draft exists only between the field and the apply action; everything below
   * this line, including the query key, is calculated from a figure the user
   * confirmed.
   */
  const {
    preferences,
    depositAmountInput,
    depositAmountError,
    hasPendingChanges,
    canApply,
    setDepositAmount,
    applyPreferences,
    resetDraft,
    applyDefaultFor,
  } = useComparisonPreferences();

  const amount = preferences.depositAmount;

  /**
   * Applying from the button, which then leaves.
   *
   * The focus move is the whole reason this wrapper exists: the action is
   * present only while there is something to apply, so the element the user just
   * activated unmounts, and focus falls to `<body>` — the next Tab would start
   * from the top of the page. Returning it to the field puts the user back where
   * the edit began, which is also where the next edit starts.
   *
   * Enter is bound to `applyPreferences` directly: the field already has focus,
   * so there is nothing to restore.
   */
  const amountFieldRef = useRef<HTMLInputElement>(null);

  const handleApply = () => {
    applyPreferences();
    amountFieldRef.current?.focus();
  };

  const {
    data: products,
    isError,
    isFetching,
    refetch,
  } = useCompareProducts(selection.ids, amount);

  /**
   * Seeds the default deposit from the products themselves — the highest
   * minimum among them, floored at ₹1,00,000, so the opening comparison is one
   * every column can actually be opened at.
   *
   * It runs on every `products` change and the hook decides whether to act: the
   * guard belongs with the state it protects, not spread across the call site,
   * and "the user has typed" is not a fact this component should have to
   * remember. Adding or removing a column afterwards therefore leaves the
   * entered amount alone, which is correct — the user's figure is about their
   * money, not about the current selection.
   */
  useEffect(() => {
    if (products) applyDefaultFor(products);
  }, [products, applyDefaultFor]);

  /* ---- "Add another FD" (T2.7.6) --------------------------------- */

  const [pickerOpen, setPickerOpen] = useState(false);

  /**
   * Which compared product the user has chosen to book (Phase 3 entry point).
   *
   * **Screen-local, and deliberately not in the URL.** The `?ids=` parameter is
   * the comparison's contract (C4) — what is being compared is shareable, and a
   * link that also carried someone else's *choice* would be a different claim.
   * The choice lives exactly as long as the screen does, and Booking's own route
   * carries the product id from there on.
   */
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [pickerPage, setPickerPage] = useState(1);

  /**
   * The catalogue is fetched only once the dialog opens. The screen owns the
   * query because it owns the state it is gated on (I3): a picker that fetched
   * for itself would be a second hook owner on this route, and an ungated query
   * would compete with the comparison's own batch for a page the user may never
   * see.
   *
   * Built inline rather than through `toProductListParams`, like the hero
   * sample on Home: A5 governs the **URL → API** translation, and nothing here
   * comes from a URL.
   */
  const catalogue = useProducts(
    { page: pickerPage, limit: PICKER_PAGE_SIZE },
    { enabled: pickerOpen },
  );

  /**
   * Both derivations read the route's authority (plan D-AUTH). On `/compare`
   * the URL is the selection and the store follows it, so deriving either from
   * the store would read a value that lags by a render — which is what makes
   * the race below possible.
   *
   * The count comes from the URL; the limit comes from the store, so the cap
   * stays owned by one module (C2). `MAX_COMPARE` is not imported here.
   */
  const isSelected = (productId: string) => ids.includes(productId);
  const isFull = ids.length >= selection.max;

  /**
   * Pending Add guard (plan D-PENDING).
   *
   * The dialog stays open to invite several Adds, and `ids` lags a `push` by at
   * least a render. Two Adds inside that window either write a list that never
   * contained the first product, or both compute against `isFull === false` and
   * put a fifth id in the URL that is never displayed. So while an Add is in
   * flight, **every** Add is disabled — the hazard is the stale `ids`, not the
   * repeated product.
   */
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const idsAtAdd = useRef<string[] | null>(null);

  const handleAdd = (productId: string) => {
    idsAtAdd.current = ids;
    setPendingAddId(productId);
    addId(productId);
  };

  useEffect(() => {
    if (pendingAddId === null) return;

    // Clears when the URL moved from where it was when we asked, **or** when
    // what we asked for is already there. The second branch is not optional:
    // `addId` returns early without navigating if the id is present, so a guard
    // waiting only for the URL to move would never clear. The first also
    // releases the guard on Back/Forward, which is correct — a history
    // navigation makes the URL authoritative again.
    if (ids !== idsAtAdd.current || ids.includes(pendingAddId)) {
      setPendingAddId(null);
    }
  }, [ids, pendingAddId]);

  /**
   * The heading counts what will be shown. Before the first synchronisation the
   * store is still empty, so the capped URL length stands in — the same number,
   * one frame earlier, and never a "Comparing 0 of 4" flash.
   */
  const columnCount = products?.length ?? ids.slice(0, selection.max).length;

  /**
   * The row model's **single call site** (checklist H4). The screen owns the
   * derivation; the table renders what it is handed, and the mobile card
   * (T2.7.5) will read the same array column-major — one ordering, two
   * presentations, no way for them to drift.
   */
  const rows = useMemo(() => buildCompareRows(products ?? []), [products]);

  /**
   * Is there a comparison to render, and to act on? Derived **once** and used
   * by both the content branch below and the action bar, which sits outside
   * this container (T2.7.7, D-A1/D-A3). Two inline expressions of the same
   * condition is how the bar comes to appear over an error card.
   *
   * It carries **all three** guards, not only the presence of data. `products`
   * alone would be correct today — a new id set is a new query key with nothing
   * cached, so `isError` and `products` cannot co-occur — but the change that
   * breaks that is already anticipated: adding `keepPreviousData` to
   * `useCompareProducts` (the obvious remedy for the skeleton flash a removal
   * causes, and what `useProducts` already does) would make an errored refetch
   * keep its previous data, and the bar would render over the error card.
   *
   * The decision carries its **evidence**, not just its verdict (T2.7.8a §4).
   * `Boolean(products)` was correct at runtime and invisible to the compiler:
   * a boolean narrows nothing, so the render sites below saw
   * `ProductDetails[] | undefined` and the build failed. Binding the data
   * itself keeps one derivation — D-A3 unchanged — and lets `!comparison ? …`
   * narrow it, with no cast, no `!`, and no `?? []` to erase the guard.
   * Runtime behaviour is identical, including the empty-array edge:
   * `Boolean([])` and `[] ? … : null` are both truthy.
   */
  /**
   * Which columns the entered amount cannot actually open.
   *
   * A comparison, not a calculation — the figures stay correct for the amount
   * entered, and this only says the deposit could not be taken out. Derived
   * here because the views decide nothing (I3), and passed down as ids so both
   * presentations flag the same columns from the same source.
   */
  const belowMinimumIds = (products ?? [])
    .filter((product) => amount < product.minInvestment)
    .map((product) => product.id);

  const comparison = ids.length > 0 && !isError && products ? products : null;
  const hasComparison = comparison !== null;

  /*
    A product removed from the comparison cannot remain the one being booked.
    Derived rather than cleared in an effect: an effect would leave one render
    in which the action bar pointed at a column that is no longer on screen.
  */
  const bookableProductId =
    selectedProductId !== null && ids.includes(selectedProductId) ? selectedProductId : null;

  return (
    <div className="flex flex-col gap-12 py-10 md:gap-14 md:py-16">
      <div className="container-page flex flex-col gap-10">
        <Link
          href={ROUTES.home}
          className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to Marketplace
        </Link>

        {/*
          The approved mobile title drops the trailing word: "Comparing 3 of 4".
          Shortened inside the single `h1` rather than by rendering a second
          heading in the card — a heading per presentation would break both the
          "exactly one h1" assertion and heading order. Same technique as M2.6's
          trust badges and action-bar labels.
        */}
        {/*
          The trigger sits here, outside both `data-compare-view` containers,
          and the dialog is portalled — so there is exactly one trigger and one
          dialog at every breakpoint, with nothing to disambiguate.
        */}
        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6">
          <h1 className="text-heading-lg text-content font-semibold">
            Comparing {columnCount} of {selection.max}
            <span className="hidden md:inline"> Products</span>
          </h1>

          <Button variant="secondary" onClick={() => setPickerOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Add
            <span className="hidden md:inline">&nbsp;another FD</span>
          </Button>
        </div>

        {/*
          Above the results and outside both `data-compare-view` containers, so
          there is exactly one set of preferences at every breakpoint and the
          desktop table and the mobile cards are fed by the same values — the
          brief's requirement that both always display the same calculated data
          is structural here rather than something to keep in step.

          It renders beside an empty selection too. The section describes how the
          comparison would be calculated, and hiding it would make the controls
          appear and disappear as columns come and go.
        */}
        <InvestmentPreferences
          description="Interest rate, interest earned and maturity value are calculated on this amount."
          action={
            /*
              The apply step (refinement, 2026-08-02). The section owns the
              draft and the action; the screen owns what applying *means* — it
              is the only thing here that knows the applied amount re-keys the
              batch and re-prices every column.

              `formatCurrency` rather than the raw figure, because the message
              has to be recognisable as the number in the table below it.
            */
            <PreferenceApplyBar
              pending={hasPendingChanges}
              canApply={canApply}
              pendingLabel="Changes not applied"
              settledLabel={`Comparing at ${formatCurrency(amount)}`}
              actionLabel="Update Comparison"
              onApply={handleApply}
            />
          }
        >
          <CompareAmountField
            inputRef={amountFieldRef}
            value={depositAmountInput}
            error={depositAmountError}
            onChange={setDepositAmount}
            onSubmit={applyPreferences}
            onRevert={resetDraft}
          />
        </InvestmentPreferences>

        {ids.length === 0 ? (
          <CompareEmptyState />
        ) : isError ? (
          <div className="border-border-default bg-surface-card rounded-card flex flex-col items-start gap-4 border p-8">
            <div className="flex flex-col gap-1">
              <p className="text-body text-content font-medium">Unable to load this comparison</p>
              <p className="text-body text-content-muted">
                Something went wrong while fetching these products. Please try again.
              </p>
            </div>
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : !comparison ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading comparison…</span>
            <div className="flex gap-6">
              {Array.from({ length: columnCount }, (_, index) => (
                <Skeleton key={index} className="h-28 flex-1" />
              ))}
            </div>
          </div>
        ) : (
          /*
            Both presentations render; CSS decides which is displayed
            (contract §2, approach A). `display: none` removes the hidden one
            from the accessibility tree and from hit-testing, so only one is
            ever exposed — and unlike a `matchMedia` switch, the server and the
            client render the same tree, so there is no hydration surface.

            `data-compare-view` exists so every verification selector can be
            scoped to one presentation: jsdom applies no media queries, so both
            trees are visible to the harness and an unscoped selector would bind
            to whichever came first.
          */
          /*
            One wrapper around both presentations, so the refresh transition is
            declared once and desktop and mobile fade in step (refinement,
            2026-08-02). Two wrappers would be two chances for the timings to
            drift apart, and the brief asks for exactly the opposite.

            **Opacity only, and no remount.** While the applied amount's batch is
            in flight the previous figures stay on screen, dimmed; when it lands
            they return to full strength in `--ds-duration-base` (200ms, inside
            the brief's 150–250ms window) on the platform's easing token. A
            keyed remount would fade the *old* numbers in at the moment of the
            click — the key changes with the amount, not with the data — and
            re-running the whole table's mount animation on a value change is
            more movement than the interaction deserves.

            `aria-busy` rather than a live announcement: the apply bar above
            already announces the change in words, and a busy table is a state,
            not news. The global reduced-motion rule collapses the transition.
          */
          <div
            aria-busy={isFetching || undefined}
            data-comparison-updating={isFetching ? 'true' : undefined}
            className={cn('duration-base transition-opacity ease-out', isFetching && 'opacity-70')}
          >
            <div data-compare-view="desktop" className="hidden md:block">
              <CompareTable
                products={comparison}
                rows={rows}
                onRemove={removeId}
                belowMinimumIds={belowMinimumIds}
                selectedProductId={bookableProductId}
                onSelect={setSelectedProductId}
              />
            </div>
            <div data-compare-view="mobile" className="md:hidden">
              <CompareCards
                products={comparison}
                rows={rows}
                onRemove={removeId}
                belowMinimumIds={belowMinimumIds}
                selectedProductId={bookableProductId}
                onSelect={setSelectedProductId}
              />
            </div>
          </div>
        )}

        <ComparePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          items={catalogue.data?.items ?? []}
          isLoading={catalogue.isPending}
          isFull={isFull}
          max={selection.max}
          isSelected={isSelected}
          isAddPending={pendingAddId !== null}
          onAdd={handleAdd}
          page={pickerPage}
          totalPages={catalogue.data?.meta.totalPages ?? 1}
          onPageChange={setPickerPage}
        />
      </div>

      {/*
        Page-level, a sibling of the reading container rather than a child of
        it: the bar spans the full page width and carries its own
        `container-page`, exactly as `DetailActionBar` does on the details
        screen (D-A7). Nesting one container inside another would re-apply the
        gutter and inset the bar from the table above it.

        It therefore also sits outside both `data-compare-view` containers, so
        there is exactly one of it at every breakpoint (D-A1) — and it renders
        only beside a comparison (D-A3), from the same derived value the content
        branch uses.
      */}
      {/*
        Comparison's handoff into Booking. It builds `ROUTES.bookingOverview` —
        the same entry point Product Details and Goal-Based FD use — so the two
        documented entry paths converge on one canonical route. Nothing about
        Booking changes because the user arrived from here.
      */}
      {hasComparison ? (
        <CompareActionBar
          bookingHref={
            bookableProductId === null
              ? undefined
              : /*
                  The **applied** amount, never the draft — the figure every
                  column on screen was priced against, which is what the
                  customer is choosing between. Reading `depositAmountInput`
                  here would hand Booking text the user had not confirmed.
                */
                ROUTES.bookingOverview(bookableProductId, amount)
          }
        />
      ) : null}
    </div>
  );
}
