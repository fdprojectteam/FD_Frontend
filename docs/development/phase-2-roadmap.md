# Phase 2 — Marketplace Module: Implementation Roadmap

Project: FD Investment Platform
Status: **In progress** — M2.1–M2.6 complete and signed off; **M2.7 in progress** (T2.7.0 done).
Last Updated: 2026-07-31 (T2.7.0)

Prerequisites complete: Component Library (T1.1–T1.12), Public Layout Shell (T1.13), Data Layer Foundation (T1.14).
Sources: approved UI images (`docs/features/marketplace/ui/`), approved analysis (User Flow, Screen Inventory, IA), engineering Documents 01–16.

---

## 0. Verified business rule (derived from the approved UI, not assumed)

Every maturity figure in the approved screens matches **quarterly compounding** exactly:

| Product | Rate / Tenure | Quarterly | Simple | Approved UI |
|---|---|---|---|---|
| IDFC FIRST | 7.75% / 12m | ₹1,07,978 | 1,07,750 | **₹1,07,978** ✅ |
| HDFC | 7.25% / 12m | ₹1,07,450 | 1,07,250 | **₹1,07,450** ✅ |
| Kotak | 7.4% / 24m | ₹1,15,795 | 1,14,800 | **₹1,15,795** ✅ |
| SBI | 7.1% / 12m | ₹1,07,291 | 1,07,100 | **₹1,07,291** ✅ |
| ICICI | 6.95% / 18m | ₹1,10,888 | 1,10,425 | **₹1,10,888** ✅ |
| Axis | 6.8% / 9m | ₹1,05,187 | 1,05,100 | **₹1,05,187** ✅ |

**Formula:** `maturity = principal × (1 + rate/4)^(4 × years)`, rounded to the nearest rupee. This becomes the single calculation utility, unit-tested against these six approved cases.

---

## 1. Milestones

### M2.1 — Marketplace Domain Foundation *(no UI)*

**Purpose.** Establish the domain, transport, and mock API so every later screen consumes real (mocked) data from day one — never hardcoded arrays that must be torn out later.
**Deliverables.** Domain types; `ProductRepository` + `BankRepository` interfaces and API implementations; `ProductService` / `BankService`; maturity + currency utilities (with the §0 formula); MSW handlers implementing the Document 10 contract (pagination, search, filters, sort, 404, 422, 500); deterministic factories generating **24 products across 6+ banks** (matching "Showing 1–6 of 24"); query keys and feature hooks.
**Files.** `modules/marketplace/{types,constants,utils,repositories,services,hooks}/*`; `mocks/data/{products,banks}.ts`; `mocks/handlers/{products,banks}.ts` + registry; `constants/routes.ts` (product route typing).
**Dependencies.** T1.14 only.
**Verification.** Handler-level assertions (pagination arithmetic, filter combinations, sort ordering, error codes); maturity utility unit-checked against the six approved figures; boundary probes (no component imports mocks); gates.

### M2.2 — Marketplace Business Components

**Purpose.** Build the reusable fintech components the screens compose, from the frozen library.
**Deliverables.** `FDProductCard`, `InterestRateDisplay`, `BankBadge`, `TrustIndicator`, `AmountDisplay`, `BenefitChipList`, `CategoryCard`. Each token-only, composed from Button/Card/Badge/Chip, and added to `/gallery`.
**Files.** `components/business/*` (cross-module) and `modules/marketplace/components/*` (module-only).
**Dependencies.** M2.1 (types).
**Verification.** Gallery review against approved card design; a11y (card is not a link — actions are); zero new primitives; gates.

### M2.3 — Marketplace Home (hero, search bar, recommendations, featured banks, trust strip)

**Purpose.** The entry screen and the reference composition of shell + business components.
**Deliverables.** Hero with highest-rate spotlight (data-driven), search bar (query/amount/tenure), "Recommended for you" category row, featured banks strip, trust strip, footer already from shell.
**Files.** `app/(public)/page.tsx`, `modules/marketplace/components/{hero,search-bar,recommended-row,featured-banks,trust-strip}`.
**Dependencies.** M2.1, M2.2.
**Verification.** Pixel review vs approved home (desktop + mobile); SSR renders content; a11y (labelled search controls); gates.

### M2.4 — Product Listing + Pagination + Sort — **Complete**

