# Verification harness

The project's first committed test setup (M2.5, closing M2.4 risk R6). Until a
test runner is approved, this is deliberately dependency-light: `esbuild` to
bundle the real source, `jsdom` for a DOM, and the project's own MSW handlers
for data. There is no assertion library and no framework to learn.

```bash
npm install
npm run verify              # everything
npm run verify unit         # pure modules only
npm run verify invariants   # architectural probes
npm run verify boundaries   # import-graph policy
npm run verify journeys     # real components in a DOM
```

## What each layer covers

| Layer        | Runs against                                                                                     | Answers                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `unit`       | `utils/url-values.ts`, `utils/list-params.ts`, `utils/filter-labels.ts`, `utils/compare-rows.ts` | Does the URL contract parse, merge, canonicalise, and translate correctly, and does the comparison pick the right winners? |
| `invariants` | the shipped source, comments stripped                                                            | Is the URL writer count still what the architecture says, with one owner per route and one translation layer?              |
| `boundaries` | the import graph                                                                                 | Does anything cross an architectural boundary?                                                                             |
| `journeys`   | the real components in jsdom + MSW                                                               | Does a complete user journey behave?                                                                                       |

**"Navigations", not "writes".** `writes()` in the journey suite counts
`pushCalls + replaceCalls` — router navigations. Since T2.7.2 the compare route
also _writes React state_ when it synchronises the store from `?ids=`, so the
bare word "write" would name two different things. Assertions about the router
say **navigations**.

## Rules the harness follows

**Nothing is re-implemented.** Every module under test is imported from `src/`.
The single substitution is `next/navigation`, replaced by
`harness/next-navigation.tsx` — a real history stack that records every write,
so "exactly one `router.replace()` per interaction" is measurable rather than
assumed.

**Data comes from the project's own handlers.** Filters are applied
server-side; a client-side stub would pass while the real contract was broken,
which is precisely how gaps G1 and G2 survived M2.4.

**Latency is respected.** The handlers delay ~250 ms on purpose. Assertions
poll (`waitFor`) rather than sleeping a fixed amount — the M2.4 audit lost time
to an assertion window shorter than the mock latency, where the application was
right and the harness was wrong.

## Assertion baseline

**Current: 495 measured statically + journeys unrun** — **164** unit · **316**
invariants · 15 boundaries, all measured and green at M2.9; **journeys were
rewritten at M2.9 (`L10`) and have not been executed** — see _What could not be
run at M2.9_ at the end of this file. The last measured journey count is 248.

| Milestone        | Total   | unit | invariants | boundaries | journeys |
| ---------------- | ------- | ---- | ---------- | ---------- | -------- |
| M2.6 sign-off    | 401     | 101  | 165        | 15         | 120      |
| **T2.7.1a**      | **416** | 101  | 173        | 15         | 127      |
| **T2.7.1**       | **449** | 125  | 182        | 15         | 127      |
| **T2.7.2**       | **482** | 144  | 196        | 15         | 127      |
| **T2.7.3**       | **521** | 144  | 208        | 15         | 154      |
| **T2.7.4**       | **548** | 144  | 223        | 15         | 166      |
| **T2.7.5**       | **598** | 149  | 240        | 15         | 194      |
| **T2.7.5 fixes** | **608** | 149  | 242        | 15         | 202      |
| **T2.7.6**       | **640** | 150  | 257        | 15         | 218      |
| **T2.7.7**       | **658** | 150  | 266        | 15         | 227      |
| **T2.7.3b**      | **687** | 150  | 280        | 15         | 242      |
| **T2.7.8a**      | **689** | 150  | 280        | 15         | 244      |

Compare future runs against **689** — the measured M2.7 baseline, taken with
all five gates green. Each
M2.7 movement is recorded separately below, so a later regression can be
attributed to the task that introduced the coverage.

### T2.7.3b — the entry to the comparison (+29)

15 journey assertions (group `J10`) and 14 invariant probes. No units — the one
piece of pure logic added, `compareHref`, is a two-line composition over
`serialiseCompareIds`, which units already cover exhaustively; a unit here would
re-assert the query string with a prefix.

