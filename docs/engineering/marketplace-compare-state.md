# Compare Selection State

Project: FD Investment Platform
Introduced: T2.6.7 (context) · documented T2.7.0 (before `/compare` consumes it)
Amended: **T2.7.2a — C4 replaced by the URL-authoritative model; `replaceAll` added; O1 closed**
Status: Approved — governs M2.7 and any later consumer of the compare selection
Companion: `marketplace-url-state.md` (the `?ids=` projection)

> **Authority, in one line.** A route that carries the selection in its URL is
> authoritative for it. That is `/compare` and nothing else today. Marketplace
> Home and Product Details carry no selection in their URLs, so on those routes
> the context is authoritative.

## Why this document exists

The compare selection is the only piece of Marketplace state that is **shared
across routes**. Everything else is either in the URL of the screen you are on
or local to a component. Home writes to the selection, Details writes to it,
and `/compare` reads it, writes it, *and* projects it into a URL.

Three routes touching one store is precisely the shape that grows a second
source of truth. This document fixes the ownership before M2.7 adds the third
consumer, rather than after.

Nothing here is invented: it records decisions already approved — M2.6 decision
D6 (context, not Zustand) and M2.7 decision D2, as amended by the T2.7.2
architecture review — and derives their consequences.

---

## Classification

Document 09 §3 classifies the compare list as **feature state**: shared within a
single business module, not global. §4 assigns feature state to a custom hook or
context. §5 is explicit that the global Zustand store must not hold marketplace
data.

So the selection is a module-scoped React context — `CompareSelectionProvider`,
mounted once in `app/(public)/layout.tsx`. No dependency was added to build it,
and none should be added to extend it.

Zustand was considered and rejected in M2.6: a global store for state that dies
with the route group is a wider blast radius for no benefit, and it would put
marketplace data in the place §5 forbids.

---

## Ownership map

| Concern | Owner | Notes |
|---|---|---|
| Which products are selected | `CompareSelectionProvider` | The store every route renders from |
| **What the selection *is*, on `/compare`** | **`?ids=`** | The URL is authoritative on that route (C4) |
| The cap of four | `MAX_COMPARE` → `constants/app.ts` | Enforced inside the provider, in `add`, `toggle`, and `replaceAll` |
| Resolving ids to products | `useCompareProducts` | Read-only; never mutates selection; **no longer caps** (O1) |
| The `?ids=` URL | `useCompareUrlState` (M2.7) | The route's sole writer |
| Row model and winners | `buildCompareRows` (T2.7.1) | Pure; derives from resolved products |
| Column order | Insertion order, carried in the URL | Visible to the user; decides the leftmost-tie winner |

```
  Home card "Compare"  ─┐
  Details "Add to      ─┼─►  add / remove / toggle  ─►  CompareSelectionProvider
   Compare"            ─┘                                   (ids only)
                                                              │   ▲
  /compare add / remove ───►  push ?ids=  ───► replaceAll ─────┘   │
                                   ▲                              ▼
                              Back / Forward             useCompareProducts
                                                                  │
                                                                  ▼
                                                          buildCompareRows
```

Two entry paths, and the difference is the whole design. On Home and Details a
selection change goes **straight to the store**, because no URL there describes
it. On `/compare` it goes **to the URL**, and the store follows — which is why
Back and Forward work there.

---

## The rules

Sources are named so each rule can be traced rather than trusted.

### C1 — Ids only, never product objects

*(T2.6.7; invariant I1.)* The context stores `string[]`. `useCompareProducts`
resolves ids through `marketplaceKeys.products.compare(ids)`. Two copies of a
product are two things to keep in step, and the copy in the context would be the
stale one — it is written when the user clicks Compare and never refreshed.

### C2 — The cap lives in one **module**

*(T2.6.7; amended T2.7.2a.)* `add`, `toggle`, and `replaceAll` all no-op or
truncate at `MAX_COMPARE`. Three methods, **one module** — the wording is
deliberate: what matters is that the rule is changed in one file, not that it is
written once. No consumer re-checks the cap before calling, and no consumer
implements its own limit.

Permitted references to `MAX_COMPARE` elsewhere, as an exact list:

