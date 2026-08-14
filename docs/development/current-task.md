# Current Task

## Phase

Phase 3 — Booking Module (**in progress**) · Phase 2 — Marketplace (complete)

---

## T3.2 — Investment Details (current)

Plan and decisions: [`t3.2-plan.md`](./t3.2-plan.md). **Priority 1 is now the
Founder Discussion Note** (`docs/engineering/00_Founder_Vision.md`); the plan's
§0 records the re-verification against it.

| Task | Status |
|---|---|
| T3.2.0 documentation — plan amended against the Founder Note | ✅ |
| T3.2.1 phase model — four shown, eight routed | ✅ |
| T3.2.2 booking draft contract — context + sessionStorage | ✅ |
| T3.2.3 `Slider` + `RadioCardGroup` platform primitives | ✅ |
| T3.2.4 `@/utils/maturity.ts` platform engine + TD-001 cross-impl assertion | ✅ |
| T3.2.4b tenure→rate domain model (`tenureRates`, `resolveTenureRate`) | ✅ |
| T3.2.5 `utils/returns.ts` — cumulative vs non-cumulative + tax seam | ✅ |
| T3.2.6 `utils/investment-schema.ts` + plain-English messages | ✅ |
| Domain test suite — six areas, written before any UI | ✅ **+122 assertions** |
| T3.2.7 route + `InvestmentDetailsScreen` shell + configured right rail | ✅ |
| T3.2.8 amount field + quick amounts + `EstimatedReturns` | ✅ (C3a/C3b confirmed) |
| T3.2.9 `PayoutOptionGroup` | ✅ |
| T3.2.10 `TenureSelector` | ✅ **chips only** — slider and Custom deliberately unbuilt |
| T3.2.11 `resolveTenureRate` + `tenureRates` on terms | logic buildable, data absent |
| T3.2.12 navigation + validation seam + audit | after the above |

### T3.3 — Nominee (Screen 3)

| Task | Status |
|---|---|
| T3.3.1 domain — types, draft slice, constants, Zod validation | ✅ |
| T3.3.2 screen shell — route, chrome, reused right rail | ✅ |
| T3.3.3 nominee form — fields, add/remove | ✅ |
| T3.3.4 nomination type cards | ✅ |
| T3.3.5 validation wiring + Continue gating | ✅ |

**⚠ `SUPPORTED_RELATIONSHIPS` is a POC assumption, not client data.** Eight
conventional Indian FD nomination values supplied 2026-08-06 while the client
was unavailable. It is the single source of truth — replacing the array changes
the dropdown, the validation and the error message together, and an invariant
asserts no component declares its own. Note "Wife" from the artwork is **not**
in the list; "Spouse" covers it without assuming gender.

**Nominee PII is never persisted.** `PersistedBookingDraft` is
`Omit<BookingDraft, 'nominee'>`, so persisting it is a compile error, not a
convention. A refresh clears entered nominee details — a deliberate narrowing of
FR-SYS-002 for this step, per the draft contract written at T3.2.2. Widening it
is a compliance decision.

**Route:** `/booking/<productId>/nominee`

---

## RateQuote — rate resolution carries provenance ✅

`resolveTenureRate(terms, tenure) → number | null` is now
`resolveRate(terms, criteria) → RateQuote | null`.

**`RateQuote` holds two fields — `annualRate` and `tenureMonths` — and nothing
else.** `bandId`, `effectiveFrom`, `dayCountBasis` and `compoundingFrequency`
were in the architect's proposal but have **no source in this repository**;
synthesising them would defeat the audit purpose they exist for. They are added
when the data arrives, which is what this shape makes cheap.

**`RateCriteria` is the extension point.** Amount slabs, senior-citizen and
payout-specific pricing each become an optional field — no new function, no
changed signature, no touched caller. This is what Goal-Based FD needs to
compose rate-by-tenure with rate-by-amount.

**Behaviour is byte-identical.** `ReturnsResult.annualRate` stays flat, so the
returns strip and the summary rail were not touched. 4 production files: the
type, the resolver, and its 2 callers.

---

## Booking journey — one resolved product per session ✅

`productId` → `booking/[productId]/layout.tsx` resolves **once** →
`BookingProductProvider` → Overview, Investment Details and Nominee all read
`useBookingProduct()`. No screen resolves, none has a fixture fallback, and the
`overview` prop that allowed divergence is gone from all three — so the steps
**cannot** disagree about which deposit is being booked.

