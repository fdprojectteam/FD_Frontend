# Client Source Conformance — Goal-Based FD

**Source of truth:** `docs/engineering/FD_PoC_Rule_Based_Use_Cases_for_Founding_Tech_Team.pdf`
**Purpose:** establish what the shipped module already satisfies, what is missing, and what is deliberately declared unevaluated — **before** any motion work proceeds.
**Scope:** review only. No business rule, rate, engine behaviour or recommendation logic is changed by this document.

---

## 1. The client's stated principle

> *"The prototype should communicate that the platform is recommendation-led and goal-led. It should help the depositor understand **why** a bank, tenor and allocation are suitable, rather than simply showing the highest rate."*

And on inputs:

> *"Rates and bank names below are **sample inputs for prototype demonstration only**. Before any production use, rates, eligibility, DICGC treatment, product terms and bank-specific conditions must be verified from official / partner-bank sources."*

Both are already the module's operating assumptions. `04-rule-engine.md` §16 forbids inventing rates, benefits or diversification limits, and `ReasonList` emits a sentence only for a rule that actually fired. **The client document validates the existing architecture rather than redirecting it.**

---

## 2. Use Case 1 — Senior Citizen FD

Client inputs: amount ₹5,00,000 · goal capital protection · horizon 2 years / 730 days · **customer type: senior citizen** · **liquidity need: not required before maturity** · product scope: Bank FD.
Client output: Axis Bank, 730 days, base 7.00% + senior benefit 0.50% = **effective 7.50%**, full allocation.

| Requirement | Status | Detail |
|---|---|---|
| Amount input | ✅ Working | `AmountStep` |
| Horizon input | ✅ Working | `HorizonStep`; 24 months is a preset |
| Goal input | ✅ Working | Three goals per `05-screen-specification.md` |
| Capital protection as a goal | ⚠️ By decision | `R-GOAL-004` treats capital protection as a property every FD has, not a selectable goal. Recorded in `types/goal.ts` |
| Customer type — senior citizen | ⛔ **Declared blocked** | `R-ELIG-001` in `BLOCKED_RULES`: the catalogue publishes *"Senior citizen +0.5%"* as a **display label, not a machine-readable rate delta**. §16 forbids inventing one |
| Liquidity need | ❌ **Not collected** | Not in `GoalInput`. For an emergency goal the tenure preference already encodes it, but it is not an explicit input |
| Base rate + benefit = effective rate | ⛔ Blocked with `R-ELIG-001` | The three-part rate display cannot be built without the delta |
| Explanation of *why* | ✅ Working | `buildReasons` emits horizon-match, goal-suitability and rate reasons, each carrying its rule id |
| **Safety note at recommendation** | ❌ **Missing** | See §5 — this is the most significant gap |

**Assessment.** UC1's distinguishing feature is the senior-citizen uplift, and it is correctly *declared* rather than faked — `BLOCKED_RULES` surfaces it to the customer under *"What this plan doesn't yet consider"*. That is the right behaviour under the client's own verify-before-production caveat. It becomes buildable the day the catalogue publishes the delta as data.

---

## 3. Use Case 2 — Multi-Goal Allocation

Client scenario: ₹25,00,000 across **three goals at once** — emergency ₹5L / 91 days, education ₹10L / 3 years, retirement ₹10L / 10 years — with education **split across two banks to reduce concentration**.

| Requirement | Status | Detail |
|---|---|---|
| Multiple goals in one session | ❌ **Not built** | `usePlannerFlow` holds exactly one `goalType`. This is the largest functional gap against the client document |
| Per-goal amount and timeline | ❌ Not built | Follows from the above |
| Allocation across banks | ⛔ **Declared blocked** | `§11.diversification` in `BLOCKED_RULES`: no concentration limit is configured, and §11 states the limit *"must come from configured business rules"* |
| Per-leg reason | ✅ Mechanism exists | `buildReasons` is per-candidate and already produces exactly the shape the client's Reason column needs |
| 10-year horizon | ⚠️ Partial | `HORIZON_PRESETS` tops out at 5 years; the catalogue's longest term is 24 months. `exceedsHorizon` already emits an honest limitation warning rather than hiding the gap |
| Explanation of the split | ❌ Blocked with allocation | The client's customer-facing paragraph is per-goal reasoning, which the engine can produce once allocation exists |

**Assessment.** Two distinct blockers, and they must not be conflated. The **multi-goal input** is not data-blocked — it is unbuilt product work. The **allocation split** is genuinely data-blocked on a configured concentration limit. Building a multi-goal planner that then concentrates each goal in one bank would satisfy neither the client nor the user.

---

## 4. Use Case 3 — Target Maturity in 5 Years