| File | Why |
|---|---|
| `constants/app.ts` | The definition |
| `constants/compare.ts`, `constants/index.ts` | Re-export and barrel |
| `hooks/use-compare-selection.tsx` | **The only enforcer** |
| `app/(public)/gallery/business-demo.tsx` | Dev-only component demo with its own local state; it has no access to the context and exists to show the card's `compareDisabled` prop |

Anything else is a second enforcer and fails the probe.

> **O1 — closed in T2.7.2.** `useCompareProducts` applied its own
> `ids.slice(0, MAX_COMPARE)`, inherited from M2.1 when no context existed. It
> is removed: the hook resolves whatever ids it is given and does not adjudicate
> how many are allowed. `parseCompareIds` deliberately does **not** cap either —
> a business rule does not belong in the URL parser, and capping there would
> mean the pure layer and the context could disagree about what "full" means.
>
> Worth recording *how* O1 survived a green suite: the probe was named "the cap
> is enforced in the store, and only there" but only checked that `MAX_COMPARE`
> appeared in the context and not in two named components. **It never looked at
> `use-compare-products.ts`.** A probe whose name claims more than its assertion
> is worse than no probe, because it is believed. Every cap probe from T2.7.2
> onward asserts an exact file list.

### C3 — The provider is mounted once, at the route-group root

*(T2.6.7.)* `app/(public)/layout.tsx`. Mounting it per page would reset the
selection on every navigation, which is the one thing the selection exists to
survive. `useCompareSelection` throws when the provider is missing rather than
returning an empty selection: a component that quietly cannot select anything is
far harder to diagnose than one that fails on mount.

### C4 — The route that carries the selection in its URL is authoritative for it

*(Replaced in T2.7.2a. The rule it replaces is recorded at the end of this
section, together with why it was wrong — the reasoning is instructive even
though the conclusion was not.)*

On `/compare`, **the URL is the selection**. Everywhere else, the context is.

```
  ?ids=  ──►  replaceAll  ──►  context  ──►  render
    ▲                                          │
    └────────── one push per intent ───────────┘
```

1. **A compare interaction writes the URL only.** Add and remove on `/compare`
   go through the URL writer; they never call `add`/`remove`/`toggle` directly.
   This is the rule everything else rests on — with a single write there is no
   window in which the store and the URL disagree.
2. **The context follows the URL.** When the parsed, deduped, **capped** id list
   differs **by value** from `ids`, the hook calls `replaceAll`. By value, not by
   reference: a fresh array compared by identity would re-render forever.
3. **Rendering reads the context**, so the cap governs what is displayed.
4. **Synchronisation is not navigation.** It writes React state, never
   `router.*`. Zero navigations on a cold load (I7, write-only) is unaffected,
   and a shared link still never rewrites itself in front of its recipient.
5. **Elsewhere the context is authoritative.** Home and Details carry no
   selection in their URLs, so `add`/`remove`/`toggle` apply directly there
   (C5 unchanged).

**Back and Forward work as a consequence, not as a feature.** History moves the
URL; the URL is the selection; the table follows. That is the property the
previous rule could not deliver, and it is what I8's `push`-per-interaction was
paying for all along.

**The rule this replaces, and why it was wrong.** C4 previously said `?ids=`
seeds the context **once** and never again, forbidding synchronisation on the
strength of this chain: *remove a column → context updates → URL updates → the
effect reads the URL → the column returns.* The chain is real, but it begins
with "context updates" — the interaction writing to **both** the store and the
URL. The loop came from the double write, not from synchronising. Rule 1 removes
the double write and the loop cannot form. Hydrate-once cured a symptom, and in
doing so produced a route where Back moved the address bar and nothing else —
while I8 kept paying for history entries that could not be used.

**What "the URL wins" means now.** A cold load of `/compare?ids=a,b,c` shows
those three products whatever the in-memory selection was. Unchanged in effect
from decision D2 — but true continuously rather than only at mount, which is
what makes it true of Back-navigation as well.

**A consequence to design for (B4).** Because the URL is the selection, a bare
`/compare` shows the empty state even when the context holds three products.
Any affordance that navigates to the comparison must therefore compose `?ids=`
from the context. No such link exists anywhere in the application today.

#### Over-cap promotion — an intentional property, not a defect

*(Observed in journey L6c, accepted at T2.7.3 sign-off.)*

