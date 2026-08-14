# Investor Demo Conformance Audit

**Source of truth:** `docs/engineering/FD_PoC_Rule_Based_Use_Cases_for_Founding_Tech_Team.pdf`
**Method:** code, data, UI and verification traced end to end. Nothing marked complete because a function or fixture exists.
**Date of audit:** 2026-08-13 · **Verdict: 🔴 NOT DEMO READY** (see §F)

---

## A. Requirement-by-requirement

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Home → Goal Planner | ✅ | `GOAL_ENTRIES.href` → `/goal-planner?goal=<id>`; route renders `GoalPlannerScreen`. Unit-asserted: *"the Home callout names the same three goals as the planner"* |
| 2 | Goal intent preservation | ✅ | `parseGoalParam` narrows → `usePlannerFlow(initialGoal)` starts at `amount`, seeds `answers.goalType`, `GoalStep` never renders. Unit-asserted per entry |
| 3 | Senior citizen input | ❌ | Not in `GoalInput`. No UI collects it. UC1's defining input is absent |
| 4 | Senior rate resolution | 🔴 → **decision** | `BLOCKED_RULES` R-ELIG-001 declares it unevaluated because the catalogue carries `BENEFITS.senior` as a **display label**. **But the client document itself states the 0.50% benefit** — see §C-1 |
| 5 | UC1 ₹5L / 730-day recommendation | ⚠️ | The engine *does* return a 24-month deposit for ₹5,00,000 — traced: `fd-003` Kotak, 24mo, 7.4% + 0.1 slab = **7.50%**. Coincidentally the document's effective rate, but a different bank and **no senior mechanism**. Never verified against the document's expected output |
| 6 | Multi-goal input | ❌ | `usePlannerFlow` holds exactly one `goalType`. No multi-goal session exists |
| 7 | ₹25L allocation | ❌ | No allocation engine, no allocation type, no allocation UI |
| 8 | Emergency / Education / Retirement allocations | ❌ | Follows from 6 and 7 |
| 9 | Education split across two banks | 🔴 | `§11.diversification` in `BLOCKED_RULES` — no concentration limit configured. §11 requires it come from configured business rules |
| 10 | Target amount input | ❌ | `GoalInput.targetAmount` exists and is **always `undefined`** — `usePlannerFlow` never sets it |
| 11 | ₹20L → ₹27L / 5-year scenario | ❌ | Two independent blockers: no target input, and **no 5-year product** — catalogue `TENURE_CYCLE` maxes at 36 months |
| 12 | Four-bank allocation | 🔴 | Same blocker as 9 |
| 13 | Target achieved / shortfall handling | ⚠️ | `assessTarget` + `targetReason` + `TARGET_ADJUSTMENTS` are complete and match the document's three remedies **verbatim**. All of it is **unreachable code** — the two target lines in `BestFitCard` can never render |
| 14 | Safety note at recommendation | ✅ | `SafetyNote` rendered in `BestFitCard`, present at first paint, invariant-asserted to carry no entrance animation |
| 15 | Safety note at booking | ❌ | Booking's `importantInformation` covers **rate variability only**. No deposit-insurance or coverage note on any Booking screen. The document requires it *"at recommendation **and** booking"* |
| 16 | Every recommended product has a valid Booking handoff | ❌ **critical** | `BOOKING_OVERVIEWS_BY_PRODUCT_ID` holds **one** entry (`fd-002`). The planner recommends from all 24 catalogue products → **23 of 24 handoffs hit Booking's not-found boundary**. See §B |
| 17 | Rate authority / calculation boundaries | ✅ | `resolveProductRate` → `RateQuote` is the single rate authority; `selectCandidates` drops an unpriceable product rather than defaulting. Invariant-asserted: no rate literal, no `?? rate` fallback anywhere in the module |
| 18 | No financial calculations duplicated in UI | ✅ | Grep across `goal-based-fd/components` and `booking/components` returns **zero** arithmetic outside comments. Every figure arrives formatted from the engine |
| 19 | Marketplace architecture intact | ✅ | 15/15 boundary checks pass; no Marketplace file imports the goal module; `GoalPlannerCallout` still server-rendered |
| 20 | Day 1–7 functionality green | ⚠️ **unverified** | Unit and journey suites **cannot execute in this environment** — `node_modules` carries Windows-built esbuild and SWC binaries. Static layers pass; behavioural layers unrun. See §E |

