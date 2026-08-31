# P0 product quality fixes — trust, responsiveness, financial clarity

**Date:** 30 August 2026
**Scope:** the three P0 blockers from the UX/product acceptance review. No redesign, no new features, no architecture change.

---

## 1. Root cause analysis

### Trust

Unsupported claims were not confined to one screen, and they were not all copy — several were carried by **presentation**, which is read before the words are.

| Where | Claim | Why it could not stand |
|---|---|---|
| `booking-overview.ts` assurances | "Bank Grade Security · 256-bit encryption", "100% Safe & Secure · RBI Regulated Platform", "24x7 Support · Always here to help" | No encryption implemented or audited; this platform is not RBI regulated; no support line is staffed. Three reassurances at the moment of commitment. |
| `booking-overview.ts` deposit | tagline "Secure • Trusted • Guaranteed Returns"; about "…100% secure and backed by the bank's strong financials and legacy of trust"; highlights "Guaranteed Returns", "Secure Investment", "RBI Regulated Partner Bank" | Guarantees, a security assertion, and a judgement about a bank's financials. |
| `trust-strip.tsx` (Home) | "RBI regulated — every partner bank is licensed and regulated by the RBI"; "bank-grade encryption"; "the rate you see is the rate you get, **always**"; "reach a **real person**" | No licence verified; no encryption; "always" is a guarantee about a rate card the platform does not control; no person is reachable. |
| `payment-screen.tsx` | "Secure Payment · All payments are encrypted and secure · **[256-bit SSL]**"; "Your money is safe with us · RBI regulated partners · Encrypted transactions · Our support team is here"; "refunded within 3-5 working days" | A cipher strength named as if configured, on a screen that **takes no payment** — and the same screen said so two paragraphs below. The page contradicted itself. |
| `bank-account-screen.tsx` | "Your Security is Our Priority · 256-bit SSL encryption for all transactions · Your bank details are secure and protected" | A standard nothing implements, plus an assurance with no mechanism. |
| `layout.tsx` | "India's most trusted banks" | Ranks banks by a trust nobody measured. |
| `trust-indicator.tsx` | RBI Regulated / ₹5L DICGC Insured / AAA Rating as **`success` badges with a shield-and-tick and a star** | The data is a static fixture and the whole set is attached to every product. The *styling* claimed verification the data cannot support. |
| `selected-fd-summary.tsx` | "Bank Rating" with a green `ShieldCheck` | A rating agency's opinion, marked as if this platform had checked it. |
| `products.ts` | "Deposits are insured up to ₹5,00,000 by DICGC." | A flat statement about *this* deposit at *this* bank, which the catalogue does not model. |

### Responsive

**Home at 320px — two independent causes.**

1. `SortControl` rendered `<Select className="w-48">` — a flat **192px that cannot shrink** — inside `SectionHeading`, a `flex … justify-between` row **with no wrapping**. The row's minimum width was therefore the "Fixed Deposits" heading + gap + 192px ≈ 340px, against the 288px a 320px viewport leaves after the 16px gutters. A flex row that cannot fit does not compress; it pushes the document wider.
2. The goal callout's "Goal + Amount + Timeline → FD options explained for your goal" row was `flex items-center` with **no `flex-wrap`**. Eight inline items ending in a six-word phrase far exceed ~272px. It was being clipped by the section's `overflow-hidden` rather than visibly breaking, which is why it survived.

**Goal Planner at 390px — one cause, and it is subtle.**

The recommendation alternatives were `<ul className="grid gap-4 md:grid-cols-2">` — **no base column template**. Below `md` the cards land in an *implicit* column sized by `grid-auto-columns: auto`, and an `auto` track's maximum is **`max-content`**, which it grows past its container to reach.

`CompactRecommendationCard` puts the product name in a `truncate` heading, and `truncate` is `white-space: nowrap` — whose max-content is the **whole untruncated string**. So "Suryoday Small Finance Bank Fixed Deposit" sized the track to roughly 420px inside a 358px column. That matches the review's measured ~422px almost exactly.

The `min-w-0` already on the card's inner div never helped: it bounds the *minimum*, and this was the *maximum*.

The same pattern was present in **twelve other places**, including the Home product grid, the recommended row, the search bar and the multi-goal legs.

### Goal Planner

Not a calculation bug. **Case C — multiple allocation concepts, only one of which survived the step boundary.**

`AmountStep` computes, for the emergency-fund goal only:

```ts
const suggestedAllocation = calculateEmergencyFundAmount(amount); // 10% of the total
const investedAmount = derivesAllocation ? allocation : amount;
onSubmit(investedAmount);   // ← the total is discarded here
```

The arithmetic is right and intentional: an emergency fund is sized as a share of the whole portfolio, and the step explains the split where it happens. What was wrong is that `PlannerAnswers` had only `principal`, so **the total was dropped on submit**. From that point on the trail said "Amount ₹10,000", the recommendation priced ₹10,000, and the booking carried ₹10,000 — with nothing anywhere on the page recording that ₹1,00,000 had been entered. A customer had no way to answer *"where did the rest go?"*