A URL carrying more ids than the cap keeps them all. Four are displayed; the
rest are held, unseen. **When the user removes a column, the next held id takes
the freed place**, so a five-id URL shows four columns before the removal and
four after — with a product the user has not seen before.

It is a consequence of three approved rules meeting, not a decision of its own:

| Rule | Contribution |
|---|---|
| C4 — the URL is the selection | Removal operates on the **URL's** list, not on the four displayed |
| C2 — the cap governs display | Only the first four reach the screen |
| I7 — canonicalisation is write-only | The extra ids are not trimmed on load, only at the first write |

**Do not "fix" this by capping at parse.** That would put the business rule in
the URL layer, reopening O1 and letting the parser and the store disagree about
what "full" means. Do not fix it by trimming on load either: that is a
navigation the user never asked for, and it rewrites a shared link in front of
its recipient (I7).

The behaviour is asserted in L6c, so a future change that removes it will fail
the suite rather than pass quietly. If design decides the promotion is
undesirable, the place to change it is the **entry affordance** — which composes
`?ids=` from the store and therefore never emits more than four in the first
place — not the parser, the store, or the writer.

### C5 — Selection changes never write another route's URL

*(Invariant I6.)* Clicking Compare on a product card on Home updates the context
and writes **nothing** to Home's URL. Home's URL describes what Home is showing.
The selection becomes URL state only on the route where it *is* the screen.

### C6 — Not persisted, and that is a stated limitation

*(T2.6.7; M2.7 risk R9.)* A refresh clears the selection. The approved screens
show no persistence affordance, so none was invented. The consequence is
asymmetric and worth naming: a refresh on `/compare` loses nothing, because
`?ids=` rebuilds the selection, while a refresh on Home or Details loses it
entirely.

`sessionStorage` would close the gap. It is **not proposed** for M2.7 — it adds
a hydration-mismatch surface and a second persistence authority alongside the
URL, for a scenario the approved designs do not show. Recorded as a known
limitation, not fixed here.

---

## The API

```ts
interface CompareSelection {
  ids: string[];
  count: number;
  max: number;
  isFull: boolean;
  has: (productId: string) => boolean;
  add: (productId: string) => void;      // no-op when present or full
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  clear: () => void;
  replaceAll: (ids: string[]) => void;   // T2.7.2 — caps internally
}
```

**`replaceAll` is the one method M2.7 adds** (T2.7.2a), and it exists for
exactly one job: letting the `/compare` URL become the selection under C4.

It is **not `addMany` under another name.** `addMany` was rejected in T2.7.0
because looping `add` produces the identical result — a reason that still holds.
`replaceAll` has different semantics: it *removes* ids that are absent from the
list. Looping `add` cannot express a removal, and a removal is precisely what
Back-navigation and a shorter `?ids=` require.

Conditions on it, all probe-enforced:

- it applies `MAX_COMPARE` itself, so C2's single-module rule holds;
- it has **exactly one caller**, `useCompareUrlState`;
- callers pass a list already parsed and deduped — it is a setter, not a parser.

The risk it introduces is bluntness: it can stomp the whole selection in one
call, and a component that reached for it would silently take authority away
from the URL. That is what the single-caller probe is for (risk R14).

**Deliberately absent, and to stay absent unless approved:** reordering columns
(no approved control), `addMany` (redundant with `add`), and any selector that
returns products rather than ids (that is `useCompareProducts`).

---

## Responsive architecture — a module decision (T2.7.5)

Promoted out of the T2.7.5 task plan, because it governs **every** responsive
divergence in this module, not only the comparison carousel. A task plan is
where a decision is applied; this is where it lives.

### Both presentations render; CSS decides which is displayed

```
<div data-compare-view="desktop" class="hidden md:block"> … table … </div>
<div data-compare-view="mobile"  class="md:hidden">       … cards … </div>
```

`display: none` removes the hidden subtree from the accessibility tree and from
hit-testing, so **only one presentation is ever exposed** — no duplicate
controls, no duplicate accessible names.

**A runtime `matchMedia` switch was rejected.** The server cannot know the
viewport, so the first client render would either mismatch or flash — the class
of bug this project already declined once when it refused to gate rendering on
MSW readiness (`msw-readiness-gate.md`). The cost of the chosen approach is
duplicated DOM, which at four columns is not worth a hydration surface.

### `data-compare-view` is a verification contract, not decoration

