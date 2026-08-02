# Current Task

## Phase

Phase 2 — Marketplace Module (**in progress**)

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