**The journey asserts the `href`, never "navigation".** `next/link` is not
stubbed and jsdom refuses document navigation, so a probe named _"the bar
navigates to the comparison"_ could only be believed, not exercised — the
T2.7.7 lesson applied before the fact. What the defect would actually live in is
the URL the affordance points at, and that is what is measured.

**The staleness assertion is the one that carries a decision.** After the bar
appears at two products, a third is selected and the href is re-read: a memoised
href would still point at two, and a user would arrive at a comparison missing
the product they had just chosen. The probe pairs with a static one asserting
the screen does not wrap `compareHref` in a `useMemo`.

**E4 was re-pointed, not extended.** The probe named _"exactly two Route
assertions exist, in routes.ts **and nowhere else**"_ read only `routes.ts`, so
it had never seen the casts in either URL writer — a name claiming more than its
assertion, which is this milestone's recurring failure mode and was surfaced in
the T2.7.3b architecture review. It is now two probes: `routes.ts` still asserts
exactly two, and a second **exact file list** permits a runtime cast only where
a query string is composed — the two URL writers and `compare-url.ts`. A fourth
site, especially in a component, now fails rather than being absorbed.

The remaining probes hold the ownership line: the bar owns no state, store,
router or query, and — the one most likely to matter later — **does not compose
a compare URL of its own**, which would put the `?ids=` shape in a second place.

### T2.7.7 — the comparison action bar (+18)

9 journey assertions (group `E`, scoped to `[data-compare-actions]`) and 9
invariant probes. No units — the bar has no pure logic, and a unit test here
would assert JSX.

**The assertion that carries a design decision** is _"exactly one action bar
exists"_: it catches the failure D-A1 exists to prevent, since a bar placed
inside a `data-compare-view` container would exist twice — both presentations
are always in the DOM.

The ownership probe asserts the bar **owns no state and derives nothing**
rather than freezing today's empty prop list: when Booking needs an `onProceed`,
receiving one is legitimate; acquiring the authority is not. The gating probe is
behavioural for the same reason — it asserts that one derived decision exists
carrying **every** guard and that the bar has a single render site under it,
rather than matching an exact JSX string that `&&` rendering or a first prop
would break.

**Two corrections from the implementation review.** `hasComparison` now carries
all three guards (`ids.length > 0 && !isError && Boolean(products)`); with only
`Boolean(products)` it was correct today but would put the bar over the error
card the moment `keepPreviousData` was added to `useCompareProducts` — the
obvious remedy for the skeleton flash a removal causes, and what `useProducts`
already does. And the assertion once named _"Back writes no `?ids=`"_ never
clicked Back, so it could not fail; it is renamed to what the harness proves,
with the navigation guarantee resting on the static probes.

The layout contract (D-A7) is asserted as a **count** — the screen declares
exactly one `container-page`, the bar carries its own — rather than by matching
source adjacency. Nesting the two containers re-applies the gutter and insets
the bar from the table; where the JSX sits is not the defect.

### T2.7.6 — the Add Product picker (+32)

16 journey assertions (13 in `L3`, 3 in `L3b`), 15 invariant probes, 1 unit
assertion.

**`L3b` verifies that the pending guard _releases_, and says plainly that it
cannot verify the guard _engages_** — see the behavioural limitation below.
After an Add settles the next Add is enabled again, both products land in click
order, and there is one push per Add with no correction.

Two earlier versions were wrong in instructive ways. The first asserted an id
the journey had been **loaded** with, so no click could affect it — it could not
fail. The second forced a synthetic race the environment cannot express, and
failed for that reason rather than because the guard is wrong. Rows carry
`data-product-id` because bank names are not unique across the catalogue and it
is returned in rate order, so neither name nor position identifies a product.

**L3's close step was also fixed.** Radix labels its close control with an
sr-only span, not `aria-label`, so the attribute selector never matched and the
`??` fallback clicked the first row's Add button — disabled at the cap, so
"closing the dialog performs no navigation" passed while measuring nothing. It
now matches by text, with no fallback.

Two probes enforce the picker's independence from `FDProductCard` in the order
that matters: **the import first**, because a picker that imports the card
contains neither `<Link>` nor `ROUTES.product` and the obvious probe would pass
while the defect shipped.

