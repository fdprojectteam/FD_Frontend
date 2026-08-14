# Shared Finance Layer — Target Architecture

**Status** Approved 2026-08-06 · **Refactor R1 scheduled: after Booking, before Portfolio**
**Debt** TD-001 (open) · **Owner** Platform Engineering

---

## 1. Principle

> **Money rules are platform vocabulary, not feature logic.**
> The platform must have exactly one answer to "what is this deposit worth".

Document 19 §2 gives every business *entity* one authoritative location. The
same principle applied to *calculation* is this document: a deposit's maturity
value, its payout schedule, its applicable rate and its post-tax return are one
answer each, owned once, consumed by every module.

The alternative is already visible. Marketplace quotes a maturity value on a
product card; Booking quotes one on the configuration screen; Portfolio will
quote one on a holding; the FD Ladder will quote several at once. If those come
from different code, they will eventually disagree — and the Founder Vision's
standard is *"clear assumptions, risk language, security cues and precise
numbers"* (§4). Two engines is the shape of a future inconsistency in exactly
the place the product cannot afford one.

---

## 2. Current state

| Capability | Location today | Consumers |
|---|---|---|
| `calculateMaturity` | `src/utils/maturity.ts` **and** `src/modules/marketplace/utils/maturity.ts` | Booking · Marketplace |
| `calculateSimpleInterest` | `src/utils/maturity.ts` | Booking |
| `resolveApplicableRate` (amount slabs) | `src/modules/marketplace/utils/rate-slabs.ts` | Marketplace |
| `resolveTenureRate` (tenure card) | `src/modules/booking/utils/tenure-rates.ts` | Booking |
| Payout model (cumulative vs paid-out) | `src/modules/booking/utils/returns.ts` | Booking |
| Post-tax estimation | seam only — `taxProfile` on `calculateReturns` | none yet |
| `MaturityInput` / `MaturityResult` | `src/types/finance.ts` **and** `src/modules/marketplace/types/calculator.ts` | both |

Two of these are duplicated. Three are stranded inside a feature module where a
second module cannot legally reach them.

---

## 3. Target

```
src/utils/finance/
  maturity.ts    calculateMaturity · calculateInterestEarned · calculateSimpleInterest
  payout.ts      cumulative vs non-cumulative · instalment schedules
  rates.ts       resolveApplicableRate (amount)  ← from Marketplace
                 resolveTenureRate    (tenure)   ← from Booking
  tax.ts         post-tax estimation             ← when the planner supplies a bracket
  index.ts
src/types/finance.ts
  MaturityInput · MaturityResult · RateSlab · TenureRate · TaxProfile
```

**Rule after R1:** no feature module declares a financial calculation. Enforced
by a boundary probe, not by review.

**What stays in the modules.** Anything that is *presentation of* a figure or
*policy about which figures to show* — row models, formatters, screen state.
`buildInvestmentSummaryRows` stays in Booking. `buildCompareRows` stays in
Marketplace. Only the arithmetic moves.

### Why `rates.ts` holds both resolvers

They are two halves of one question and they **compose**: tenure sets the base
rate, an amount slab may then override it. Today they cannot be composed at all
— they live in different modules, and neither may import the other. A product
that prices by both tenure and size is ordinary, and the platform currently
cannot express one.

---

## 4. TD-001 — registered technical debt

> **Duplicate maturity calculation**
>
> **Incurred** 2026-08-06 (T3.2.4) · **Reason** Priority 4 forbids modifying
> Marketplace without explicit instruction; the module boundary forbids Booking
> importing from it. Both rules are correct; together they leave no compliant
> way to have one copy.
>
> **Interest** Every future change to the formula must be made twice, correctly.
> Rate slabs, TDS, non-cumulative payouts and senior-citizen rate premiums are
> all foreseeable changes to it.
>
> **Principal** ~40 lines plus one duplicated type pair.
>
> **Containment — the debt cannot drift silently.** The unit suite runs *both*
> implementations over all six published Marketplace figures and fails the build
> on any disagreement (`TD-001 — platform and Marketplace agree: …`, six
> assertions). The duplication can be deleted or detected; it cannot rot.
>
> **Repayment** R1 below.

---

## 5. R1 — the refactor

**Scheduled: immediately after the Booking module completes, before Portfolio
development begins.** Portfolio is the third consumer, and three copies is where
this stops being cheap to fix.

### Steps

1. Create `src/utils/finance/`; move `maturity.ts` (platform copy) into it as
   `maturity.ts`, and `payout.ts` out of `modules/booking/utils/returns.ts`
   — the arithmetic only; the `ReturnsResult` assembly stays in Booking
2. Move `rate-slabs.ts` from Marketplace and `tenure-rates.ts` from Booking into
   `rates.ts`
3. Delete `src/modules/marketplace/utils/maturity.ts` and
   `src/modules/marketplace/types/calculator.ts`; re-point Marketplace's imports
   to `@/utils/finance` and `@/types/finance`. **This is the only step that
   touches Marketplace, and it touches import lines only — no logic changes**
4. Delete the six TD-001 cross-implementation assertions, which will have served
   their purpose
5. Add a boundary probe: no file under `src/modules/**` may declare a financial
   calculation

### Verification

The regression test already exists and does not need writing: the six published
Marketplace figures, plus the full Booking domain suite added at T3.2.4–T3.2.6
(≈120 assertions across maturity, simple interest, rate resolution, payout
models, tax seam and validation). Both must pass unchanged.

### Cost

| | |
|---|---|
| Estimate | half a day |
| Blast radius | import statements in ~4 Marketplace files, ~3 Booking files |
| Rollback | revert one commit |
| Requires | **explicit instruction to modify Marketplace** |

### Trigger to bring R1 forward

Any of: the first change to either maturity implementation · the first
platform-level finance need from a third module · a product that prices by both
tenure and amount.

---

## 6. Consumers after R1

| Module | Uses |
|---|---|
| Marketplace | maturity · amount slabs |
| Booking | maturity · simple interest · payout · tenure rates · tax |
| Portfolio | maturity · payout (accrued interest, next payout date) |
| FD Ladder (Founder §6) | maturity · payout · **both** rate resolvers, across several banks at once |
| Reports | maturity · tax |

The FD Ladder is the case that settles the argument: it needs every one of these
simultaneously and cannot import any of them from Marketplace or Booking.
