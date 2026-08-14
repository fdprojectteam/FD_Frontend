# RFC-001 — Tenure and Rate Modelling

| | |
|---|---|
| **Status** | Proposed |
| **Author** | Platform Engineering |
| **Date** | 2026-08-06 |
| **Supersedes** | `t3.2.10-architecture-review.md` §9 (12 required modifications) |
| **Blocks** | T3.2.10 — Tenure Selector |
| **Reviewers** | Product · Design · Compliance · Engineering |

---

## 1. Background

The Booking module's Investment Details screen is complete except for its tenure
control. The domain layer beneath it — maturity engine, tenure→rate resolution,
payout model, validation — shipped across T3.2.4–T3.2.9 with 399 unit and 389
invariant assertions passing.

Three documents preceded this RFC:

1. **`t3.2.10-readiness-package.md`** — identified that the approved artwork's
   "7 Days" chip cannot be represented, since the domain's only unit of tenure is
   the whole month.
2. **`t3.2.10-architecture-review.md`** — accepted that, and added eleven further
   required modifications including a `RateQuote` value object and the deletion
   of three `DepositTerms` fields.
3. **`t3.2.10-review-challenge.md`** — rejected four of the twelve, found the
   review's central cost claim wrong by ~2×, and found it had contradicted a High
   risk its own author had logged.

This RFC settles the disagreement and unblocks T3.2.10.

---

## 2. Problem

**P1 — The tenure unit cannot express the product's advertised range.**
`tenureMonths: number` (integer, > 0) cannot represent 7 days, while
`tenureRange` advertises "7 Days – 10 Years" and Founder Vision §5 names
short-term parking as a planner use case.

**P2 — `DepositTerms` carries display copy that behavioural code can read.**
`interestRate`, `tenureRange` and `payoutOptions` are bank-authored words sitting
beside machine-readable equivalents with no enforced relationship. `interestRate`
is read by a pricing path today and can contradict `tenureRates`.

**P3 — Compounding frequency is a platform constant answering a per-bank
question.** `COMPOUNDS_PER_YEAR = 4`, correct for all six current products,
silently wrong for any bank that compounds monthly or annually.

**P4 — The draft accepts fractional rupees.** `z.number().positive().finite()`
with no `.int()`, while `tenureMonths` correctly has it.

**P5 — Rate cards have no identity, version or effective period**, so BR-PROD-003
(rate changed mid-booking → notify, recalculate, confirm) is unimplementable and
Doc 19's requirement that a booking reference the rate effective at the time
cannot be met.

**Only P2 and P4 are live defects.** P1, P3 and P5 are correctness risks that
have not yet been triggered by any product in scope.

---

## 3. Decision

### D1 — Keep `tenureMonths`; migrate to `tenureDays` on a trigger

**Rejected:** migrating now. The prior review argued cost rises with delay. It
does not: the persisted draft is `sessionStorage` with a 24-hour expiry behind a
version-gated fail-closed parse, so migration costs a version bump and discards
nothing anyone will miss. `tenureMonths` funnels through three functions and one
row builder, and the tenure control adds one consumer, not a class of them.

**Trigger:** the first `tenureRates` row that cannot be expressed in whole months.
Enforced at ingestion, not left to memory.

**Corollary:** the "7 Days" chip is **not built** in T3.2.10. Design must confirm
its removal from the artwork or accept it rendering only once a product sells it.

### D2 — Add `label?: string` to `TenureRate` now

Zero migration, no schema change. Lets a bank render "1 Year" or "7 Days" in its
own words, and removes the only genuine advantage a `{value, unit}` duration
object had.

### D3 — Do **not** delete display-copy fields; restrict who may read them

`interestRate`, `tenureRange` and `payoutOptions` **stay**. Deleting them would
change approved UI copy — "Monthly, Quarterly, Cumulative, At Maturity" is four
bank-authored words including a synonym with no id, and "7 Days – 10 Years"
describes an advertised family range that a one-row rate card cannot reproduce.

Instead, adopt the **three-tier field rule**:

> `DepositTerms` carries what the product **is** (source of truth, read by logic)
> and what the product **says about itself** (display copy, read only by row
> builders). **No behavioural code path may read display copy.**