jsdom applies no media queries, so **both trees are visible to the harness**. An
unscoped selector binds to whichever rendered first — silently. Every compare
selector in the journey suite is therefore scoped to one of the two containers,
and a probe forbids unscoped ones.

That constraint buys something back: because both presentations exist in one
run, the suite can assert they **agree** — same column order, same values, same
winner per row (journey L9b). The property "desktop and mobile cannot diverge"
is checked rather than intended.

## Carousel accessibility — a scrollable list (T2.7.5)

CSS scroll-snap means every card is in the DOM and in the accessibility tree;
only one is visually in view. That fact forces a choice, and the decision is:

1. the scroller is a **labelled region**;
2. **all cards remain in the accessibility tree** — an off-screen card stays
   readable and its controls reachable;
3. **no `aria-hidden`, no `inert`** on any card, at any scroll position;
4. arrows and dots are **scroll affordances**, not state controls;
5. the position is announced **politely**, reporting position rather than a
   state change.

The one-at-a-time widget reading was rejected: it requires hiding off-screen
cards *and* managing focus so it never lands in a hidden one — a bespoke widget
with its own accessibility contract, which is exactly what choosing CSS
scroll-snap over a carousel primitive (decision D1) was meant to avoid.

"One card at a time" remains true visually. Under this decision it is a
presentation, not a state.

## Authority by route — the summary to check a change against

| Route | Carries the selection in its URL? | Authoritative | A selection change goes to |
|---|---|---|---|
| Marketplace Home `/` | No | **Context** | `toggle` on the store |
| Product Details `/marketplace/[productId]` | No | **Context** | `toggle` on the store |
| Comparison `/compare` | **Yes, `?ids=`** | **URL** | `push` a new `?ids=`; the store follows |

The column that decides the row is the second one. Nothing here is special-cased
for comparison: it is the same rule Marketplace Home already follows for its
filters, applied to a different piece of state.

## Entering the comparison — a consequence of C4, not a new rule (T2.7.3b)

**Any affordance that navigates to `/compare` must compose `?ids=` from the
store at the moment it renders.**

This is not a design preference. Under C4 the URL *is* the selection on that
route, so a bare link to `/compare` opens the **empty state** however many
products are selected — the affordance would appear to work and would silently
discard the user's choices.

Three properties follow, and all three are asserted:

1. **The href is built by `utils/compare-url.ts`** (`compareHref`), the module
   that already owns `IDS_PARAM` and the canonical form. A screen may ask for a
   compare href; it may not know how one is shaped.
2. **The href is composed on every render, never memoised across selection
   changes.** A memoised href points at a stale selection, which is the one
   defect that survives looking correct.
3. **Navigating is not a URL write.** Home stays context-authoritative (C5) and
   remains a single Marketplace URL writer (I2a): the entry bar renders a
   `<Link>` and nothing else.

The asymmetry worth stating explicitly, because it is what the next compare
control will get wrong: **Clear on Home writes the store; the same control on
`/compare` would have to write `?ids=`.** Both are correct — that is per-route
authority working — and neither can be copied to the other route unchanged.

Today the only entry point is Marketplace Home (`CompareEntryBar`, shown from
`MIN_COMPARE` products). **Product Details has no entry**, so a selection built
there is viewable only after returning Home; that is a known gap, carried
deliberately rather than absorbed into T2.7.3b's scope.

## Consequences for M2.7

- `CompareScreen` is the only component that calls both `useCompareSelection`
  and `useCompareUrlState`. Sections receive `onRemove` / `onAdd` as props (I3).
- A removal on `/compare` is **one write, to the URL**. It does not touch the
  store; the store is updated by the synchronisation that follows the URL
  change. One navigation per interaction (merge rule 5) still holds.
- An unknown id — well-formed but matching no product — is discovered only when
  the batch responds. It is removed from the **URL** with a `replace` (a
  correction, not an intent, I8), and the store follows from there.
- An over-cap URL (`?ids=` with five) renders four columns and keeps five in the
  URL until the next user write (I7 is write-only). The store and the URL
  therefore disagree **by design** in this one case, which is why the
  synchronisation compares against the *capped* list (risk R13).
- The empty state is a state of the *URL* on this route: `/compare` with no
  `?ids=` is empty even if the store is not (B4, C4).