An unresolvable id takes `booking/not-found.tsx` before any screen renders. The
boundary sits **above** `[productId]` because a layout's `notFound()` is caught
by the parent segment, not its own.

`src/app/(public)/booking/[productId]/not-found.tsx` is now a one-line re-export
and **safe to delete** — this environment cannot remove files.

---

## Booking → Product handoff (productId-driven resolution) ✅

The Overview screen accepted a `productId` and ignored it, rendering one
hardcoded deposit for every booking URL. It now resolves through
`resolveBookingOverview(productId)`; an unresolvable id takes the new
`booking/[productId]/not-found.tsx` boundary rather than rendering a deposit the
user did not choose.

**⚠ Two data defects surfaced, not fixed** — both need client product data:

1. **The id collides.** `fd-002` in the Marketplace catalogue is **HDFC, 7.25%,
   12 months, ₹10,000 min**. The approved Booking artwork is **Axis, 24 months,
   ₹5,00,000 min**. The Axis catalogue product is `fd-006` (6.8%, 9 months).
2. **No Marketplace product matches the approved Booking screen** — no product
   has a ₹5,00,000 minimum (`MIN_CYCLE` tops out at ₹50,000).

So Booking currently resolves **one** product. Wiring it to the Marketplace
catalogue would change every figure on the approved screens, which is a product
decision rather than a refactor.

**Re-baselined 2026-08-06** — decisions on C1–C8 received and applied. Roadmap,
resequencing, the C8 convergence plan (TD-001 / R1) and eight Founder-Vision
risks are in [`t3.2-rebaseline.md`](./t3.2-rebaseline.md), which supersedes the
sequencing in `t3.2-plan.md` §6.

Sequence is now **engine → model → validation → shell → controls**, so no
control is built before the calculation it displays. The tenure selector moved
to the end so the one data-blocked task stalls nothing behind it.

### ⏸ Review gate — T3.2.4 → T3.2.6 complete, stop before visible UI

The domain layer is done and proven. **No UI was written.**

| Module | Owns |
|---|---|
| `@/utils/maturity.ts` | compounding + simple interest — the platform engine |
| `@/types/finance.ts` | `MaturityInput` · `MaturityResult` · `TenureRate` |
| `booking/utils/tenure-rates.ts` | rate card resolution; **`null` for unpriced tenures** |
| `booking/utils/returns.ts` | cumulative vs payout, instalments, tax seam |
| `booking/utils/investment-schema.ts` | BR-INV-001/002/003, tenure, payout, plain-English copy |

**The three rules the layer enforces, each covered by assertions:**

- **No invented rates (C1)** — `resolveTenureRate` returns `null` for a tenure
  the product does not price. It does **not** fall back to the headline rate.
  The fixture carries exactly one entry, `{ 24 months, 7.25% }`, because that is
  the only pair the product publishes
- **Never compounded maturity for a payout product (C4)** — asserted for all
  four non-cumulative options, not just monthly: the rule is about interest
  having left the deposit
- **No tax assumptions (C6)** — post-tax figures are `null` unless a
  `taxProfile` is supplied. No default, no assumed TDS

**Verification:** unit **326** ✅ · invariants **343** ✅ · boundaries **15** ✅ ·
typecheck ✅ · prettier ✅. The domain suite adds ~122 assertions across the six
areas: amount validation, tenure validation, rate resolution, returns, payout,
and whole-configuration validation.

Three tests failed on first run and **all three were test bugs, not code bugs** —
an amount below the fixture minimum, and two assertions expecting a years-based
tenure rendering the platform does not use (`formatTenure(24)` is "24 months").
Corrected to match reality.

One **existing** invariant failed and was **re-pointed, not loosened**: "the
maturity formula has exactly two call sites" is now three, with Booking's
`returns.ts` named explicitly and the two formula *declarations* excluded as
TD-001, which drops back to one after R1.

### T3.2.10 readiness — two blockers, one of them new

Full package: [`t3.2.10-readiness-package.md`](./t3.2.10-readiness-package.md) —
data specification, integration contract, UI behaviour matrix, verification plan
and technical review.