A second, quieter defect fell out of the same gap: reopening the Amount step seeded its **total** field with `principal`, so pressing Change would have turned ₹1,00,000 into ₹10,000 into ₹1,000.

---

## 2. Changes implemented

**New (2 files)**

- `src/components/business/data-provenance.tsx` — `DataProvenanceNote`, the platform's single statement of where figures come from. Used on Home (hero + foot), Product Details and Booking Overview, so four near-identical sentences became one.
- `src/modules/goal-based-fd/components/allocation-breakdown.tsx` — `AllocationBreakdown`, three rows: entered → into this deposit → not part of this plan.

**Trust**

- `booking-overview.ts` — assurances, tagline, about and highlights rewritten.
- `types/booking.ts` — `BookingAssuranceId` and `DepositHighlightId` re-declared; the removed ids are documented with why.
- `booking-assurance-strip.tsx`, `selected-fd-summary.tsx` — icon maps updated; shield/tick marks replaced with marks that classify rather than certify.
- `trust-strip.tsx` — four claims about the world replaced with four statements about the product's own behaviour, each checkable by using it.
- `trust-indicator.tsx` — `success` → `outline`; `ShieldCheck`/`Star` → `Landmark`/`Building2`/`TrendingUp`. Labels unchanged.
- `trust-badge-row.tsx` — provenance line directly beneath the badges, not in a tooltip.
- `payment-screen.tsx`, `bank-account-screen.tsx` — reassurance lists rewritten to what the steps genuinely do.
- `product-detail-screen.tsx`, `home-hero.tsx` — existing honest copy swapped for the shared component.
- `layout.tsx`, `products.ts` — metadata description; DICGC term aligned with `SafetyNote`.

**Responsive**

- `sort-control.tsx` — `w-48` → `w-full min-w-0 md:w-48`; wrapper `min-w-0 flex-1 md:flex-none`.
- `section-heading.tsx` — `flex-wrap` + `min-w-0` on the title.
- `goal-planner-callout.tsx` — the value row wraps.
- **13 grids** given an explicit base `grid-cols-1`: `planner-results`, `plan-results`, `success-screen`, `amount-step`, `goal-step`, `investor-step`, `multi-goal-planner-screen`, `plan-goal-row`, `featured-banks`, `home-hero`, `product-grid`, `product-grid-skeleton`, `recommended-row`, plus the three arbitrary-template grids in `goal-planner-screen`, `goal-planner-callout` and `search-bar`.

**Goal Planner**

- `use-planner-flow.ts` — `PlannerAnswers.totalAmount`; `setPrincipal(principal, totalAmount?)`. **`GoalInput` is unchanged** — the engine still receives `principal` and nothing else.
- `amount-step.tsx` — passes the total when the two differ.
- `planner-trail.tsx` — the amount row shows both figures and the rule relating them.
- `planner-results.tsx` — the breakdown renders immediately above the best-fit card.
- `goal-planner-screen.tsx` — reopening the Amount step seeds the **total**, fixing the compounding-shrink defect.

**Verification**

- `invariants.mjs` — a new section: every responsive grid must declare a base column template; the sort control carries no unconditional fixed width; the heading row wraps.
- `units.mjs` — the three figures reconcile exactly across six amounts (₹10k–₹10L).
- `journeys.mjs` — **G2**, driving the emergency-fund path through the real screens to the real recommendation.

---

## 3. Trust verification

One statement, three surfaces. `DataProvenanceNote` appears on Home, Product Details and Booking Overview; `SafetyNote` remains the single wording on deposit coverage and now sits beside it at booking. Neither names a regulator, insurer or certification, because the platform has checked with none.

A repository-wide re-search for every term in the brief returns **no live claim** — the only remaining hits are the comments recording what was removed.

**Intentionally preserved:**

- **The badge labels themselves** — "RBI Regulated", "₹5L DICGC Insured", "AAA Rating". These are catalogue data and useful when comparing deposits. The fix for unverified data is to stop implying verification, not to hide the data; they are now neutral outline badges with their source stated beneath them.
- **`SafetyNote`** and the Product Details "About these figures" section — both were already correct.
- **`/gallery`** — a design-system showcase whose Badge section uses "RBI Regulated" as *sample content* for demonstrating variants. It is a developer surface that describes itself as one; rewriting sample copy there would be churn.

---

## 4. Goal Planner money flow

Actual values from the implementation, asserted in `units.mjs` and driven end to end in journey **G2**:

| Step | Value | Source |
|---|---|---|
| Entered | **₹1,00,000** | what the customer typed |
| Into this fixed deposit | **₹10,000** | `calculateEmergencyFundAmount` — 10%, unchanged |
| Not part of this plan | **₹90,000** | `total − invested` |
| Recommendation priced on | **₹10,000** | `GoalInput.principal` |
| Booking handoff carries | **₹10,000** | `toBookingHandoff` → `bookingOverview(productId, principal)` |

Shown at the Amount step, in the trail, and again above the recommendation.