**Purpose.** The core discovery surface with URL-driven state.
**Deliverables.** Responsive product grid (6/page), result count line, sort control, Pagination wired to `?page=`, focus + scroll behaviour on page change.
**Files delivered.** `components/product-grid.tsx`, `product-grid-skeleton.tsx`, `product-grid-section.tsx`, `result-count.tsx`, `sort-control.tsx`; `hooks/use-marketplace-url-state.ts` (single URL writer); `use-marketplace-search-params.ts` reduced to a selector; `use-products.ts` gains `keepPreviousData`; `home-screen.tsx` wiring; `home-hero.tsx` CTA activated.
**Dependencies.** M2.1–M2.3.
**Verification performed.** 22 URL-state assertions (parse, validation fallback, canonicalisation, exactly-one-`replace`); MSW pagination proof (24 products / 6 per page / 4 pages, disjoint pages, all sort fields and both orders); SSR markup assertions (landmark, labelling, focusability, anchor, combobox); five boundary probes re-proved; four gates green.
**Carried.** Client-side interaction pass (pagination clicks, sort dropdown, `keepPreviousData` visual) — requires a browser, see §Carried items.

### M2.5 — Search & Filters

**Purpose.** Narrowing, per approved UI (chips: Bank, Tenure, Interest Rate, Amount) and User Flow Step 3.
**Deliverables.** Debounced search bound to `?q=`; filter chips with selected state; active-filter clearing; result count updates; "no results" empty state with clear-filters action (User Flow alternate path).
**Files.** `modules/marketplace/components/{filter-bar,active-filters}.tsx`, `hooks/use-marketplace-filters.ts`.
**Dependencies.** M2.4.
**Verification.** Filters are combinable and URL-encoded; back/forward restores state; debounce verified; empty state reachable; gates.

### M2.6 — Product Details

**Purpose.** Complete transparency before investing (User Flow Step 4).
**Deliverables.** Route `/marketplace/[productId]`; product header + trust badges; key-information grid; **investment calculator** (RHF + Zod, using the §0 formula); benefits; eligibility; Interest breakdown / FAQs / T&C accordions; sticky action bar (Add to Compare, Continue to Booking).
**Files.** `app/(public)/marketplace/[productId]/page.tsx`, `modules/marketplace/components/{product-header,key-info,calculator,product-accordions,detail-actions}`.
**Dependencies.** M2.1, M2.2.
**Verification.** Calculator matches approved figures; 404 for unknown id; form a11y (labels, errors, aria-describedby); gates.

### M2.7 — Comparison

**Purpose.** Side-by-side decision support (User Flow Step 5), max 4 products.
**Deliverables.** Route `/compare`; compare selection model; comparison table (rate, tenure, min investment, interest earned, maturity, benefits, eligibility) with **best-value highlighting per row**; remove column; "Add another FD" via the approved Dialog; Proceed to Booking.
**Files.** `app/(public)/compare/page.tsx`, `modules/marketplace/components/{compare-table,compare-picker}`, `hooks/use-compare.ts`.
**Dependencies.** M2.4 (selection begins on cards), M2.6.
**Verification.** Selection persists across screens; cap of 4 enforced with feedback; comparison deep-linkable; table a11y (headers, scope); gates.

**Amended in T2.7.0** — three corrections from reading the approved screens and the code that already exists. The purpose and deliverables above stand; the detail does not.

*Mobile is not a table.* The approved mobile screen is a **one-card-at-a-time carousel** with ‹ › arrows and dot indicators. Desktop and mobile are two presentations of the same data, not one layout reflowing. Built with CSS scroll-snap and existing `Button`s (decision D1) — no new design-system primitive.

*The selection model already exists.* It was built in T2.6.7 as `CompareSelectionProvider`, so M2.7 consumes it rather than defining it. `hooks/use-compare.ts` above is superseded: the selection hook is `hooks/use-compare-selection.tsx` (shipped), and M2.7 adds `hooks/use-compare-url-state.ts` for the `?ids=` projection only.

*Corrected file list.*

| Area | Files |
|---|---|
| Route | `app/(public)/compare/page.tsx` — **with a Suspense boundary**, unlike the details route, because it reads `useSearchParams` (M2.4 defect C2) |
| Components | `compare-screen` · `compare-table` · `compare-column-header` · `compare-cards` · `compare-picker` · `compare-action-bar` · `compare-empty-state` |
| Pure modules | `utils/compare-rows.ts` (`buildCompareRows` — row order, formatting, winners) · `utils/compare-url.ts` (parse/serialise ids) |
| Hooks | `hooks/use-compare-url-state.ts` (new) · `use-compare-selection` and `use-compare-products` (reused unchanged) |
| Docs | `engineering/marketplace-compare-state.md` (new, T2.7.0) · `engineering/marketplace-url-state.md` (amended) |