1. **`tenureRates` data.** One row unblocks the control; six match the artwork.
2. **⚠ NEW — the artwork's "7 Days" chip cannot be represented.** The domain's
   only unit of tenure is the whole month (`tenureMonths`, integer, `> 0`), and
   `tenureRange` advertises "7 Days – 10 Years". This also makes **Custom
   tenure** near-unusable as specified, since `resolveTenureRate` is an exact
   match against the card. Four options in §5.1; **answer this before building**,
   because the days-based option changes a type the persisted draft schema
   depends on.

Also open, non-blocking: the slider's domain against a sparse card (§5.2,
index-domain recommended), tenure-dependent payout availability (§5.3), and
rate-card uniqueness at ingestion (§1.4).

**Not yet seen in a browser:** the four-cell returns strip and the Per Instalment
block. Both have shipped behind an awaiting state that is true on every code
path until a tenure is selectable.

### The founder correction, as implemented (T3.2.1)

The Note requires **four** booking steps; the approved UI, doc 20 and the
shipped `BOOKING_STEPS` specify **eight**. Approved reconciliation: the stepper
presents four phases, all eight routes remain.

- `BOOKING_PHASES` — what the user is told · `BOOKING_STEPS` — where the user is
- `resolveBookingPhase` is the **only** bridge, and an invariant asserts it is
  declared exactly once
- `Stepper` is **unchanged**. It already takes `steps` + `currentStepId`, so
  this is a change to what it is fed
- `success` maps to `null`, and `null` means **render no rail**. Not "show every
  phase complete" — `findIndex` returns `-1` and every phase would render
  *upcoming*, putting an untouched rail on a finished booking. Verified, and now
  covered by a unit assertion

Recorded plainly: this satisfies the Note's *labelling* more fully than its
*intent*, since the user still visits eight screens. The lightness requirement
therefore falls on the screens themselves.

### Booking draft contract (T3.2.2) — binds every remaining screen