Dialog content is portalled outside both `data-compare-view` containers, so
**portalled content is scoped by role** (`[role="dialog"]`) instead — the one
place the view-scoping convention cannot reach.

### T2.7.5 fixes — closing a divergence a green suite had shipped (+10)

A design-authority review of the completed task found that the two
presentations, given the same token string, rendered differently: on desktop the
brand colour and the cell's own `text-content` met on one element and
tailwind-merge resolved them, while on mobile a child span re-declared a colour
and beat the inherited brand. **Values and winner index were identical, so L9b
saw nothing.**

The duplication was the enabling condition — `BEST_CELL` and `BEST_ROW` were
byte-identical declarations in two files, which invites the assumption that they
behave identically.

Fixed by one shared `BEST_HIGHLIGHT`, by moving the colour onto the row so no
child overrides it, and by extending L9b to assert what it could not see: the
highlighted element carries every approved token **in both trees**, and
**nothing inside it re-declares a text colour** — the override tailwind-merge
cannot resolve because it spans two elements.

The lesson worth keeping: an assertion that compares _output text_ cannot see a
_presentation_ divergence, and two identical constants are not one source.

### T2.7.5 — the mobile carousel, and what the two presentations share (+50)

28 journey assertions (`L9`, `L9b`), 17 invariant probes, 5 unit assertions.

**`L9b` is the one that matters.** Both presentations are in the DOM together —
approach A renders both and jsdom applies no media queries — so the suite can
assert they _agree_: same column order, same values, same winner per row. The
claim "desktop and mobile cannot diverge" is now checked rather than intended,
and it holds even if a future edit bypasses `isBestCell` in one view.

**Two exact-list probes replace a class of bug rather than an instance.** `P1`
pins the three callers of `isBestCell`; `P2` requires `bestIndex` to appear in
exactly two files, so no component can re-derive the winner in any form —
comparison, destructuring, or passing it down as a prop. P1 alone could pass
while a component ignored the call and computed its own.

**Every compare selector is now scoped** to `[data-compare-view="desktop"]` or
`…="mobile"`. Unscoped selectors would bind to whichever tree rendered first.
The scoping landed _before_ the second tree existed, so no assertion ever ran
against an ambiguous DOM.

Two probes were re-pointed, not relaxed: the prop-shape check now follows the
shared `CompareViewProps` type, and the qualifier/empty-value checks moved to
`CompareValue`, which is where that content now lives.

One assertion was written wrong and corrected — for the second time in this
milestone, the same way: it pinned a card by position (the approved screen's
order) when the journey loads `fd-001…003` from the catalogue. It now locates
the highlighted card by the winner.

### T2.7.4 — the desktop table (+27)

12 journey assertions (`L4b`) and 15 invariant probes, with **two re-pointed**:
the journey helpers moved from the T2.7.3 shell's `#compare-columns > li` to
`table thead th[scope="col"]`, and the removal probe now follows the prop
(`onRemove={removeId}`) rather than the markup the screen no longer owns.
**The helpers changed; no assertion did** — a selector fix that also relaxed a
check would quietly retire what L6b protects.

`buildCompareRows` finally gets its **one call site** probe, deferred from
T2.7.1 until a caller existed.

One assertion was written wrong and corrected: it pinned the winning column at
index 1, which is the approved _screen's_ order (HDFC/IDFC/Kotak), while the
journey loads `fd-001…003` from the catalogue. It now asserts that the column
holding the catalogue's highest rate is the marked one — the rule, not the
fixture's ordering.

### T2.7.3 — the route, the shell, and the behavioural journeys (+39)

27 journey assertions (L4 · L6 · L6b · L6c · L7) and 12 invariant probes, with
**three probes re-pointed** rather than loosened: `SCREENS` gained
`compare-screen.tsx`, the E4 probe became "exactly **two** `as Route`
assertions" plus a new one confirming the phantom `/marketplace` is still
unasserted, and the selection-consumer list became three screens.

This is the milestone's first _behavioural_ evidence. Everything before it
asserted contracts and structure; **L6b is the assertion the T2.7.2a amendment
turns on** — under the superseded hydrate-once model the URL moved on Back and
the columns did not.