Enforced by an invariant probe, plus a consistency assertion that the headline
`interestRate` appears somewhere in `tenureRates`.

### D4 — Remove `DepositTerms.tenureMonths`

The genuinely redundant field, and the one the prior review missed while
recommending three deletions that should not happen. It is a third opinion on
tenure, read only by `formatSelectedTenure` for the Overview card.

### D5 — Enforce integer rupees

`.int()` in the persisted schema and a matching branch in `validateAmount`.
Shipped standalone — **not** bundled with any tenure migration.

### D6 — Add `compoundingFrequency?: CompoundingFrequency` to `DepositTerms`

Defaulting to `'quarterly'`. Closes P3 with one optional field instead of a new
resolution protocol.

### D7 — Defer `RateQuote` to R1

Adopted as the **target shape**, recorded in `shared-finance-layer.md`,
implemented when the shared finance layer forms or at the first real second
pricing dimension — whichever comes first.

---

## 4. Alternatives Considered

### 4.1 Tenure representation

| Option | Verdict | Reason |
|---|---|---|
| **A. `tenureMonths`** | ✅ **Chosen for now** | Simplest; sufficient for every product in scope; migration cost is flat over time |
| **B. `tenureDays`** | ✅ **Chosen as the target** | Banking-correct, sortable, expresses everything. Deferred on a trigger |
| **C. `{ value, unit }`** | ❌ Rejected | Admits three representations of one quantity. Equality, sorting, dedup and `Set` membership all break unless every consumer normalises — and if they must, the normalised form *is* the model |
| **D. ISO-8601 `"P24M"`** | ❌ Rejected | Not comparable or sortable in SQL; JS has no native parser; `P1M` vs `P30D` ambiguity |
| **E. Value Object class** | ➖ Orthogonal | Must still choose A or B underneath. Revisit with B |

### 4.2 Display-copy duplication

| Option | Verdict |
|---|---|
| Delete the fields | ❌ Changes approved UI copy |
| Derive them from the rate card | ❌ Same, and conflates advertised range with bookable terms |
| **Restrict reads via invariant** | ✅ **Chosen** — same protection, zero pixels changed |

### 4.3 `RateQuote` timing

| Option | Verdict |
|---|---|
| Now, before T3.2.10 | ❌ Speculative generality against four unspecified requirements; ~2h marginal saving |
| **At R1** | ✅ **Chosen** — alongside the consolidation already scheduled |
| Never | ❌ Genuinely needed for effective dating and BR-PROD-003 |

---

## 5. Trade-offs

**What this RFC accepts:**

- The platform cannot sell sub-month deposits until D1's trigger fires
- The approved artwork's "7 Days" chip will not render — a visible divergence
  from the design deck, joining the ₹10,792 maturity divergence (C2)
- Display copy remains structurally duplicable; only *reads* are constrained
- A second, smaller migration later (months → days) instead of one now

**What it buys:**

- T3.2.10 unblocked for ~90 minutes of work instead of 1–2 days
- No speculative types built against unwritten requirements
- The two live defects (P2, P4) closed immediately
- Founder Vision §12 respected: effort stays available for the seven named
  differentiators rather than hardening booking configuration

**The central judgement:** *last responsible moment*. For a change that is
reversible and whose cost does not rise with delay, deferring is the correct
call — and this RFC establishes explicit triggers so deferral is a decision
rather than a habit.

---

## 6. Migration Plan

| Phase | Work | Cost | Trigger |
|---|---|---|---|
| **Now** | D5 integer rupees · D3 probe + consistency assertion · D2 `label?` · D4 remove `tenureMonths` | ~90 min | This RFC |
| **T3.2.10** | Tenure selector on the existing model | as planned | Rate-card data |
| **Before MVP** | D6 `compoundingFrequency` · value date + maturity date · applied-rate capture | ~1 day | First non-quarterly bank |
| **R1** | D7 `RateQuote` · `rates.ts` consolidation · TD-001 repayment | ~1 day | After Booking, before Portfolio |
| **Trigger** | `tenureMonths` → `tenureDays`, day-count convention | ~1 day | First sub-month rate-card row |