---

## B. UC1 / UC2 / UC3 end-to-end status

### UC1 — Senior Citizen · 🔴 NOT DEMONSTRABLE

Traced with the document's inputs (₹5,00,000 · 730 days · senior citizen · no liquidity need):

```
Home → goal column        ✅ works
?goal= carried            ✅ works
Amount ₹5,00,000          ✅ accepted
Horizon 24 months         ✅ preset exists
Customer type: senior     ❌ never asked
Recommendation            ⚠️ Kotak 24mo @ 7.50% — not Axis, no 7.00% + 0.50% breakdown
Safety note               ✅ shown
"Continue with this FD"   ❌ fd-003 → /booking/fd-003/overview → NOT FOUND
```

The journey **dead-ends at the call to action**. The demo cannot reach Booking.

### UC2 — Multi-Goal Allocation · 🔴 NOT DEMONSTRABLE

Nothing of this use case exists. One goal per session, no per-goal amounts, no allocation, no split. It cannot be shown at all — not partially, not with caveats.

### UC3 — Target Maturity · 🔴 NOT DEMONSTRABLE

The engine half is finished and correct; the input half does not exist, so no target is ever set and the entire branch is dead code. Separately, the catalogue has no 5-year product, so even with an input the document's scenario cannot be reproduced.

---

## C. Remaining gaps

### C-1 · The senior-citizen delta is **not** actually blocked — it is a decision

`BLOCKED_RULES` R-ELIG-001 says the benefit cannot be applied because the catalogue publishes it as a display label and *"R-ELIG-001 itself forbids inventing one."* That reasoning was correct when written.

**It is now out of date.** The client source document states the figure directly:

> Base rate 7.00% · Senior citizen benefit **0.50%** · Effective rate 7.50%

Adopting 0.50% from the source document is **sourcing a value, not inventing one**. This is the single highest-value unblock available, and it converts UC1 from undemonstrable to demonstrable.

**Decision required:** may the documented 0.50% be encoded as demo catalogue data, labelled as sample input like every other rate in this PoC?

### C-2 · Booking handoff — 23 of 24 recommendations 404 · **demo-fatal**

Already documented in `booking-overview.ts` as a known data gap, and it fails safely rather than showing the wrong deposit. But *"fails safely"* is still a dead end at the demo's most important click.

The repository is explicit that filling in the other 23 would mean inventing `maxInvestment`, `tenureRange`, payout options and partner copy. **So none of the following may be chosen silently — this is a decision:**

| Option | Invents data? | Demo effect |
|---|---|---|
| **a.** Recommendations link to the Marketplace product page when a deposit is not bookable | No | Journey continues, ends on a real product page instead of Booking |
| **b.** Resolve Booking from the shared product master | No | Correct architecture, but changes every figure on the approved Booking artwork |
| **c.** Author Booking overviews for the demo products | **Yes** | Full journey, at the cost of fabricated terms |
| **d.** Ship as is | No | The demo dead-ends |

**Recommendation: (a) for the demo, (b) as the real fix.** Neither invents a figure.

### C-3 · Concentration limit — blocks UC2 and UC3

The document caps at ₹5,00,000 per bank in both use cases but never states the rule. Percentage? Absolute? Per bank category? **Client decision.** Without it, allocation cannot be built without inventing the limit.

### C-4 · Missing, unblocked, and buildable