Two findings came out of writing them, both recorded in the journeys themselves:

- **Removing a column from an over-cap URL keeps four columns.** The URL drops
  to four ids and the fifth product — carried all along, never displayed — takes
  the freed column. It follows from C4 rather than being designed, and it reads
  as a bug to anyone who has not followed the model.
- **A removal briefly replaces the columns with skeletons**, because the new id
  set is a new query key and the batch refetches (plan §3.7, R4 — accepted). The
  first draft of the assertion measured the mock's latency instead of the
  behaviour, exactly the mistake the M2.4 audit recorded.

### T2.7.2 — the second URL writer (+33)

19 unit assertions on `compare-url.ts` and 14 invariant probes, of which two
were **edited rather than added**: the writer probe became an exact two-item
list, and the cap probe became an exact four-file list. **Journeys are unchanged
at 127** — T2.7.2 renders nothing, and nothing mounts the new hook until T2.7.3.

The assertion that carries the most weight is _"more than four ids parse
intact"_: it proves the parser does not know the cap, which is what keeps the
pure layer and the store from disagreeing about what "full" means (C2, O1).

Three probes pin the R13 loop guards structurally, since a static probe cannot
observe a loop but can observe its absence: the sync compares against
`ids.slice(0, max)`, it compares by value rather than by reference, and the
writer imports no cap of its own — it reads `selection.max`.

### T2.7.1 — `buildCompareRows` (+33)

24 unit assertions and 9 invariant probes. The unit fixture is the approved
comparison screen itself — HDFC 7.1%/12m, IDFC FIRST 7.75%/12m, Kotak 7.4%/24m
with the published returns — so the assertions test the design rather than the
function's self-consistency. Journeys are unchanged at 127: T2.7.1 renders
nothing.

Two assertions carry more weight than the rest. _"Highlighting reproduces the
approved screen"_ pins all seven `bestIndex` values in one line, including the
₹10,000 tie going to the leftmost column and Tenure having no winner. _"Maturity
is read from `estimatedReturns`, never recomputed"_ feeds in a maturity no
formula would produce and requires it to be printed verbatim — if that ever
fails, a second calculation site has appeared.

### T2.7.1a — the detail-level batch (+15)

Accepted 2026-07-31. What changed, and why the counts moved more than the plan
predicted:

| Change                                                                                 | Layer      | Note                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The comparison batch is detail-level: 4 probes on the repository, service, and handler | invariants | Guards against a tidy-up back to the summary type, which would silently empty the Eligibility row                                                                                                                                         |
| The paginated list still returns summary DTOs                                          | invariants | Proves the widening did not leak into the list path                                                                                                                                                                                       |
| Mock `residency` is `'Resident'`                                                       | invariants | The approved cell reads `Resident, 18+`                                                                                                                                                                                                   |
| **The maturity formula has exactly two call sites**                                    | invariants | Replaces a probe the T2.7.1a plan assumed existed. The accurate rule is an exact list — `ProductService` (derived returns) and `ProductDetailScreen` (the interactive calculator, T2.6.5). A _third_ call site is the regression to catch |
| `L0 · Compare batch contract` — 7 assertions                                           | journeys   | Exercises repository → axios → MSW → mapper with **no component rendered**. A static probe can assert the types; only this asserts what comes back                                                                                        |

The plan predicted 412; the actual is 416. The four extra assertions are
verification depth, not scope: no production behaviour differs because of them.

## M2.7 — Comparison (planned; recorded in T2.7.0)

Recorded before implementation so the suite is designed rather than
retrofitted, and so the probes that must _change_ are visible in advance.

### Probes that must be edited, not just added

These currently encode "one route writes URLs". They are correct today and will
be **wrong** the moment `useCompareUrlState` exists. Editing them is part of
T2.7.2, not an afterthought:

| Probe                                           | Today                                  | After T2.7.2                                                                              |
| ----------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `exactly one module writes the Marketplace URL` | one file                               | **two** — `use-marketplace-url-state.ts` and `use-compare-url-state.ts`, and nothing else |
| `only HomeScreen consumes the URL-state owner`  | unchanged                              | plus its sibling: only `CompareScreen` consumes the compare owner                         |
| `SCREENS` in `invariants.mjs`                   | `home-screen`, `product-detail-screen` | plus `compare-screen`, so compare sections are held to I3                                 |
| section-component hook denylist                 | includes `useCompareProducts`          | add `useCompareSelection`, `useCompareUrlState`                                           |

