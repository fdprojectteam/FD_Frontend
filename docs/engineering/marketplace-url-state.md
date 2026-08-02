# Marketplace URL State & Architectural Invariants

Project: FD Investment Platform
Introduced: M2.4 (extends M2.3)
Status: Approved — governs M2.4 and every later Marketplace milestone
Amended: M2.5 (I7, I8) · M2.6 (route scope) · T2.7.0 (second URL writer, `/compare`) · **T2.7.2b (URL→store synchronisation replaces hydrate-once)**

## Why this document exists

Marketplace Home carries eight URL parameters that together describe one screen
state:

| Parameter | Owner | Introduced |
|---|---|---|
| `q` | search | M2.3 |
| `amount` | search | M2.3 |
| `tenure` | search | M2.3 |
| `page` | listing | M2.4 |
| `sort` | listing | M2.4 |
| `order` | listing | M2.4 |
| `bank`, `minRate` | filters | M2.5 |

The set above is **closed**: `q`, `amount`, `tenure`, `bank`, `minRate`,
`page`, `sort`, `order`. Marketplace Home writes no other parameter.
(`category` was previously reserved here; it is dropped by approved decision
D2 — it has no approved control.)

**The closed set is per route, not per module** (clarified in T2.7.0). The eight
parameters above belong to Marketplace Home. `/marketplace/[productId]` carries
no query parameters at all. `/compare` carries exactly one:

| Route | Parameter | Owner | Introduced |
|---|---|---|---|
| `/` | `q` `amount` `tenure` `bank` `minRate` `page` `sort` `order` | `HomeScreen` | M2.3–M2.5 |
| `/marketplace/[productId]` | *(none — calculator state is local, decision D3)* | — | M2.6 |
| `/compare` | `ids` | `CompareScreen` | M2.7 |

Each set is closed independently. A route may not write another route's
parameters, and no parameter is shared across routes.

They are **one state**, not two. If separate hooks each call `router.replace()`
from their own closure over `useSearchParams()`, two updates in the same tick
can clobber one another — changing sort could silently drop `q`. This document
fixes the model so that cannot happen.

---

## The model: one writer, many readers

```
useMarketplaceUrlState()          ← single owner of reads AND writes
  ├─ values        : all eight params, parsed and validated
  ├─ navigate(patch, mode)        ← the ONLY navigation in the module
  │    ├─ commit(patch)  → router.push     (intent, I8)
  │    └─ correct(patch) → router.replace  (correction, I8)
  ├─ setSearch(patch)     ← q / amount / tenure          (push)
  ├─ setFilters(patch)    ← bank / minRate / tenure / amount (push)
  ├─ clearFilters()                                       (push)
  ├─ setPage(page) · setSort(option)                      (push)
  └─ correctPage(page)    ← out-of-range clamp            (replace)
```

The diagram above is Marketplace **Home**. From M2.7, `/compare` has its own
writer of the same shape and a single parameter:

```
useCompareUrlState()              ← sole owner of ?ids= reads AND writes
  ├─ ids           : parsed, deduped, malformed entries dropped (syntax only)
  ├─ navigate(ids, mode)          ← the ONLY navigation on this route
  │    ├─ commit(ids)  → router.push     (add / remove, I8)
  │    └─ correct(ids) → router.replace  (unknown id dropped, I8)
  └─ sync()           ← store follows the URL; performs no navigation
```

**One hook performs every write.** Feature-facing helpers (`setSearch`,
`setListing`, later `setFilters`) are thin wrappers over a single private
`merge(patch)` function. Consumers may be split for ergonomics — a search
component doesn't want listing setters — but they are selectors over one hook,
never independent writers.

### Merge rules (mandatory)

1. **Read-then-merge, always.** Every write starts from the *current*
   `URLSearchParams`, applies the patch, and writes the result. No write ever
   constructs a URL from a partial snapshot.
2. **Absent means unchanged.** A key not present in the patch is preserved.
   Only an explicit empty/undefined value removes it.