*Two details in the approved desktop screen that the summary above flattens.* **Tenure has no winner** — neither shorter nor longer is universally better, so it is deliberately unhighlighted while every other numeric row is. And **Minimum Investment is a tie** (HDFC and IDFC both ₹10,000) with only the **leftmost** column marked, which is why `CompareRow.bestIndex` is a single nullable index rather than a set.

*Added verification.* Zero URL writes on cold load (decision D2); exactly **two** URL writers module-wide, one per route, sharing one merge-and-serialise shape; `buildCompareRows` has a single call site; no component recomputes a maturity figure.

Full plan: `m2.7-implementation-plan.md`. UI contract: `m2.7-ui-fidelity-checklist.md`.

### M2.8 — Cross-screen States (loading / empty / error)

**Purpose.** States are built *with* each screen; this milestone is the consolidation and edge-case pass, not a retrofit.
**Deliverables.** Skeletons matching each layout (card skeleton reference from T1.11); empty states (no results, no comparison); error states with retry; slow-network and 500 scenarios exercised through MSW fixtures.
**Files.** `components/feedback/*`, per-screen `loading.tsx` / `error.tsx` where App Router conventions apply.
**Dependencies.** M2.3–M2.7.
**Verification.** Each screen demonstrably renders all four states; no layout shift on swap; announcements via `role="status"`; gates.

### M2.9 — Final Marketplace Audit

**Purpose.** Same rigour as T0.11 / T1.12.
**Deliverables.** Audit document: screen-by-screen conformance to approved UI, a11y counts, token compliance, boundary compliance, performance sanity (bundle, no waterfalls), residual risks, Phase 3 handover notes.
**Verification.** All gates; full static audit; browser pass list for you.

---

## 2. Recommended order & justification

**M2.1 → M2.2 → M2.3 → M2.4 → M2.5 → M2.6 → M2.7 → M2.8 → M2.9.**

Data before UI (screens consume mocked APIs immediately — no throwaway fixtures). Shared components before screens (the card is used by Home, listing, and compare picker; building it once prevents divergence). Listing before filters (filters mutate an existing list; building them together doubles the debugging surface). Details before comparison (comparison reuses detail-level fields and the calculator utility; it is also the only screen that depends on a *selection* built during listing). States distributed across screens with a consolidation pass, because retrofitting loading states is how layout shift gets shipped. Audit last, mirroring the two audits you've already approved.

## 3. Domain model (to define in M2.1, not now)

`Bank` (id, name, shortCode, logo, rating) · `Product` (id, bankId, name, type, rate, tenureMonths, minInvestment, interestType, payout, benefits[], eligibility, categories[], flags) · `RateSlab` (tenure range → rate, seniorCitizenBonus) · `Tenure` (months + display) · `PayoutType` (`at-maturity | monthly | quarterly`) · `Benefit` (senior bonus, auto-renewal, loan against FD, premium support) · `Eligibility` · `TrustIndicator` (RBI regulated, DICGC insured ₹5L, AAA rating) · `ProductCategory` (highest-rate, senior-citizen, tax-saving, short-term, high-returns) · `ProductFilters` · `SortOption` · `MaturityCalculation` (principal, interestEarned, maturityValue) · `CompareSelection`.

## 4. Repository plan

`ProductRepository` (M2.1) — `list(params)`, `getById(id)`, `listByIds(ids)` for comparison. `BankRepository` (M2.1) — `list()` for the featured strip and bank filter. Both are interfaces in `modules/marketplace/repositories/`, implemented by `createApiReadRepository` from T1.14 plus resource-specific methods. No other repositories in Phase 2.

## 5. MSW plan

**Factories (M2.1):** deterministic, seeded generators producing 24 products across 6+ real Indian banks with the exact rates seen in the approved UI, so screenshots and implementation agree. **Handlers:** `GET /api/v1/products` (page, limit, q, bank, tenure, minRate, amount, sort, order — all combinable, computed server-side in the handler), `GET /api/v1/products/:id`, `GET /api/v1/banks`. **Fixtures:** empty-result, 404, 422 (invalid amount), 500, and slow-response variants selectable for state testing. **Registry:** composed into the existing empty `handlers` array — the T1.14 bootstrap never changes.