A probe that is loosened rather than re-pointed is how an invariant quietly
stops being one. "Two writers" must be asserted as an exact list, never as
`length <= 2`.

### New coverage

**Unit** — `buildCompareRows`: row order; highest wins for rate, interest
earned, maturity; **lowest** wins for minimum investment; `bestIndex === null`
for Tenure, Benefits, Eligibility; **ties resolve to the leftmost column**; one
product; empty input.

`compare-url` — **syntax only**: parse, dedupe (first occurrence wins, so column
order survives), drop malformed ids, drop empty segments, bound the raw string,
canonical serialisation, order preservation.

**It does not cap.** _(Corrected in T2.7.2b; the T2.7.0 draft of this line said
"cap at 4", written before D8 existed.)_ The cap of four is enforced **only** by
`useCompareSelection`, in `add`, `toggle`, and `replaceAll` — one module, per C2
and O1. A cap in the parser would let the pure layer and the store disagree
about what "full" means, and that disagreement is the thing C2 exists to
prevent. The assertion that proves it: **more than four ids parse intact.**

**Invariants** — two writers sharing one merge-and-serialise shape;
`buildCompareRows` has exactly one call site; no component recomputes a maturity
figure; the compare page has a Suspense boundary; the table is a real `<table>`
with scoped headers.

**Exact-list probes (T2.7.2 onward).** These are stated as exact lists, never as
"absent from these three files":

| Probe                                                                                      | List                                                                                                                  |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Modules that write a Marketplace URL                                                       | exactly `use-marketplace-url-state.ts` and `use-compare-url-state.ts`                                                 |
| Files referencing `MAX_COMPARE`                                                            | definition, re-export, barrel, `use-compare-selection.tsx`, and the dev-only gallery demo — **and nothing else** (O1) |
| Callers of `replaceAll`                                                                    | exactly `use-compare-url-state.ts` (R14)                                                                              |
| Compare components calling `add`/`remove`/`toggle`                                         | **none** — on that route intent goes to the URL (C4)                                                                  |
| Files containing the literal `'ids'` parameter name, **within `src/modules/marketplace/`** | exactly `compare-url.ts`                                                                                              |

The reason for the format is on the record: O1 survived a green suite because a
probe named _"the cap is enforced in the store, and only there"_ only checked
two named components and never looked at `use-compare-products.ts`. **A probe
whose name claims more than its assertion is worse than no probe, because it is
believed.**

**Why the `'ids'` probe is module-scoped, and the others are not** (clarified
T2.7.2). `src/mocks/handlers/products.ts` also contains the literal, reading the
same parameter as the mock **server**. That is the other side of the contract,
not a second URL owner, and a repo-wide list naming both would blur the
invariant this probe exists to state: **within the Marketplace module, exactly
one file knows the parameter's name.** The `MAX_COMPARE` probe is deliberately
repo-wide by contrast, because a stray enforcer anywhere — including the
dev-only gallery page — is exactly what it must catch.

**Journeys (L-series)** — L1 select → navigate → columns in selection order ·
L2 remove a column: table, count, and URL update in **one** write · L3 add via
the picker, cap enforced · L4 cold load of `?ids=a,b,c` with **zero
navigations** ·
L5 hostile ids (unknown, malformed, duplicated, more than four) · L6
back/forward across removals · **L6b Back after a removal restores the column
and the count** · **L6c an over-cap URL settles: four columns, zero navigations,
no state churn (R13)** · L7 empty state → link home · L8 a11y: one `h1`,
`<th scope>` correctness, per-product remove names, visually-hidden "best"
qualifiers.

**L4, L6, L6b and L6c come first in T2.7.3, before any further UI.** Amended in
T2.7.2a. `/compare` is URL-authoritative, so the store is synchronised from the
URL on every change — and **a static probe cannot see a synchronisation loop**.
That moves the behavioural journeys from "the end of the milestone" to "the
first thing built on the writer". Components accumulating on top of an
unverified sync is the expensive order to discover a loop in.

