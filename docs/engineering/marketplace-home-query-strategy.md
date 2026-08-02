# Marketplace Home — Product Query Strategy

Project: FD Investment Platform
Milestone: M2.3
Status: Approved (adjustment 4) — recorded before implementation
Last Updated: 2026-07-30

## Purpose

Marketplace Home renders two product-derived sections — the **Hero Spotlight**
and the **Recommended Categories** row — plus a bank strip. This document
fixes how that data is obtained so the page stays correct when the mock data
is replaced by a real API with different volume, ordering, or coverage.

## The rule

**One shared product query feeds both product-derived sections.**

```
HomeScreen (client)
  ├─ useProducts({ sort: 'interestRate', order: 'desc', limit: HOME_PRODUCT_SAMPLE })
  │     ├─ Hero Spotlight      ← highest-rate product
  │     └─ Recommended Row     ← best product per category, from the same result
  └─ useBanks()                ← Featured Banks
```

Two network requests on first load. React Query deduplicates by key, so if a
later milestone (M2.4 grid) issues the same key, no additional request occurs.

## Why a sample, not a hardcoded assumption

`HOME_PRODUCT_SAMPLE` is a **sample size**, not a belief about the dataset.
The query asks the API for the top N products by rate; Home then derives its
sections from that sample. This avoids three ways of overfitting to today's
mock data:

1. **No positional assumptions.** The spotlight is "the highest-rate item in
   the result", not "item 0 of a list that happens to be sorted that way in
   the fixtures". Sorting is requested from the API and re-derived defensively.
2. **No assumption that every category is represented.** A category is
   rendered only if the sample contains a product carrying it. Categories with
   no match are omitted — the row shrinks rather than rendering an empty tile
   or inventing a placeholder rate.
3. **No assumption about dataset size.** The page works with 3 products or
   3,000; it never fetches "everything" to compute a highlight.

## Derivation rules

| Section | Rule | Fallback when data is missing |
|---|---|---|
| Hero Spotlight | Product with the highest `interestRate` in the sample | Hero renders headline + CTAs + trust line without the spotlight panel |
| Recommended Categories | For each category in `PRODUCT_CATEGORIES` (fixed set, M2.1), the highest-rate product in the sample carrying that category | Category omitted from the row; if none match, the whole section is omitted |
| Featured Banks | API order from `useBanks()` | Section omitted |

Reference amount for the spotlight's "grows to" figure is `REFERENCE_AMOUNT`
(M2.1). Maturity values are computed by `ProductService`, never in a component.

## Known limitation, deliberately accepted

Deriving categories from a rate-sorted sample means a category whose only
products sit below the sample cut-off will not appear. That is correct
behaviour for a "recommended" row (it highlights competitive products), and it
degrades safely: fewer tiles, never wrong tiles.

If a future requirement demands guaranteed coverage of every category, the
correct fix is a dedicated endpoint (`GET /products/recommended`) returning
one product per category — a backend contract change, not a UI workaround.
Recorded here so that decision is made deliberately rather than discovered.

## What Home does not do (M2.3 scope)

- No product grid, sort control, filter chips, result count, or pagination
  (M2.4 / M2.5).
- No `?category=` writing — category cards keep a callback seam only
  (approved adjustment 3).
- No booking or details navigation — those routes arrive in M2.4/M2.6.