⚠ **The engine's semantics are not the review's example.** The review assumed reserve ₹10,000 → *invest* ₹90,000. This engine does the opposite: the emergency-fund **deposit is the ₹10,000**, and the ₹90,000 remains for the customer's other goals — exactly as the multi-goal planner applies the same rule. The UI states what the engine does. Calling the remainder "available to invest" would have invited the customer to expect a ₹90,000 deposit.

Every other goal invests the amount typed; no second figure appears.

---

## 5. Responsive validation

⚠ **These are static-analysis results, not measured ones.** This environment has no headless browser — the Playwright Chromium download is blocked by the network allowlist, and the repository has never had a browser-based visual suite (its overflow rules are enforced as source invariants). **I could not measure `scrollWidth` against viewport width at any breakpoint, and I am not going to report a PASS I did not observe.**

What *was* done: both root causes were traced to specific CSS, fixed at the cause, and locked with a source invariant that now scans every grid in the repository. The invariant was verified to actually fail — its first version matched `md:grid-cols-2` as its own base template and passed vacuously; corrected, it caught three further real offenders on the two flagged screens.

| Width | Result | Basis |
|---|---|---|
| 320px | Fixed at cause — **not measured** | `w-48` removed; heading row wraps; callout row wraps; all grids bounded |
| 375px | Fixed at cause — **not measured** | same |
| 390px | Fixed at cause — **not measured** | alternatives grid bounded by `minmax(0,1fr)` |
| 430px | Fixed at cause — **not measured** | same |
| 768px | Unchanged — **not measured** | first breakpoint; approved layouts untouched |
| 820px | Unchanged — **not measured** | same |
| 900px | Unchanged — **not measured** | same |
| 1024px | Unchanged — **not measured** | same |
| 1280px | Unchanged — **not measured** | same |
| 1440px | Unchanged — **not measured** | same |

Every change is either a base column template (no effect at or above `md`, where an explicit template already applied) or a width that becomes fixed again from `md`. The approved desktop appearance is unchanged by construction.

**This is the one item I would not sign off without a browser.** Opening the app at 320px and 390px and checking `document.documentElement.scrollWidth` is a two-minute check on any machine with a browser, and it should be done before this is called closed.

---

## 6. Technical validation

Actual exit codes.

| Command | Exit | Result |
|---|---|---|
| `tsc --noEmit` | **0** | PASS |
| `eslint --max-warnings 0 src verification` | **0** | PASS |
| `next build` | **0** | PASS — compiled in 8.2s, all 40 routes emitted |
| `verify unit` | **0** | PASS — 2138 passed, 0 failed |
| `verify invariants` | **0** | PASS — 1177 passed, 0 failed |
| `verify boundaries` | **0** | PASS — 15 passed, 0 failed |
| `verify journeys` | **0** | PASS — 615 passed, 0 failed |
| `prettier --check src verification` | **0** | PASS |

**Where they ran.** ESLint, `next build` and Prettier exceed the tool time limit against the mounted working copy (ESLint alone is killed at 170s with no output). They were run against a copy of `src/` and `verification/` verified byte-identical with `diff -r`, with the same `eslint.config.mjs`, `prettier.config.mjs`, `package.json` and `.env.local`, and dependencies installed from the same `package-lock.json`. The exit codes are real; the working directory was a mirror, and that is stated rather than glossed.

---

## 7. Regression check

All four suites pass, and their journeys cover each surface below in a real DOM.

| Area | Status |
|---|---|
| Home | PASS — J0–J10 |
| Marketplace | PASS — listing, filters, sort, pagination, URL state |
| Product Details | PASS — invariants + provenance section |
| Comparison | PASS — L0–L10 |
| Goal Planner | PASS — G1, and **G2 new** |
| Multi-Goal Planner | PASS — units + invariants |
| Booking | PASS — P1 (three banks), overview fixture types |
| Portfolio | PASS — R1, N1 |
| Tax | PASS — T1 |
| Family | PASS — F1 |
| Bank Accounts | PASS — B1 |
| Support | PASS — S1 |
| Admin | PASS — A1 |

Nothing in the booking flow, sessionStorage behaviour, comparison logic, portfolio/tax/family calculations or the recommendation engine was modified. The one type change (`BookingAssuranceId`, `DepositHighlightId`) is presentational and fully propagated.

---

## 8. Remaining P1 issues — listed, not implemented

1. **The Stepper's `onStepClick` is accepted and dropped.** `GoalPlannerScreen` passes a handler; the rail renders text, not controls, so nothing calls it. Making it interactive is a UI change and needs real buttons with 44px targets.
2. **No browser-based responsive verification.** The repository has no headless browser, so overflow is enforced only by source invariants. §5 above is the direct consequence.
3. **Family dashboard redesign** — carried over from the review.
4. **Portfolio personalisation** — carried over.
5. **The DBS tax saver's ₹1,50,000 limit and 5-year lock-in are not enforced.** The product model has no `maxInvestment` or lock-in concept; adding one for a single product would be a business rule invented in a fixture.
6. **`buildProductDetails` attaches the same three trust indicators to every product**, including "AAA Rating" gated only on `bank.rating`. Real per-bank data should replace the fixture before any of this is presented as fact.
7. **Advanced tax functionality**, new dashboard modules, additional animations — all deferred.