### Behavioural limitation — the pending Add guard (T2.7.6)

Distinct from the layout and browser-API gaps below, and the first of its kind
in the compare feature: this is _application behaviour_ the harness cannot
observe, not a rendering concern.

`router.push` in `harness/next-navigation.tsx` notifies **synchronously**, so on
`/compare` the pending id is set and cleared inside one React flush and the
guard's disabled window has **zero width**. The lag it exists to bridge — an
asynchronous App Router navigation where a render occurs with the pending id set
and `ids` not yet updated — does not exist here.

| Property                                                             | Status                                   |
| -------------------------------------------------------------------- | ---------------------------------------- |
| The guard **releases** — consecutive Adds work, no deadlock          | **Verified** (L3b)                       |
| The guard **engages** — a second Add is inert while one is in flight | **Not verifiable.** Manual browser check |

Forcing the race by firing two clicks in one synchronous turn does not work and
should not be reattempted: it models an interaction a user cannot perform — two
real clicks are separate tasks, with a React flush between them — and a
render-based guard cannot defend against it by construction.

**Required manual check:** on `/compare`, open "Add another FD" and click one
row's **Add twice in rapid succession**. Exactly one product must be added, the
second click must be inert, and the dialog must not be left with every Add
permanently disabled. Repeat across two different rows.

Making the harness router asynchronous would close this, and was considered and
deferred: it would re-qualify every existing journey against a new router
contract to close one gap, and a guessed latency would produce false confidence
rather than none.

### What this harness cannot test — stated before it goes green

The mobile presentation is **the part of M2.7 with the least automated
coverage**, and it is also the part that diverges most from desktop. jsdom has
no layout engine and no scrolling, so **scroll-snap, arrow-driven scrolling, dot
synchronisation, sticky positioning, and column overflow at four products are
all unverifiable here.** Radix Dialog's focus trap is only partially observable.

These need a real browser, exactly as M2.6's breakpoint behaviour did. A green
suite is evidence about what it exercises and nothing more.

## Gate status — measured at T2.7.8a

| Gate   | Status                                       | Command                                                                                                                                                                                                  |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types  | ✅ **clean**                                 | `npm run typecheck` (`tsc --noEmit`)                                                                                                                                                                     |
| Lint   | ✅ **clean**, whole repo, `--max-warnings 0` | `npm run lint`                                                                                                                                                                                           |
| Suite  | ✅ **689 / 689**                             | `npm run verify`                                                                                                                                                                                         |
| Format | ✅                                           | `npx prettier --write` on every changed file                                                                                                                                                             |
| Build  | ⛔ **not runnable here**                     | `npm run build` — `next build` downloads `@next/swc-linux-x64-gnu` and the sandbox has no registry access (`EAI_AGAIN registry.npmjs.org`). Only the win32 binary is installed. **Must be run locally.** |

**Types and lint were both believed unrunnable for all of M2.7. Both run.**
That mistake is why ten type errors survived seven tasks: the suite bundles
with esbuild, which does not type-check, and the invariant probes read source
_text_, which was plausible.

`npm run typecheck` is now the authoritative check for anything the type system
can express, and is run every task. A probe is the wrong instrument for that
class of defect — see the withdrawn probe recorded in `invariants.mjs` beside
the D-A3 assertion.

### What T2.7.8a fixed

Ten errors, two defects. Eight were `variant="ghost" size="icon"` passed to a
`Button` declaring neither: **cva drops an unknown variant silently**, so the
carousel arrows, the dots and the remove control had been rendering with no
variant _and no size_ — 16–20px targets against a design system whose own token
is `--ds-touch-target-min: 44px`. `ghost` was specified in the Phase 0 blueprint
and never implemented; `icon` is its 44px companion. Two were `products`
possibly `undefined` at the render sites, because `Boolean(products)` guards
correctly at runtime and narrows nothing.

**One accepted exception, recorded rather than fixed:** the carousel dots stay
8×8px. Making them 44px would change the approved row; they neutralise the
`ghost` hover in their own `className` so they render exactly as before, and the
arrows — now 44px — are the equivalent control that keeps the exception
defensible.