Module-scoped context, seated on `/booking/[productId]/layout.tsx`, keyed by
product. Grounded in Document 09 §3–§6 (Booking is *Feature State*: "Current
Step · Entered Details · Confirmation Status"), §4 (feature state → context),
§5 (no module data in the global store) and §10 (never store derived values).

- **No Zustand, no new dependency** — same conclusion `useCompareSelection`
  reached from the same paragraphs
- **`sessionStorage`**, versioned key `fd:booking-draft:v1:<productId>`, 24h
  expiry **[TED]**, read through a Zod parse that **fails closed**
- **No maturity, interest or rate is ever stored** — enforced by omission in the
  type, and by an invariant that reads the type rather than trusting the comment
- **No current step** — the route owns that (§2, one copy of one fact)
- Degrades to in-memory when storage is unavailable (private mode, policy,
  quota). FR-CONF-002 says "where feasible"

Sensitive-field policy for steps 3–4 — identifiers only, never raw PAN / DOB /
account numbers — is proposed but **not yet approved** (OQ-8).

### Verification added

Unit **204 passed** · Invariants **343 passed** · Boundaries **15 passed**.

New coverage: the four-phase / eight-route mapping asserted as exact lists; the
`null`-phase trap; draft round-trip, expiry at both sides of the boundary, and
seven fail-closed cases; the draft's exact key set; Booking↔Marketplace
non-import in **both** directions; no Zustand in Booking; both primitives are
native HTML and hardcode no colour.

### ⚠ Two environment findings

**1. `npm run verify` crashes in the journey layer — pre-existing, not T3.2.**
`verification/suites/journeys.mjs:1041` passes raw DOM nodes to `check()`, which
`JSON.stringify`s them; a React-attached element is circular, so it throws every
time it is reached. The file is unmodified by T3.2, every other `check()` in it
passes a primitive, and `current-task.md` already recorded that M2.9's journeys
had never been executed — **this is the first run, and that is what it found.**

The assertion is an identity comparison, so the fix is to use `ok()`:

```js
ok('focus returns to the field rather than the document',
   document.activeElement === amountField());
```

Not applied — it changes an M2.9 assertion and was not instructed. One line,
awaiting approval.

**2. A stale `.git/index.lock` is present** and cannot be removed from the
sandbox (`Operation not permitted` on the mount). **Delete it on Windows before
your next git command.** No repository content was altered — a `git stash` was
attempted to isolate finding 1, the lock prevented it from starting, and all
working-tree files were verified intact afterwards.

**Gates:** `typecheck` ✅ (run here) · `verify unit/invariants/boundaries` ✅
(run here, with a Linux esbuild binary supplied out-of-tree) · `lint` ⚠ not
runnable — `unrs-resolver` ships Windows binaries in this `node_modules`, the
same limitation recorded throughout Phase 2 · `build` ⚠ not runnable, same
cause. **Run `lint` and `build` locally before sign-off.**

### Manual checks only you can run

- The Booking rail now shows **four** markers, not eight, on `/booking/fd-002/overview`
- `/gallery#slider-radio-cards` — `Slider`: drag, then Tab and use arrows / Home
  / End; confirm the thumb is ≥44px to the touch below `md` and that the fill
  tracks without lag. `RadioCardGroup`: confirm the group is **one Tab stop**
  and arrows move within it, and that the focus ring is drawn around the whole
  card
- Resume: configure nothing yet, but confirm a reload of a booking route does not
  error and that `sessionStorage` shows no key until a value is entered

---

## Phase 2 — Marketplace Module (complete)

## Completed

- Phase 0 — Platform Foundation · Phase 1 — Component Library + Data Layer
- M2.1–M2.3 — domain, business components, Marketplace Home
- M2.4 — listing, sort, pagination, URL state (**C0 closed**)
- M2.5 — search & filters — signed off, 221 assertions
- M2.6 — Product Details — T2.6.0 through T2.6.8, **signed off**
- **M2.7 — Comparison** — planned and approved; **T2.7.0 (documentation) complete**

### M2.6 task status

| Task | Status |
|---|---|
| T2.6.0 documentation amendments | ✅ |
| T2.6.1 cache contract A′ (preview read, priming write deleted) | ✅ |
| T2.6.2 route, static metadata, `not-found`, `ROUTES` cast | ✅ |
| T2.6.3 `ProductDetailScreen` shell, 404 vs 500, `container-detail` | ✅ |
| T2.6.4 `ProductHeader`, `TrustBadgeRow`, `KeyInfoGrid` | ✅ |
| T2.6.5 `InvestmentCalculator` (Zod + local state, no RHF) | ✅ |
| T2.6.6 Benefits, `EligibilityPanel`, `ProductAccordions` | ✅ |
| T2.6.7 compare context, provider seat, `DetailActionBar` | ✅ |
| T2.6.8 listing → details navigation + final verification | ✅ |

**M2.6 is complete pending `npm run build`**, the one gate that has never been
runnable in the agent environment (`node_modules` carries only
`@next/swc-win32-x64-msvc`, so the Linux SWC binary is absent).

### Out-of-plan work completed during M2.6

- **MSW readiness gate** — fixed a latent race in which queries fired before the
  Service Worker could intercept, leaving the listing permanently in its error
  state. See `msw-readiness-gate.md`.
- **Bank logo infrastructure** — approved departure from the monogram-only
  prototype. See below.

## T2.7.3 — behavioural findings worth carrying

Both came out of the journeys and are recorded in the suite itself.

- **Removing a column from an over-cap URL leaves four columns.** The URL drops
  from five ids to four, and the fifth product — carried in the URL all along,
  never displayed — takes the freed column. This follows from C4 (the URL is
  authoritative, the cap governs display, I7 forbids trimming until a write)
  rather than being designed, and it reads as a bug to anyone who has not
  followed the model. Worth confirming with design at sign-off.
- **A removal briefly shows skeletons.** The new id set is a new query key, so
  the batch refetches — plan §3.7 / risk R4, accepted, but visible.

## Manual verification — only you can run these

- **MSW gate:** unregister the Service Worker → hard refresh → products on the
  *first* load, no Try again, no `/api/v1/products` 404, request served from
  ServiceWorker. The jsdom harness structurally cannot test this.
- **Bank logos:** `npm run dev` and confirm logos render at the correct size in
  each slot. The harness bundles `next/image` outside a Next runtime, so `src`
  resolution and `fill` positioning are unverified there.
- **Listing → details round trip:** open a product from a filtered, sorted,
  paged listing, press Back, and confirm the listing returns exactly as left,
  with the compare selection intact. The harness asserts the links and the
  state that survives, but it mounts `HomeScreen` rather than the app router,
  so it cannot perform the navigation itself.

- **Action bar (T2.7.7):** confirm it is sticky below `md` and static from
  `md`, and that it never occludes the last comparison card — the harness has no
  layout engine (checklist E3/E5).
- **M2.8 desktop table:** highlighted values read as floating pills, not fused
  bands; rows breathe; the three money rows are visibly stronger than benefits
  and eligibility; separators are hairlines, not a grid.
- **M2.8 mobile:** a **vertical stack** of full-width cards (the carousel was
  removed, 2026-08-02). Confirm the page scrolls naturally, each card is
  self-contained, and the winner pill matches the desktop table.
- **Sticky entry bar occlusion (UX 1-C2):** with two products selected, scroll
  so the bar is stuck and confirm it covers no control at the bottom of the
  grid, that its appearance and disappearance move nothing above it, and that
  scrolling stays smooth while it is visible. The harness asserts the reserved
  room; only a device can confirm the pixels.
- **Touch targets (UX 1-C1):** every default-size button is 44px below `md` and
  40px from `md` up. Check the card actions, the filter chips and the dialog.
- **Mobile comparison peek (UX 3):** the next card is partly visible and swipe
  reads as available; `snap-center` still parks each card cleanly.
- **Desktop row spacing (UX 4):** a highlighted row reads as its own band, not
  as a block fused to the row beneath it.
- **Entry bar (T2.7.3b):** on Home, select two products and confirm the sticky
  bar does not occlude the last row of the grid at any width, and that the
  Compare button opens a comparison containing exactly the selected products
  (the harness asserts the href; it cannot follow it).
- **Rapid repeated Add (T2.7.6):** on `/compare`, open "Add another FD" and click
  a row's Add **twice quickly**. Exactly one product is added, the second click
  is inert, and the dialog is not left permanently disabled. The harness cannot
  observe this — its router is synchronous, so the guard's window has zero width
  (`verification/README.md`).

## Before production — do not ship without these

| # | Item |
|---|---|
| **P1** | **Replace the placeholder bank logos.** `public/banks/*.svg` are neutral coloured tiles bearing each bank's short code — **not** the banks' marks. Drop licensed assets at the same six paths; no code change required. Details in `public/banks/README.md`. |
| **P2** | **Confirm trademark permission** for displaying partner banks' logos. Unverified. If a bank is not cleared, set its `logoUrl` to `null` and it falls back to the monogram. |
| **P3** | Run `npm run build` — never yet executed in the agent environment. |

## Bank logo infrastructure (approved deviation)

The approved prototype specifies letter monograms. Logos were requested as a
product improvement and are recorded here as a deliberate departure, not drift.

- `Bank.logoUrl: string | null` on the domain model and DTO — nullable, not
  optional, so every bank states whether it has a logo and the fallback is a
  modelled case rather than a missing field.
- `BankBadge` renders it through `next/image` inside the **unchanged** circular
  slot (32/40/56 px, 12 px gap), `object-contain` so no aspect ratio distorts.
- Monogram remains the automatic fallback when `logoUrl` is `null` **or** the
  image fails to load.
- No component builds a path; all four surfaces (product cards, details header,
  featured banks, gallery) go through the one component.
- 16 probes enforce the above, including "no component hardcodes a `/banks/`
  path" and "no screen renders a bank image directly".

## M2.7 — Comparison (current)

Plan approved 2026-07-31: `m2.7-implementation-plan.md`, with the binding UI
contract in `m2.7-ui-fidelity-checklist.md`. Decisions D1–D6 recorded.

| Task | Status |
|---|---|
| T2.7.0 documentation | ✅ |
| T2.7.1a comparison batch widened to detail-level | ✅ |
| T2.7.1 `buildCompareRows` *(no UI)* — with C2, C3, A8, A9 | ✅ |
| T2.7.2a/b documentation — URL-authoritative model (C4) | ✅ |
| T2.7.2 `compare-url` + `useCompareUrlState` *(no UI)* — **O1 closed** | ✅ |
| T2.7.3 route + `CompareScreen` shell + L4/L6/L6b/L6c/L7 | ✅ |
| T2.7.4 `CompareTable` + `CompareColumnHeader` (≥ md) | ✅ |
| T2.7.5 `CompareCards` — mobile carousel (< md) | ✅ |
| T2.7.6 `ComparePicker` dialog | ✅ |
| T2.7.7 `CompareActionBar` | ✅ |
| T2.7.3b `CompareEntryBar` — Home entry to `/compare` (R15a) | ✅ |
| T2.7.8a build blockers — `ghost`/`icon` on `Button`, narrowing guard | ✅ **closed, all gates green** |
| T2.7.8 verification + milestone audit | ✅ **complete — M2.7 ready to close** |
| UX refinements (post-audit, approved 2026-08-01) | ✅ |
| **M2.8 — comparison UI/UX redesign** (presentation only) | ✅ |
| M2.8 — final polish pass (hierarchy, rhythm, typography) | ✅ |
| **M2.9 — Comparison Experience Refinement** (draft vs applied deposit amount) | ✅ implemented — journeys/typecheck/lint pending a local run |
| **Defect — 404 misclassification** (intermittent 404 page instead of the error card) | ✅ fixed at source |

**The 404 defect (2026-08-02).** A 404 the API never issued was being read as its
verdict: `/api/v1/*` exists only inside the Service Worker, so an unintercepted
request was answered by the Next dev server's HTML 404, `isNotFoundError`
accepted any 404, and `ProductDetailScreen` navigated to the not-found boundary.
`ApiError` now carries `source: 'api' | 'transport'`, only the envelope parser
may claim `'api'`, and both `isNotFoundError` and `isClientError` require it.
Unhandled requests under the API base are no longer silently passed to the
network. Full account in
[`api-404-misclassification.md`](./api-404-misclassification.md).

**M2.9 (client change request, 2026-08-02).** Editing and applying are now
separate: the Deposit Amount field holds a **draft**, the comparison is
calculated from an **applied** value, and the two meet only when the user clicks
Update Comparison (or presses Enter; Escape restores). Typing changes nothing on
screen; applying refreshes desktop and mobile together behind one 200ms opacity
settle, with `keepPreviousData` on the batch so the table never empties into
skeletons. Decisions, probes and the manual checklist in
[`m2.9-comparison-experience-refinement.md`](./m2.9-comparison-experience-refinement.md).

Invariants (315), units (164) and boundaries (15) are green. **Journeys,
`typecheck` and `lint` could not be executed in the agent environment** — the
working copy's `node_modules` carries Windows binaries and is reached over a
slow mount, so bundling for jsdom, `tsc` and `eslint` all exceed the sandbox's
per-command budget. Run them locally before sign-off.

**M2.7 audit (T2.7.8):** measured baseline **689 / 689**, ten exact lists all
exact, nine findings — **all Minor, none blocking**. Full record, carry-forward
register and the 13-item manual checklist in
[`m2.7-audit.md`](./m2.7-audit.md).

**Gates (T2.7.8a — all green):** `npm run typecheck` ✅ · `npm run lint` ✅
(whole repo, `--max-warnings 0`) · `npm run build` ✅ (run locally; not
executable in the agent environment) · verification suite ✅ **689 / 689**.

The first point in Phase 2 with all five gates green together. The ten type
errors found at T2.7.3b are fixed; details in `verification/README.md`
§ *Gate status*.

**The finding that shapes the milestone:** the approved mobile screen is a
one-card-at-a-time carousel, not a table. Desktop and mobile are two
presentations, not one layout reflowing.

### Carried into implementation

- **O1** — the cap of four is enforced in two places: the context (T2.6.7) and
  `useCompareProducts`'s `ids.slice(0, MAX_COMPARE)` (M2.1, predates the
  context). Resolve in **T2.7.2**; do not leave both silently.
  See `marketplace-compare-state.md` C2.
- **A3** — the approved comparison screen has **no link from a compared product
  to its details page**. Default in force is "no link". Worth an explicit
  answer from design before **T2.7.4**.
- Assumptions A1–A7 are registered in the plan §5.7 with defaults, reversal
  costs, and owners.

## Verification

`npm run verify` — **658 assertions** (150 unit · 266 invariants · 15
boundaries · 227 journeys). Baseline history in `verification/README.md`.

**Four** limitations are documented rather than implied away, because a green
suite is evidence only about what it exercises. Three are environmental — the
browser MSW race, `next/image` rendering, and cross-route navigation are outside
what jsdom and this harness can render. The fourth is **behavioural** and newer:
the pending Add guard's *engagement* on `/compare` cannot be observed, because
the harness's router notifies synchronously and the guard's window has zero
width. Its *release* is verified; its engagement is a manual browser check.

## Working agreement

Plan → approval → implement one task → verify → report → stop. No phase is
skipped; no architecture is introduced without approval. Source of truth:
`roadmap.md`, `phase-2-roadmap.md`, `docs/engineering/`, and the approved
Marketplace UI images.