3. **Canonicalisation — default values are omitted on write.** A parameter
   equal to its default is *removed* from the query string rather than
   written. `page=1`, the default sort (`interestRate`/`desc`), and empty
   search or filter values never appear. Consequences:
   - one screen state has exactly one URL, so links, history entries, and
     future cache keys are stable and comparable;
   - returning to a default (clearing a search, sorting back to "Highest
     rate", paging back to 1) *shortens* the URL instead of leaving stale
     `page=1&sort=interestRate&order=desc` residue;
   - `/` and `/?page=1&sort=interestRate&order=desc` are the same state and
     must render identically.
4. **Coupled updates are one write.** Changing sort resets the page — that is a
   *single* merged write (`{ sort, order, page: undefined }`), never two
   sequential `replace()` calls.
5. **Exactly one navigation per user interaction.** Selecting a sort, changing
   a page, submitting a search, or toggling a filter each produce **one**
   navigation carrying the complete merged state. Never two writes in one
   handler, never a write inside an effect that reacts to another write. This
   is what makes rule 1 sufficient: with a single write per interaction there
   is no second closure to clobber the first.

   *Amended in M2.5.* This rule originally said "one `router.replace()`". The
   count was always the point; the *kind* of navigation is now governed by I8
   below. Replace-only writing was found to make the back button useless on
   this screen (M2.5 verification, F3).
6. **Validation on read, not on write.** Unknown `sort`, non-numeric `page`,
   or out-of-range values are normalised when parsed, so a hand-edited URL can
   never break the screen.

### Worked expectations

| Action | Before | After |
|---|---|---|
| Change sort | `?q=hdfc&page=3` | `?q=hdfc&sort=tenureMonths&order=asc` (q kept, page reset) |
| Change page | `?q=hdfc&sort=tenureMonths&order=asc` | same **+** `&page=2` |
| Submit search | `?page=2&sort=…&order=…` | `?q=icici&sort=…&order=…` (page reset, sort kept) |
| M2.5 select filter | `?q=hdfc&sort=…` | same **+** `&bank=hdfc` (page reset, everything else kept) |

---

## Architectural Invariants

These are binding for M2.4 and every subsequent Marketplace milestone.

### Scope (added in M2.6)

I1–I8 are **module-wide**, not Home-specific. They were written when Marketplace
had one route; M2.6 adds `/marketplace/[productId]` and M2.7 adds `/compare`.

Ownership is scoped **per route**: each Marketplace route has **at most one** URL
writer, and that writer is the route's screen component. "At most" is
deliberate — a route that reads no URL state has none, which is stronger than
the invariant requires and is the case for the product-details route (decision
D3 = local calculator state).

Everything else applies unchanged wherever a Marketplace route writes a URL:
read-then-merge (rule 1), one navigation per interaction (rule 5), write-only
canonicalisation (I7), and intent pushes / correction replaces (I8).

### I1 — Listing URL state is a single source of truth

`page`, `sort`, `order`, `q`, `amount`, `tenure`, and all future filters live in
the URL and are written through **one** merging writer. Updates merge existing
parameters; they never overwrite the whole query string. No component holds a
duplicate copy of this state, and no second hook calls `router.replace()`.

*Amended in T2.7.0.* "One writer" is **one writer per route**, as the M2.6 scope
note already established. From M2.7 the module has **exactly two** writers —
`useMarketplaceUrlState` for `/` and `useCompareUrlState` for `/compare` — and
that count is asserted, not assumed. Two is not a relaxation of I1: each writer
owns a disjoint parameter set on a distinct route, so neither can clobber the
other. What I1 forbids is two writers over the *same* state, which is still
impossible.

The real hazard of a second writer is **divergence**, not collision (risk R2):
two writers that canonicalise differently, or disagree about push versus
replace, produce a module where URL behaviour depends on which screen you are
on. Both writers therefore share one shape — read current params → merge patch →
serialise from parsed values → navigate once — and the probes assert the shape,
not just the count.

### I2 — Hero, recommendations, and featured content are independent of the listing

The hero spotlight, recommendation row, and featured banks use their own query
keys and **must not change when the user paginates or sorts**. Reusing listing
data for the hero is forbidden: it would make the "highest rate available today"
figure depend on the current page — wrong, and invisible until a user sorts.
If a future milestone needs hero data to react to something, that is a new
approved query, not a reuse of the listing result.

### I2a — `HomeScreen` is the sole owner of Marketplace URL mutations

`useMarketplaceUrlState` may be *read* wherever convenient, but **only
`HomeScreen` calls its setters**. Section components receive `onSortChange`,
`onPageChange`, `onSearchSubmit` callbacks as props and never touch the router
themselves. One owner means one place to reason about merge order, page
resets, and focus handling — and it makes I1 enforceable by inspection rather
than by convention.

The single exception is a component that *is* the URL owner for its own route
in a later milestone (e.g. the Compare screen in M2.7); within Home, ownership
is `HomeScreen` alone.

*Amended in T2.7.0 — the exception is now real.* `CompareScreen` is the URL
owner for `/compare` and the only caller of `useCompareUrlState`'s setters. The
same discipline applies inside that route: `CompareTable`, `CompareCards`,
`CompareColumnHeader`, `ComparePicker`, and `CompareActionBar` receive
`onRemove`, `onAdd`, and data through props and never touch the router or the
compare context directly. One owner per route, no exceptions inside a route.

### I3 — Presentation components stay presentation-only

`ProductGridSection`, `ProductGrid`, `SortControl`, `ResultCount`, and every
other section component receive data and callbacks through props. `HomeScreen`
remains the sole hook owner on this page. No section component may call
`useProducts`, a service, a repository, or the router.

### I4 — M2.5 extends this architecture; it does not fork it

Search and filters must add parameters to the same URL state, the same merging
writer, and the same `useProducts` query key — no parallel state model, no
component-local filter state that shadows the URL, no second fetch path.

### I5 — One query key per purpose

Query keys come from `marketplaceKeys` only. Distinct purposes (listing page vs
hero sample) intentionally use distinct keys; identical purposes must share a
key so React Query deduplicates rather than double-fetching.

### I6 — Only domain state belongs in the URL

The URL carries state that is **shareable, bookmarkable, and restorable**:
what the user is looking at (`q`, `amount`, `tenure`, `page`, `sort`, `order`,
filters). Transient UI state stays in local component state and must never be
written to the URL:

| Belongs in the URL (domain) | Stays local (transient UI) |
|---|---|
| search terms, filters, sort, page | in-progress input text before submit |
| product id on the details route | dropdown/accordion open state |
| compare selection, as `?ids=` on `/compare` (M2.7) | dialog and toast visibility |
| | hover, focus, scroll position |
| | skeleton/loading flags |
| | **carousel position on mobile compare** |

Test to apply: *would a colleague opening this link expect to see the same
thing?* If yes it is domain state; if it would merely replay a half-finished
interaction, it is local. This keeps URLs meaningful, avoids history spam, and
prevents accidental coupling between visual state and data fetching.

Note (M2.5, decision D1): search commits only on button click or `Enter`.
In-progress input text is transient and never reaches the URL, so no amendment
to this invariant is required.

Note (T2.7.0): the compare selection passes the test — "would a colleague
opening this link see the same thing?" is exactly what `/compare?ids=a,b,c`
promises. But it is domain state **only on `/compare`**. Selecting Compare on a
product card does not write a URL: the user is still on Home, and Home's URL
describes what Home is showing. The selection lives in the compare context
throughout, and the URL projects it on the one route where it *is* the screen.
The mobile carousel position fails the same test — it replays a half-finished
interaction — so it stays local.

### I7 — Canonical URLs (write-only)

Equivalent states must always produce exactly **one** canonical URL. Default
values, empty values, and redundant parameters are omitted **on write**.

Canonicalisation is **write-only**. A non-canonical or invalid URL is
normalised *internally on read* — it is parsed to valid values and rendered
correctly — but must **not** trigger a `router.replace()` on load. A canonical
URL is emitted only when Marketplace performs a **user-initiated write**:
search, filter, sort, pagination, or clear.

| Input | Rendered as | URL on load | URL after the next user write |
|---|---|---|---|
| `?page=1` | page 1 | unchanged | `/` |
| `?sort=interestRate&order=desc` | default sort | unchanged | `/` |
| `?bank=` | no bank filter | unchanged | `/` |
| `?bank=hdfc&page=1` | HDFC, page 1 | unchanged | `?bank=hdfc` |

Applied to `/compare` (T2.7.0). The same table, for the one parameter that
route owns:

| Input | Rendered as | URL on load | URL after the next user write |
|---|---|---|---|
| `?ids=a,b,c` | three columns | unchanged | unchanged until add/remove |
| `?ids=a,,b` | two columns | unchanged | `?ids=a,b` |
| `?ids=a,b,a` | two columns | unchanged | `?ids=a,b` |
| `?ids=a,b,c,d,e` | four columns | unchanged | `?ids=a,b,c,d` |
| `?ids=` *(empty)* | empty state | unchanged | `/compare` |
| `?ids=unknown` | *see below* | unchanged | `/compare` |

An **unknown id** — well-formed but matching no product — is the one case that
cannot be settled at parse time; it is known only once the batch responds. It is
then dropped from the selection, and because a removal is a user-visible change
of what is on screen, the shortened URL is written at that point. This is the
`/compare` analogue of Home's out-of-range page clamp: not equivalence
canonicalisation but **invalidity discovered from a response**, and under I8 it
is therefore a `replace`, not a `push`.

This is merge rule 3 raised to an invariant and stated as an observable
property of the URL rather than of the writer. One state ↔ one URL keeps
history entries, shared links, React Query cache keys, and future analytics
identities stable and comparable — and it makes "back" land on a meaningfully
different screen rather than on a cosmetically different URL for the same view.

Write-only is what keeps I7 compatible with rule 5. Rewriting the URL on load
would be a navigation the user never performed: an unrequested history entry,
and a shared link that mutates itself in front of the recipient.

**Named exception — the out-of-range page clamp.** `HomeScreen` corrects
`?page=99` to the last real page once the response reports `totalPages`
(approved in M2.4). This is not I7 canonicalisation: `?page=99` is not
*equivalent* to page 4, it is **invalid**, and its invalidity cannot be known
at parse time. It is the only write on Marketplace Home that is not initiated
by the user, and under I8 it is a `replace`.

### I8 — Intent pushes, correction replaces

Introduced in M2.5 by approved decision, resolving finding F3.

| Navigation | Kind | Why |
|---|---|---|
| Search submit | `push` | The user asked for this result set |
| Filter apply / remove / clear all | `push` | Each refinement is a place to come back to |
| Sort change | `push` | A deliberate change of view |
| Page change | `push` | Position in a result set is somewhere the user chose to be |
| Out-of-range page clamp | `replace` | The user asked for a page that does not exist |
| Any future automatic normalisation | `replace` | The user did not ask for it |
| **Remove a compare column** (M2.7) | `push` | A deliberate narrowing, and a place to come back to |
| **Add via the compare picker** (M2.7) | `push` | Same |
| **Drop an unknown id** (M2.7) | `replace` | A correction; the user never asked for that id to vanish |
| **Synchronise the store from `?ids=`** (M2.7) | **no navigation at all** | See below |

The test to apply: **did the user ask for this URL?** If yes it is a place they
can return to, and it gets a history entry. If the application produced it on
its own — a correction, a normalisation, a clamp — it must not become somewhere
Back can land, because Back would return to a state already known to be wrong
and the correction would fire again.

Why this was needed: `replace` overwrites the current history entry, so under
replace-only writing a session that searched and then applied two filters
produced three writes and **one** history entry. Back did not undo a filter; it
left the site. On a screen whose whole purpose is comparing options by
narrowing them, that is a real usability cost, and it contradicted the M2.5
definition of done.

What does **not** change: still one writer, still one navigation per
interaction, still read-then-merge, still write-only canonicalisation. I8
governs the *kind* of navigation, not how many.

**Synchronisation is a third kind: not a navigation.** (T2.7.0, decision D2, as
amended in T2.7.2a.) Reading `?ids=` into the compare store is neither intent
nor correction — the URL is *already* what the user asked for, so there is
nothing to navigate to. A `push` would add a history entry the user never
created; a `replace` would rewrite a shared link in front of its recipient. Both
are wrong for the same reason I7 is write-only.

The rule: **arriving at `/compare` performs zero navigations**, asserted by
journey L4, because "no navigation" is the kind of property that decays silently
into "one harmless navigation".

The word *write* is deliberately avoided here. Synchronisation **does** write —
it writes React state, calling `replaceAll` on the store. What it never does is
call the router. Since T2.7.2 the two senses are distinguished throughout:
**navigation** means `router.push`/`router.replace`; **write** unqualified means
neither, and assertions about history count navigations.

*(This paragraph previously described the same rule as "hydration", a one-time
seed on cold load. That model left Back and Forward inert on this route; see
`marketplace-compare-state.md` C4.)*

---

## Route: `/compare` (M2.7)

### The parameter

`ids` — a comma-separated list of product ids, **in the user's column order**,
capped at four. There is no second parameter, and none is reserved.

Order is preserved because the user can see it: the leftmost column is the first
product they picked, and a tie in Minimum Investment is awarded to the leftmost
column. A shared link that reordered the columns would highlight a different
winner than the sender saw.

### One state, one URL — but one *cache entry* for several URLs

`marketplaceKeys.products.compare(ids)` **sorts** ids before building the key.
So `?ids=a,b` and `?ids=b,a` are two canonical URLs — they render different
column orders — but one React Query entry. This is deliberate and worth stating,
because it looks like an I5 violation and is the opposite: the *fetch* is
order-independent (the same three products), while the *presentation* is not.
Sorting only the cache key is what stops a reorder from refetching data the
client already has.

### The URL is the selection on this route

*(Amended in T2.7.2b. This subsection previously read "The selection is the
source of truth; the URL is its projection", with a one-time seed on cold load
and the store driving the URL thereafter. That model left Back and Forward
moving the address bar without changing the table, and made I8's history entries
unusable. The governing rule is now C4.)*

Direction, at runtime:

```
  intent      :  add / remove  ──►  push ?ids=      (one navigation, I8)
  consequence :  ?ids=         ──►  replaceAll      (no navigation)
  render      :  store         ──►  columns
```

Intent writes the URL and nothing else. The store follows the URL — including
when the URL moves because the user pressed Back. That single direction is what
makes history work here, and it is why there is no window in which the store and
the URL disagree.

The one deliberate exception: an over-cap URL. `?ids=` with five ids renders four
columns and keeps five in the URL until the next write, because I7 is write-only.
The store and the URL therefore differ by design in that one case, which is why
the synchronisation compares against the **capped** list.

**Governing contract: `marketplace-compare-state.md` C4.** Where this document
and C4 appear to differ about `/compare`, C4 is authoritative.

### What this route inherits unchanged

Read-then-merge · one navigation per interaction · write-only canonicalisation
(I7) · intent pushes and correction replaces (I8) · presentation-only sections
(I3) · query keys from `marketplaceKeys` only (I5).

### What is specific to it

A **Suspense boundary is required**. This route reads `useSearchParams`, which
triggers the CSR bailout during prerendering (M2.4 defect C2). The details route
needs none because it reads no query parameters — that difference is a property
of the route, not a house style, and copying M2.6's page shell verbatim would
reintroduce C2.

---

## Transport independence

This architecture is deliberately **independent of how data is fetched**. The
URL is parsed into `ProductListParams`, which is handed to `useProducts` →
`ProductService` → `ProductRepository` → the API client. Nothing in the URL
layer knows whether the response comes from MSW, a REST backend, GraphQL, or a
server-rendered fetch.

Consequences worth stating, since they are the reason for the design:

- **Today (MSW):** parameters reach the mock handlers as real query strings and
  are honoured server-side, exactly as a backend would.
- **Real API later:** flipping `NEXT_PUBLIC_ENABLE_MOCKS` changes nothing here —
  same params, same keys, same URLs.
- **SSR / server-side data later:** because the full screen state lives in the
  URL, a server component can read `searchParams`, fetch the same page, and
  hydrate a matching client cache. No client-only state would need to be
  reconstructed or guessed.
- **Caching and analytics:** canonical URLs (rule 3) mean one state has one
  cache key and one analytics identity.

---

## Consequence for M2.4 implementation

The M2.4 plan's separate `useProductListParams` hook is **replaced** by
extending the existing M2.3 hook into `useMarketplaceUrlState`, with
`useMarketplaceSearchParams` retained as a thin selector so M2.3 components
need no changes. This removes the clobbering bug class structurally rather
than relying on careful call-site discipline.