### Deposit amount (+9 invariants measured, +15 journeys **not yet run**)

The comparison gained an editable deposit amount; returns and the best-value
highlight follow it, the interest rate does not.

**Nine invariant probes, all green.** The field owns nothing and calculates
nothing; the screen holds the amount as local state; **no amount reaches the
compare URL layer** (the parameter set stays closed at `?ids=`); the batch takes
the amount and forwards it to the service; and the **query key carries it** —
the probe that matters most, because omitting the amount from the key would
serve one amount's figures for another straight from cache and look entirely
correct doing it. One existing probe was re-pointed: the batch now takes a
second argument, so the "ids come from the store" assertion matches the first
argument and stops there.

**Fifteen journey assertions were written and have not been executed.** The
sandbox was reset mid-task and rebuilding the application bundle now exceeds the
45-second per-command ceiling, so `L10` has never run. They are recorded here as
**unrun, not passing** — the distinction this suite exists to preserve. What
they assert: every column recomputes on a new amount, the _rate_ does not move,
the winner is recomputed rather than remembered, changing the amount performs no
navigation and leaves the URL carrying only the selection, a below-minimum
column is flagged while still showing its (correct) figures, and a non-numeric
entry raises an announced field error while the table holds the last valid
figures.

**Run `npm run verify` locally to confirm them before this goes to the client.**

### Mobile: carousel → vertical stack (−3, and this is the honest direction)

**The baseline went down, and that is the correct outcome.** The horizontal
carousel was replaced by a vertical stack of full-width cards, so the
assertions describing the carousel — the labelled scroller region, the ‹ ›
arrows and their non-looping behaviour, the dot indicators, the polite position
status, and the arrows' 44px targets — were **removed because the behaviour was
removed**. None was weakened; each described a widget the screen no longer
renders, and keeping any of them would have meant asserting something untrue.

What replaced them is smaller and structurally stronger:

| Was                                                                                                   | Is                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| "no card is hidden **at any scroll position**" — delicate, because a carousel hides content by design | "no card is hidden" — structural, because nothing is off-screen                             |
| "carousel position is local state, never the URL (I6)"                                                | "the mobile view owns **no state at all**" — no `useState`, no `useRef`, no scroll listener |
| "the scroller is a labelled region"                                                                   | "the cards are a real list, one item per product"                                           |
| —                                                                                                     | "nothing scrolls horizontally any more"                                                     |

The component is now presentation in the strictest sense (I3): it renders props
and reports a removal upward. The I6 question — could a transient UI position
leak into the URL? — disappears rather than being answered, because there is no
position.

### M2.8 polish pass (+0, two more re-points)

No new assertions: every change was spacing, weight, or a class, and the
existing probes already cover the structure.

**`EMPHASISED_COMPARE_ROWS` became `COMPARE_ROW_EMPHASIS`**, a total
`Record<CompareRowId, 'hero' | 'strong' | 'normal'>`. Three tiers rather than
two, and _total_ over the row union — adding a row to `CompareRowId` now fails
to compile until someone decides how loud it is, the same trick the union
already plays for labels and formats. The three probes added hours earlier were
re-pointed to the map.

**"No card is hidden from assistive technology" was re-pointed, closing audit
finding V-4.** It used to test the whole file for `aria-hidden` after stripping
one exact decorative pattern — so it failed the moment a legitimately decorative
element appeared that did not match the pattern (the swipe hint, whose meaning
the polite status already carries), and it would have masked a genuine
`aria-hidden` on a card that did. It now asserts what its name says: no
`<article>` opening tag carries `aria-hidden` or `inert`, and `inert` appears
nowhere.

### M2.8 — comparison redesign (+3, and four documented re-points)

Presentation-only, so the movement is small and the interesting part is what
was **re-pointed rather than added**.

**Three new invariants**, all guarding the new emphasis taxonomy the way
`STACKED_COMPARE_ROWS` is guarded: it lives with the row model, it is consumed
by exactly the two view components, and the row _builder_ never reads it —
emphasis is presentation, not a business rule, and the probe fails if it ever
becomes one.