## 6. React Query plan

Keys namespaced per domain: `['products','list',filters]` · `['products','detail',id]` · `['products','compare',ids]` · `['banks','list']` · `['products','recommended']`. Defaults from T1.14 apply (60s stale, no 4xx retry). Detail pages render immediately from list data where available, and revalidate in the background, to avoid a visible refetch. **Amended in M2.6 (decision D1 = A′):** this is achieved by *reading* the existing `['products','list',filters]` caches for the summary — not by *writing* a primed `['products','detail',id]` entry, which stored a `ProductSummary` under a key typed `ProductDetails` and left five fields undefined for one paint (M2.4 risk R3). The behaviour is unchanged; the mechanism is a read, and no cache entry is written with a value that does not match its key's type. No mutations in Phase 2 (booking is Phase 3).

## 7. Screen-by-screen order

1. **Marketplace Home** (M2.3) — hero, search, recommendations, featured banks, trust strip.
2. **Product listing + search results** (M2.4–M2.5) — see risk R1: the approved UI renders results *inline on Home* with URL state, so "Search Results" is the same screen in a filtered state, not a separate route.
3. **Product Details** (M2.6).
4. **Comparison** (M2.7).
5. **State variants across all four** (M2.8).

## 8. Definition of Done

**Per milestone:** matches approved UI (desktop + mobile); token-only styling, zero arbitrary values; composed from the frozen library — no new primitives; WCAG 2.2 AA (landmarks, labels, focus, keyboard, announcements); loading/empty/error states present; URL state deep-linkable where applicable; no business logic in components (hooks/services own it); boundary rules pass; `build`/`lint`/`typecheck`/`format` green; verification report delivered.

**Phase 2 overall:** the three approved screens implemented exactly; the full User Flow (Steps 1–7) traversable end-to-end against MSW, terminating at the Booking hand-off point; every list paginated/filterable/sortable through the API contract; the maturity calculation matching all six approved figures; a passing final audit; no unapproved architecture, tokens, or components introduced.

## 9. Risks & future integration points

**R1 — "Search Results" as a separate screen (documentation vs approved UI).** The Screen Inventory lists it as Screen 2, but the approved UI shows results inline on Home. Recommendation: implement as Home with URL query state (deep-linkable, matches the approved design, which is the ruling source of truth). **Needs your confirmation.**

**R2 — Compare selection state ownership.** Options: URL as source of truth (`/compare?ids=…`, shareable, SSR-friendly) with a module store for in-progress selection on listing pages. Recommended; **needs approval** as it is an architecture decision.

**R3 — Booking hand-off.** "Continue to Booking" / "Proceed to Booking" have no destination until Phase 3. Recommendation: reuse the approved T1.13 pattern (visually identical, `aria-disabled`, no href) or a documented no-op, until the Booking route exists. **Needs your ruling.** Integration point: Booking consumes `{ productId, amount, tenure }` — the calculator already produces exactly this shape, so no rewrite.

**R4 — Typed dynamic routes.** `ROUTES.product(id)` returns a template string; typedRoutes requires `Route` typing (same fix as the nav config in T1.13). Handled in M2.1, flagged so it isn't discovered mid-screen.

**R5 — Money formatting.** Indian grouping (₹1,07,978) via `Intl.NumberFormat('en-IN')`, centralised in one utility; rounding rule fixed by §0. Risk is divergence if formatting is inlined per component — prevented by a single utility plus lint review.

**R6 — Rate freshness / caching.** 60s stale time is right for a POC; a production rate feed may need shorter windows or revalidation. Isolated to the query layer — a one-line change later.

**Future phases integrate without rewrites because:** Booking and Portfolio consume the same `ProductRepository`/`ProductService` contracts and the shared calculation utility; Authentication fills the existing `setAuthTokenProvider` seat and the `(app)` route group with the sidebar shell (already reserved in T0.10/T1.13); real APIs replace MSW by flipping `NEXT_PUBLIC_ENABLE_MOCKS` with no UI change (roadmap §1.3); new product categories (mutual funds, bonds) add modules beside `marketplace` without touching it.

---

## Approval needed before M2.1 begins

**R1** (search results as inline URL state) · **R2** (compare state ownership) · **R3** (booking hand-off treatment). Everything else is derived from approved artefacts.