Client scenario: ₹20,00,000 → approximately ₹27,00,000 in 5 years, diversified across four banks.
Client requirement: *"calculate whether the suggested FD structure is likely to reach the ₹27 lakh target… If the target is not fully met, show a gap message and suggest increasing the amount, extending the tenure, or considering a different product mix."*

| Requirement | Status | Detail |
|---|---|---|
| Target amount input | ❌ **Missing — and not data-blocked** | `GoalInput.targetAmount` exists and is optional; `usePlannerFlow` never sets it, so it is always `undefined` |
| Target reached / not reached | ✅ Logic complete | `assessTarget` returns `{ targetAmount, achieved, gap }`; `R-TARGET-003` forbids claiming achievability when maturity is below target — a ₹1 shortfall is a shortfall |
| Gap message | ✅ Logic complete, ❌ unreachable UI | `targetReason` produces the sentence; `BestFitCard`'s two target lines are currently dead code |
| Suggested remedies | ✅ Present, ❌ rendered nowhere | `TARGET_ADJUSTMENTS` matches the client's three remedies **verbatim**: increase the amount, extend the horizon, split across more than one deposit |
| 5-year FDs | ⚠️ Catalogue gap | No 5-year product exists; the horizon preset does. The limitation warning fires honestly |
| Diversification across four banks | ⛔ Blocked | Same `§11.diversification` blocker as UC2 |

**Assessment — this is the highest-value gap in the module.** Everything below the UI is finished and matches the client document precisely. What is missing is a target input and a display block. It is the only client use case whose core mechanic is **not** data-blocked, and it is therefore the one item that should be prioritised on the 25-day plan.

---

## 5. Safety notes — a client-mandated display item that is missing

The client document states the requirement twice:

> UC1: *"Deposit insurance and product terms are subject to applicable rules and bank-specific conditions. The platform should display the coverage note **clearly at the time of recommendation and booking**."*

> UC2: *"Although Equitas and AU are Small Finance Banks, the recommendation should clearly show the applicable deposit-insurance note and concentration logic."*

**Current state:** DICGC trust indicators exist and render on Home (`home-hero`), Marketplace (`trust-badge-row`) and Booking (`booking-assurance-strip`). **They do not render in the Goal-Based FD recommendation.** `BestFitCard` shows engine warnings and the line *"Rate and maturity are confirmed on the booking screen"* — no deposit-insurance or coverage note.

So the coverage note appears at booking, and not at recommendation. The client asks for both.

| Item | Status |
|---|---|
| Coverage note at booking | ✅ Present |
| Coverage note **at recommendation** | ❌ **Missing — client-mandated** |
| Small Finance Bank designation surfaced | ❌ Not modelled on `Bank` |
| Concentration logic shown | ⛔ Blocked with allocation |

This is a **content gap, not a motion gap**, and it is small: the note is a static, product-level statement that already exists in `products.ts` (*"Deposits are insured up to ₹5,00,000 by DICGC."*). It should be added to the recommendation before any further motion work, because §6 of the motion specification now gives it a fixed, non-staggered position.

---

## 6. Summary — what to build, in order

| Priority | Item | Type | Blocked? |
|---|---|---|---|
| **1** | Deposit-insurance note in the recommendation | Content | No — client-mandated, small |
| **2** | Target amount input + gap display + `TARGET_ADJUSTMENTS` | Feature | No — engine already complete |
| **3** | Multi-goal session (UC2 input side) | Feature | No — but pointless without #5 |
| 4 | Liquidity-need input | Feature | No — low value; tenure preference partly encodes it |
| 5 | Allocation / concentration cap | Rule | ⛔ Needs a configured limit from the client |
| 6 | Senior-citizen rate delta | Rule | ⛔ Needs machine-readable catalogue data |
| 7 | 5- and 10-year products | Data | ⛔ Needs catalogue products |

**Two questions for the client**, both of which unblock the two remaining use cases:

1. What is the **concentration limit** — a percentage, an absolute cap per bank, or per-bank-category? UC2 caps education at ₹5,00,000 per bank and UC3 at ₹5,00,000 across four banks, which suggests a fixed cap, but the document does not state the rule.
2. Can the catalogue publish the **senior-citizen benefit as a rate delta** rather than a display label?

---

## 7. What this means for motion

Three consequences, carried into `docs/engineering/motion-architecture.md`:

1. **The safety note is never staggered in.** It is present at the recommendation's first paint. A client-mandated disclosure that arrives after the CTA is a disclosure that can be acted past.
2. **Allocation is first-class, not deferred.** Two of three use cases require it. Its reveal must make the *reason for the split* legible — the client's explicit principle — so the sequence is per-leg reason, not per-leg figure.
3. **The reveal order is validated by the client's own explanation paragraphs.** Each reads: what was chosen → what it costs/returns → why it suits the goal. That is the order the recommendation reveal already follows.