| Gap | Effort | Blocks |
|---|---|---|
| Target amount input + gap/remedies display | Small — engine complete | UC3 |
| Deposit-coverage note on Booking screens | Very small — copy | Requirement 15 |
| Senior-citizen input + effective-rate display | Medium — needs C-1 | UC1 |
| Multi-goal session | Large | UC2 |
| 5-year catalogue products | Small, but is **sample data authorship** | UC3 |

---

## D. Files that need modification

| Gap | Files |
|---|---|
| C-1 senior benefit | `src/mocks/data/products.ts` (delta as data) · `src/types/product-master.ts` · `src/services/product-master/product-master-mapper.ts` · `src/utils/finance/rates.ts` (`RateCriteria.isSenior`) · `src/modules/goal-based-fd/types/goal.ts` · `use-planner-flow.ts` · new `senior-step.tsx` · `constants/blocked-rules.ts` (**delete** R-ELIG-001, never default it) |
| C-2 handoff | `src/modules/goal-based-fd/utils/booking-handoff.ts` · `best-fit-card.tsx` · `compact-recommendation-card.tsx` |
| C-4 target | `types/goal.ts` · `use-planner-flow.ts` · new `target-step.tsx` · `best-fit-card.tsx` · `constants/presentation.ts` |
| C-4 booking note | `src/modules/booking/fixtures/booking-overview.ts` · `important-information.tsx` |
| Verification | `verification/suites/units.mjs` · `invariants.mjs` · `journeys.mjs` |

---

## E. Verification commands and results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | ✅ **clean** |
| `node verification/run.mjs invariants` | ✅ **718 passed, 0 failed** |
| `node verification/run.mjs boundaries` | ✅ **15 passed, 0 failed** |
| `npx prettier --check "src/**/*.{ts,tsx,css}" "verification/**/*.mjs"` | ✅ **clean** |
| `node verification/run.mjs unit` | ⚠️ **cannot execute** — esbuild binary is `@esbuild/win32-x64`; Linux needs `@esbuild/linux-x64` |
| `node verification/run.mjs journeys` | ⚠️ **cannot execute** — same cause |
| `npx next build` | ⚠️ **cannot execute** — SWC binary platform mismatch |
| `npm run lint` | ⚠️ **not run** — documented as unable to complete in the audit environment |

**These must be run on the Windows development machine before the demo.** Requirement 20 is unverified until they are — the static layers prove structure, not behaviour.

---

## F. Verdict

# 🔴 NOT DEMO READY

**One blocker is fatal on its own:** the Goal Planner's primary call to action leads to a not-found page for 23 of 24 possible recommendations (§C-2). The demo cannot complete a single end-to-end journey from Home to Booking except by coincidence.

**Beyond that, two of the three use cases do not exist:** UC2 has no multi-goal input and no allocation; UC3 has no target input. Neither can be shown in any form.

### What is genuinely strong

Worth stating plainly, because it is most of the work: the rule engine, ranking, explanation, rate authority and calculation boundaries are correct, well-factored and heavily asserted. No rate is invented, no figure is duplicated in the UI, and every gap is *declared* to the customer rather than hidden. The demo is not far from ready — it is blocked on a fixture, an input, and two client decisions.

### Shortest path to DEMO READY

| Order | Action | Blocked on |
|---|---|---|
| 1 | Fix the Booking handoff — §C-2 option (a) | **Your decision** |
| 2 | Deposit-coverage note on Booking | Nothing |
| 3 | Target amount input — makes UC3 demonstrable | Nothing |
| 4 | Senior-citizen input + 0.50% from the document — makes UC1 demonstrable | **Your decision** (§C-1) |
| 5 | Run unit + journey suites on Windows | Nothing |
| 6 | Multi-goal + allocation — makes UC2 demonstrable | **Client decision** (§C-3) |

Steps 1–5 make **UC1 and UC3** demonstrable end to end. UC2 cannot be reached without the client's concentration limit.