**Four re-points, none a weakening.**

1. `highlightIn(root)` is new: it finds the element carrying the highlight,
   whether that is the cell itself or a descendant. The winner used to be a tint
   on the `<td>` and is now a pill _inside_ it, so a probe reading the cell's
   own class would have reported "no winner rendered" while the winner rendered
   perfectly. `bestCellIndex` and `mobileBestIndex` both go through it, so both
   still prove the highlight reaches the DOM.
2. `HIGHLIGHT_TOKENS` gained `rounded-full` and `shadow-elevation-1` and lost
   `rounded-card` — it remains the **exhaustive** list of what `BEST_HIGHLIGHT`
   declares, asserted on both trees.
3. `desktopBestCell` / `mobileBestRow` now return the highlighted _element_, so
   the "nothing inside overrides its colour" check still points at the thing
   whose colour must be inherited.
4. **Checklist D4 is superseded.** It said the card tints the whole row where
   the table tints the cell; the assertion is inverted and renamed, because a
   full-width band on a narrow card announced itself louder than the value it
   was about. Both presentations now wear the same pill, from the same token.

### UX refinements (+7)

Seven journey assertions in `J10`, no invariants and no units — every change was
a class, and a probe over a class string in the source would assert less than
the journey does over the rendered DOM.

**What the harness can and cannot say about occlusion.** jsdom has no layout
engine, so "the sticky bar never covers a control" is not measurable here. What
_is_ measurable is the property the defect consists of: the page reserves room
for the bar **whenever the bar can appear**, and releases it when the bar goes.
Both are driven by one flag, so asserting they move together asserts the rule.
The visual confirmation stays on the manual list.

Layout stability is asserted by reading the grid before and after the bar
disappears — a bar that pushed or pulled the content above it would change the
card count or the container. Scroll smoothness is **not assertable at all** and
is manual-only.

Selection feedback is asserted on the _card_, not the button, because that is
where the change is. Two assertions guard the constraint that made it safe: the
control reports its state through `aria-pressed`, and **no control renames
itself** — the labels are captured before any selection and compared after, so
the assertion has something real to fail against.

### T2.7.8a — the icon controls (+2)

Two journey assertions in L9: the arrows and the remove control carry the icon
size. jsdom has no layout engine, so the **class** is the only observable proxy
for a touch target; the assertion is named for what it checks. No invariant was
added — the D-A3 probe was **re-pointed** to the new derivation and still
asserts all three guards, and a probe banning `!` / `as` / `?? []` at the render
sites was proposed and withdrawn as spelling enforcement.

### M2.9 — draft vs applied deposit amount (2026-08-02)

**17 invariant probes** in one new section, _Draft vs applied_, and a rewritten
`L10` journey group. The journey's central assertion is **inverted**: typing used
to have to recalculate the table, and now must change nothing at all. The
recalculation is asserted against the explicit apply that follows it.

The probes deliberately assert the **separation**, not the calmness. Calmness is
the consequence — a debounce would reproduce it — and it is the consequence that
a later refactor would keep while quietly losing the rule. So they count the
writers of the applied value, pin the keystroke handler to the draft alone, and
check that the draft leaves the screen exactly once, as the field's `value`.

Two guard the cost of the fix rather than the fix: `keepPreviousData` on the
comparison batch means an errored refetch now keeps its previous data, so the
content guard must go on carrying `!isError`.

## Environment note

`VERIFY_REUSE_BUNDLES=1` skips rebuilding unchanged bundles. It is a local
convenience only — CI must never set it, or a source change can be verified
against a stale bundle.

### What could not be run at M2.9 (agent environment)

`npm run verify unit`, `invariants` and `boundaries` all run and are green
(164 / 316 / 15). **Journeys, `typecheck` and `lint` do not.** The working copy's
`node_modules` carries Windows binaries and is reached over a slow mount:
bundling the application for jsdom, `tsc`, and `eslint` each exceed the sandbox's
per-command budget, and `@esbuild/win32-x64` has to be substituted before the
static suites will run at all. The rewritten `L10` assertions are therefore
**written and unexecuted** — the same status the M2.8 carousel assertions carried,
and they must be run locally before sign-off.