**No phase blocks the next.** Each is independently shippable and independently
revertible.

---

## 7. Backward Compatibility

| Surface | Impact |
|---|---|
| **Persisted drafts** | D5 adds `.int()`. Existing fractional drafts fail the parse and are discarded — the designed fail-closed behaviour. **No version bump required**: the schema only narrows |
| **`DepositTerms`** | D2 and D6 are optional fields — additive. D4 removes `tenureMonths`, a **breaking type change** with one call site (`formatSelectedTenure`) |
| **`resolveTenureRate`** | Unchanged. D7 deferred |
| **Public API** | None exists yet |
| **Approved UI** | Unchanged, by design — D3 exists to guarantee this |
| **Verification suites** | D4 touches one Overview assertion; D5 adds cases |

**The only breaking change is D4**, contained to a single call site.

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| **Q1** | `tenureRates` data — 1 row minimum, 6 to match the artwork | Product | T3.2.10 |
| **Q2** | Is the "7 Days" chip removed from the design, or deferred? | Design | Artwork fidelity |
| **Q3** | Index-domain slider confirmed for a sparse rate card? | Design | Slider behaviour |
| **Q4** | Does `minInvestment` vary by tenure? | Product | Retroactively affects approved T3.2.8 |
| **Q5** | Do any partners restrict payout availability by tenure? | Product | `supportedPayouts` shape |
| **Q6** | Do any partners compound other than quarterly? | Product | D6 urgency |
| **Q7** | Is the Marketplace rate the same quantity as the Booking rate? | Product | Cross-screen consistency |
| **Q8** | Who owns the rate card's lifecycle — admin UI, partner sync, manual? | Product | Effective-dating urgency |

**Only Q1 blocks implementation.** Q2–Q8 can be answered in parallel.

---

## 9. Approval Checklist

- [ ] **Product** — Q1 rate-card data supplied
- [ ] **Product** — Q4, Q5, Q6, Q7, Q8 answered or explicitly deferred
- [ ] **Design** — Q2 "7 Days" chip disposition
- [ ] **Design** — Q3 index-domain slider
- [ ] **Engineering** — D1 deferral accepted, trigger recorded in the data contract
- [ ] **Engineering** — D3 three-tier rule accepted as an enforced invariant
- [ ] **Engineering** — D4 removal of `tenureMonths` accepted
- [ ] **Engineering** — D7 `RateQuote` recorded as the R1 target
- [ ] **Compliance** — effective dating deferral acceptable pre-production
- [ ] **Compliance** — Half-Yearly / Yearly payout descriptions signed off (T3.2.9)

---

## 10. Implementation Plan

**Stage 0 — this RFC approved.** No code.

**Stage 1 — ~90 minutes, no UI, unblocks nothing but removes two live defects**
1. D5 integer rupees — schema `.int()` + `validateAmount` branch + assertions
2. D3a invariant probe — no behavioural path reads display copy
3. D3b consistency assertion — headline rate exists in the rate card
4. D2 `label?: string` on `TenureRate`
5. D4 remove `DepositTerms.tenureMonths`, update `formatSelectedTenure`
6. D9 rate-card uniqueness in the data contract + assertion
7. Gates: unit · invariants · boundaries · typecheck · prettier

**Stage 2 — T3.2.10, on receipt of Q1**
Tenure selector per the readiness package's behaviour matrix, minus the "7 Days"
and Custom cases pending Q2.

**Stage 3 — before MVP**
D6 `compoundingFrequency`; value date and maturity date; applied-rate capture
before Review & Confirm.

**Stage 4 — R1**
D7 `RateQuote`; `rates.ts` consolidation; TD-001 repayment. Per
`shared-finance-layer.md`, scheduled after Booking and before Portfolio.

---

## 11. Recommendation

**Approve.** Stage 1 is ninety minutes and closes both live defects. Stage 2
begins the moment one row of rate data exists.

The alternative on the table — the prior review's twelve modifications — would
spend one to two days hardening booking configuration for banks the platform has
not signed, on a POC whose headline differentiator has not been built. That
trade was already argued against, in writing, by the same author, as risk R-F3.
