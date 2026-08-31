# AI Phase 1 — Explainable FD Intelligence

**UX and technical contract. Design only — nothing here is implemented.**

**Date:** 30 August 2026
**Precedes:** any AI provider, SDK, key or model call.

---

## 0. The finding that shapes this entire specification

I ran the real engine against the real catalogue before designing anything. Here is genuine output for *education, ₹2,00,000, 24 months*:

```
candidatesConsidered: 26     recommendations: 24     blockedRules: 6

BEST — Kotak Mahindra Bank Fixed Deposit · 7.4% · 24 months · ₹2,31,589 at maturity
reasons:
  R-TENURE-001        The 24 months term matches your 24 months horizon exactly.
  R-GOAL-002          A 24 months term is the closest available match to your 24 months education horizon.
  §8.investment-amount Your ₹2,00,000 clears this product's ₹50,000 minimum.
  §8.tenure-constraints Priced at 7.4% for 24 months, the rate this product publishes for your amount.
warnings: (none)
```

**The engine already produces finished, readable, figure-bearing English prose, each sentence tied to a rule id.** It is not emitting tokens, codes or fragments that need a model to assemble.

That changes the shape of Phase 1 completely:

> **The explanation feature is mostly not an AI feature.** Levels 2 and 3 are pure UI over data that already exists. AI is genuinely needed in only two places: simplifying to a first-timer's reading level, and answering follow-up questions.

Three consequences, and they are the backbone of everything below:

1. **Build the deterministic explanation panel first.** It is shippable on its own, has zero model risk, and is most of the customer value.
2. **"AI provider unavailable" stops being a failure state.** It degrades to Level 2 — which is complete, accurate and useful. That is a far better resilience story than any retry policy.
3. **The AI surface is small enough to validate exhaustively.** A model that may only re-word a fixed set of sentences, and may never introduce a figure, is a tractable safety problem.

---

## A. Product decision

**Build Phase 1 — with the scope split explicitly into two shipments.**

| Shipment | Contents | AI? | Risk |
|---|---|---|---|
| **1a — Explanation panel** | "Why this FD?" surface rendering existing `reasons`, `warnings`, `blockedRules`, quote provenance and figures, at Levels 2 and 3 | **No** | Very low |
| **1b — Plain-language layer + follow-ups** | Level 1 simplification; a bounded set of follow-up questions | **Yes** | Medium, bounded by §I |

Ship 1a first. Do not begin 1b until 1a is in the product and the validation harness in §I exists.

**Why this is worth building at all:** the platform already computes an unusually complete justification and currently discards most of it at the UI boundary. `ReasonList` renders `RULE_LABELS[reason.ruleId]` — a four-word chip — and only shows `reason.text` when a `detailed` prop is set. `blockedRules` renders in a single collapsed `<details>` labelled *"What this plan doesn't yet consider"*, and appears **nowhere else in the product**. The intelligence exists; the customer cannot reach it.

---

## B. User problem

| Persona | What they cannot do today |
|---|---|
| First-timer | Understand *why* a deposit was chosen. The chips read "Matches your timeline exactly" — true, but not an explanation. |
| Investor | See the trade-off against the alternative below it, without opening both cards and comparing by eye. |
| Ex-RBI / sceptic | Find out what the engine **could not** evaluate. It is in a collapsed `<details>` at the foot of the page, after the CTA. |
| Everyone | Ask a question about the recommendation in their own words. |

**The inconvenience removed:** the customer currently has to *infer* the reasoning from four rule chips and a maturity figure, and has no way to discover the six rules that never ran.

---

## C. Existing data available for an explanation — verified, field by field

### Available and complete

| Structure | Fields | Notes |
|---|---|---|
| `GoalRecommendationResult` | `recommendations[]`, `candidatesConsidered: number`, `warnings[]`, `blockedRules[]` | `candidatesConsidered` is a **count only** |
| `Recommendation` | `productId`, `goalType`, `product: ProductMaster`, `principal`, `tenureMonths`, `quote`, `maturity \| null`, `target?`, `reasons[]`, `warnings[]` | Every surviving candidate becomes one — **the list is ranked, not truncated** (24 of 26 in the sample) |
| `RecommendationReason` | `{ ruleId: RuleId; text: string }` | `text` is a finished sentence with figures already formatted |
| `RecommendationWarning` | `{ kind: 'limitation' \| 'blocked-rule'; ruleId?: RuleId \| BlockedRuleId; text: string }` | |
| `BlockedRule` | `{ ruleId: BlockedRuleId; intent: string; missingData: string }` | Six entries, **constant** — identical on every result |
| `RuleId` | Closed union, 12 members | `RULE_LABELS` is exhaustive over it |
| `BlockedRuleId` | Closed union, 6 members | **No label map exists** — only `intent` + `missingData` |
| `RateQuote` | `{ annualRate: number; tenureMonths: number }` | The band the quote came from. **Nothing else** |
| `MaturityResult` | `{ principal, interestEarned, maturityValue }` | `null` for day-published terms |
| `TargetAssessment` | `{ targetAmount, achieved, gap }` | Present only if a target was set |
| `DemoTermId[]` | On `SelectedDeposit` in **Booking**, not on `Recommendation` | See gap below |
| `DataProvenanceNote` | Two tones: `catalogue`, `booking` | Shared component, already on Home / Product Details / Booking |
| `SafetyNote` | Single coverage sentence | Already rendered inside `BestFitCard` |

### Confirmed absent — must not be designed around

| Missing | Consequence |
|---|---|
| **Per-product rejection reasons** | `selectCandidates` uses `continue` at three points and discards the cause. "Why not HDFC?" is unanswerable for an excluded product. |
| **Rate effective date** | `RateQuote` carries no `asOf`, `effectiveFrom`, `bandId` or `dayCountBasis`. Its own doc comment records these "do not exist anywhere in this repository". |
| **`blockedRules` variation** | Always the same six, regardless of goal, amount or product. It is a statement about the *engine*, never about *this* recommendation. |
| **`DemoTermId` on recommendations** | The demo-term marker exists in Booking only. A planner recommendation cannot currently say which of its terms are placeholders. |
| **Reasons on Product Details / Comparison** | Neither surface has `reasons[]`, `warnings[]` or `blockedRules[]`. `ProductDetails` carries `trustIndicators`, `eligibility`, `interestBreakdown`, `faqs[]`, `terms[]` — none of which is a decision rationale. |

**Scope consequence:** "Why this FD?" belongs on **Goal Planner results only** in Phase 1. Placing it on Product Details or Comparison would require inventing a rationale — exactly what this feature exists to prevent.

### One conflict to resolve before implementation

Two shipped invariants assert that **no rule id reaches the screen** — a loop over every `goal-based-fd` component plus an explicit five-file check. The brief's Level 3 asks to expose "Rule ID / rule description".

These are in direct conflict. **Do not silently break the invariant.** Recommended resolution: amend it to permit rule ids inside the explanation surface only, with the rationale recorded in the invariant itself ("ids are engine vocabulary and stay off the primary UI; the provenance panel is where a sophisticated user deliberately goes to see them"). Everything else stays covered. This is a decision for the reviewer, not a detail to absorb during implementation.

---

## D. UX concept

### Naming — Option B for the trigger, Option C for the panel

| Option | Verdict |
|---|---|
| A · 🤖 AI Assistant | **Reject.** Advertises the mechanism, claims authority from the technology, and is *inaccurate* — most of the panel is deterministic. |
| B · **Why this FD?** | **Adopt as trigger.** It is the customer's actual question. |
| C · **How we reached this** | **Adopt as panel title.** Says "we", the platform — the responsible party. |
| D · Explain this recommendation | Reject — "recommendation" is product vocabulary; "this FD" is the customer's. |

**No AI branding anywhere in the surface.** Where a sentence was re-worded by a model, the panel says *"Simplified — the full wording is in Standard view"*. That is a statement about what happened, not a badge.

### The panel

```
┌─────────────────────────────────────────────────────────┐
│  How we reached this                          [Close ×] │
│  Kotak Mahindra Bank Fixed Deposit                      │
│                                                          │
│  ┌ Simple ─┬─ Standard ─┬─ Detailed ┐   ← level control  │
│                                                          │
│  WHAT YOU TOLD US                                        │
│    Goal          Children's education                    │
│    Amount        ₹2,00,000                               │
│    Timeline      24 months                               │
│    Senior rates  Not applicable                          │
│                                                          │
│  WHY THIS ONE                            (from reasons[])│
│    ✓ The 24 months term matches your 24 months           │
│      horizon exactly.                                    │
│    ✓ A 24 months term is the closest available match     │
│      to your 24 months education horizon.                │
│    ✓ Your ₹2,00,000 clears this product's ₹50,000        │
│      minimum.                                            │
│    ✓ Priced at 7.4% for 24 months, the rate this         │
│      product publishes for your amount.                  │
│                                                          │
│  WHAT WE CALCULATED                        (deterministic)│
│    Estimated maturity   ₹2,31,589                        │
│    Estimated interest   ₹31,589                          │
│    Calculated by the platform from the rate, term and    │
│    your amount. Quarterly compounding.                   │
│                                                          │
│  WHAT WE COULD NOT CHECK                (from blockedRules)│
│    6 checks did not run because the data isn't          │
│    published. ▸                                          │
│                                                          │
│  WHERE THIS CAME FROM                                    │
│    [DataProvenanceNote]                                  │
│    [SafetyNote]                                          │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  Ask about this          (1b only)                       │
│   · What did you not consider?                           │
│   · Why not the Axis Bank one?                           │
│   · Why does the term matter?                            │
└─────────────────────────────────────────────────────────┘
```

**Four blocks in a deliberate order**, and the order *is* the provenance model: what **you** told us → why **the rules** chose it → what **we** calculated → what we **could not** check. A customer who reads top to bottom has been told the basis of every number before being told what is missing.

### Placement

`BestFitCard` already ends with a `CardFooter` containing the CTA and the line *"Rate and maturity are confirmed on the booking screen."* The trigger goes **directly above that footer**, after `ReasonList` — so the sequence reads: here are the reasons → *want the full basis?* → here is the action.

Each `CompactRecommendationCard` gets the same trigger (secondary weight). Every alternative has a complete `Recommendation` object, so every one can be explained.

**Not on** Product Details, Comparison, Booking, Portfolio, Marketplace — none of them holds a rationale.

---

## E. Three levels — same facts, different depth

The level control changes **presentation depth only**. A fact visible at Level 1 is present at Levels 2 and 3; no fact appears at a higher level that contradicts a lower one.

### Level 1 — Simple *(the only level needing AI)*

Target: first-time depositor. 3–4 short sentences, no jargon, no rule references.

> You're saving for education and you need the money in about two years. This deposit runs for exactly two years, so it matures right when you need it.
>
> Your ₹2,00,000 is above this bank's ₹50,000 minimum, and at 7.4% a year the platform estimates it becomes about **₹2,31,589**.
>
> Six checks didn't run because the information isn't published — tap below to see which.

Constraints: every figure passed through by reference; no reason invented; nothing dropped that changes the meaning; the blocked-rule count stated, never omitted.

### Level 2 — Standard *(no AI — the default)*

`reason.text` verbatim, plus the calculated figures, plus the blocked-rule summary. This is the engine's own wording. Because it needs no model, it is what the panel shows when AI is unavailable, disabled, or when the customer opens the panel before a model responds.

### Level 3 — Detailed *(no AI)*

Adds, for the reader who wants the machinery:

- Rule reference per line (`R-TENURE-001`, `§8.investment-amount`) — subject to the invariant amendment in §C
- Rate provenance: `7.4% — quoted from this product's 24-month band` (from `RateQuote.tenureMonths`)
- Calculation reference: `calculateDepositReturns · quarterly compounding · principal ₹2,00,000 · 7.4% · 24 months`
- Ranking position: `1 of 24 that fit; 26 products considered`
- Each blocked rule in full: `intent` + `missingData`, unabbreviated
- Assumptions stated plainly: *the catalogue publishes no effective date for this rate*; *premature-withdrawal terms are not published*

---

## F. "What we could not check"

The most important block, and the one most easily made frightening.

**Framing rules:**

1. **Heading:** "What we could not check" — not "Limitations", "Warnings", "Risks" or "Gaps". It states an absence of *checking*, not a defect in the deposit.
2. **Collapsed by default, with a count.** `6 checks did not run because the data isn't published. ▸` A count invites; six paragraphs of engine vocabulary alarm.
3. **Lead with the intent, not the failure.** Each row is `intent` (what the check would do) then `missingData` (why it couldn't). The existing `<details>` already does this — reuse the pattern.
4. **Never a probability, severity or score.** No red. No warning triangle. Neutral type at caption weight, same treatment as `SafetyNote`.
5. **One honest reassurance, stated once:** *"These are checks the platform could not run, not problems with this deposit."* That sentence is factually true and is what stops the block reading as an alarm.

**AI's role here is strictly bounded:** at Level 1 it may *summarise the set* ("mostly about eligibility and early-withdrawal terms the catalogue doesn't publish"). It may never characterise a missing check as unimportant, unlikely to matter, or safe to ignore — and it may never convert an absence into an assumption. The response validator (§I) rejects any output that references a blocked rule as though it had been evaluated.

**A limitation to state in the panel itself:** the six blocked rules are the same on every result. The panel must not imply they are specific to this deposit. Suggested Level 3 line: *"These six checks are unavailable for every product in the catalogue, not only this one."*

---

## G. Provenance design

**Chosen pattern: sectioned grouping, not inline labels.**

Inline per-figure badges were considered and rejected — a panel with a `[calculated]` chip beside every number is noisier than the numbers, and the customer reads the badge instead of the fact. Grouping by provenance class gives each figure its label from the block it sits in, at zero visual cost.

| Class | Block | Wording |
|---|---|---|
| User provided | *What you told us* | Played back verbatim |
| Rule outcome | *Why this one* | `reason.text`, tied to a rule |
| Platform calculated | *What we calculated* | "Calculated by the platform from the rate, term and your amount" |
| Catalogue data | Inline where it appears + `DataProvenanceNote` | "from the demonstration catalogue; not verified with the bank" |
| Institution provided | — | **Nothing today.** Not shown as an empty section; named at Level 3 as a source the platform does not yet have |
| Unavailable | *What we could not check* | `intent` + `missingData` |

Reuse `DataProvenanceNote` and `SafetyNote` unchanged. A fourth wording of the same statement is exactly the drift those components exist to prevent.

### No confidence scores

No percentage, no "high/medium/low", no star rating. The panel answers four questions — *what we know, what we calculated, what you told us, what we don't know* — and a confidence number would be a fabricated measurement about statements that are either grounded or absent. This is a hard product rule, testable by asserting no `%` appears outside a rate or a rule-derived figure.

---

## H. Interaction pattern and responsive behaviour

**Not a chatbot. Not a modal. An expandable, context-bound panel.**

| Breakpoint | Pattern | Rationale |
|---|---|---|
| **Mobile** (< 768) | **Bottom sheet**, ~85% height, drag-to-dismiss, focus trapped, page behind inert | Thumb-reachable; the recommendation stays visible behind it, preserving context |
| **Tablet** (768–1023) | **Inline expansion** inside the card | There is width for it; an overlay would be gratuitous |
| **Desktop** (≥ 1024) | **Inline expansion**, or a right side panel if the layout already has a rail | Never a modal — a modal implies a decision to make; this is reading |

**Context is inherited, never asked.** The trigger sits inside the card, so the surface receives that `Recommendation` object. The customer never identifies which FD they mean — the question *"why not the Axis one?"* resolves against a list already in scope.

Follow-ups (1b) are **suggested chips, not a free-text box on first open.** Three or four generated from what the data can actually answer. Free text may be offered afterwards, and every unsupported question gets the refusal in §J. Chips-first is what keeps this from becoming a chatbot: the affordance advertises the boundary.

**Accessibility:** the trigger is a `<button>` with `aria-expanded`; the panel is labelled by the product name; the level control is a radio group, not tabs, because it selects depth rather than navigating; the sheet returns focus to the trigger on close. Every level is reachable without JavaScript-dependent animation.

---

## I. Follow-up questions — what can actually be answered

| Question | Answerable now? | Basis | Who answers |
|---|---|---|---|
| *"Why this FD?"* | **Yes** | `reasons[]` | Panel (deterministic); AI simplifies at L1 |
| *"What did you not consider?"* | **Yes** | `blockedRules[]` | Panel (deterministic); AI summarises at L1 |
| *"Why not the Axis Bank one?"* | **Yes — for any product in `recommendations[]`** | Both `Recommendation` objects are in the result: two reason sets, two quotes, two maturities | **Deterministic comparison**, AI narrates |
| *"Why not HDFC?"* (excluded product) | **No** | `selectCandidates` discards the exclusion cause | **Refuse — see below** |
| *"Why does the term matter?"* | **Yes** | Goal rule + `RULE_LABELS` + the goal's own acknowledgement copy | AI explains from rule text |
| *"What would change this recommendation?"* | **Partly** | Can state which inputs the rules used (amount, horizon, senior status). **Cannot** simulate an outcome | AI states the levers; **must not** predict a different result |
| *"Is this rate good?"* | **No** | No benchmark, no market data | Refuse; offer the deterministic comparison instead |
| *"Is this bank safe?"* | **Never** | Ratings are fixture strings | Refuse — see §J |
| *"What if I withdraw early?"* | **No** | `§8.availability` / premature-withdrawal terms unpublished | Refuse, citing the blocked rule |
| *"How much tax will I pay?"* | **Never** | Tax module deliberately holds no slab, TDS or liability | Refuse |

### "Why not HDFC?" — the designed refusal

The engine considered 26 products and recommended 24. The two excluded (Equitas 91-day, DBS 374-day) were dropped because their published term is in days and cannot be compared with a month horizon — but **`selectCandidates` does not record that**, so the platform cannot state it for any specific product.

The panel must therefore answer:

> **We can't tell you that.**
>
> HDFC Bank isn't among the 24 deposits that fit this plan, and the platform doesn't record *why* a product was set aside — only that 26 were considered.
>
> What we can show you is any deposit that did fit. [Compare with the alternatives →]

Three things this does: refuses specifically rather than vaguely; states the true numbers (26 considered, 24 fit); redirects to something real. **No AI may generate a plausible-sounding reason here.** The validator rejects any response naming a product outside `recommendations[]` alongside a causal claim.

**Phase 2 unblocks this properly** — `selectCandidates` returns `excluded: { productId, cause: 'below-minimum' | 'tenure-incomparable' | 'unpriceable' }[]`. That is a small, additive engine change with no effect on ranking. It is **not** in Phase 1 scope and must not be smuggled in.

---

## J. Limitation, refusal and failure states

| Condition | Behaviour |
|---|---|
| **No reasons** (cannot occur today — `buildReasons` always emits ≥ 2) | Panel shows the calculated figures and blocked rules; states that no rule-level reasoning was recorded. Never fabricates one. |
| **Only warnings, no reasons** | Warnings render in their own block, headed *"What to keep in mind"*. A warning is never re-framed as a reason. |
| **Blocked rules present** (always) | Always rendered, always collapsed, always counted. |
| **`maturity === null`** (day-published term) | The *What we calculated* block states no maturity is shown and why — the existing warning text already says this. AI must not estimate one. |
| **AI unavailable / times out / errors** | **Panel opens at Level 2 and stays fully functional.** The Simple tab shows: *"Plain-language summary isn't available right now. The full explanation is below."* No spinner blocking content, no error dialog. |
| **AI returns an invalid response** (validator rejects) | Identical to unavailable. The rejection is logged with the reason. The customer never sees a partially-validated answer. |
| **Unsupported question** | Specific refusal naming what is missing, plus one deterministic alternative. Never *"I can't help with that."* |
| **Out-of-scope question** (weather, other customers, advice) | Single-line refusal, no engagement, no apology loop. |

**Governing principle:** the deterministic explanation is the product. AI is an enhancement to it. There is no state in which an AI failure removes information the customer could otherwise see.

---

## K. Technical contract

### Existing types — reused unchanged, no modification proposed

`GoalRecommendationResult`, `Recommendation`, `RecommendationReason`, `RecommendationWarning`, `BlockedRule`, `RuleId`, `BlockedRuleId`, `RateQuote`, `MaturityResult`, `TargetAssessment`, `GoalInput`, `ProductMaster`.

### Proposed types — new, none exist today

```ts
/* ---------- Input: assembled deterministically, never by the model ---------- */

/** Everything the explanation needs, and nothing else. */
interface ExplanationRequest {
  level: 'simple' | 'standard' | 'detailed';

  /** What the customer answered. Played back, never re-derived. */
  input: {
    goalType: GoalType;
    goalLabel: string;
    principal: number;          // rupees
    horizonMonths: number;
    isSeniorCitizen: boolean;
    targetAmount?: number;
  };

  /** The recommendation being explained — a projection of `Recommendation`. */
  subject: {
    productId: string;
    productName: string;
    bankName: string;
    rankPosition: number;       // 1-based
    totalRecommended: number;
    candidatesConsidered: number;
    annualRate: number;
    quotedFromTenureMonths: number;   // RateQuote.tenureMonths
    tenureMonths: number;
    minInvestment: number;
    maturityValue: number | null;
    interestEarned: number | null;
    target?: { targetAmount: number; achieved: boolean; gap: number };
    reasons: readonly { ruleId: RuleId; label: string; text: string }[];
    warnings: readonly { kind: 'limitation' | 'blocked-rule'; text: string }[];
  };

  /** Present only for a comparison follow-up. Must be in `recommendations[]`. */
  comparedWith?: ExplanationRequest['subject'];

  blockedRules: readonly BlockedRule[];

  /** Bounded. Free text is validated against the supported set before dispatch. */
  question?:
    | 'why-this'
    | 'what-not-considered'
    | 'why-not-alternative'
    | 'why-tenure-matters'
    | 'what-would-change-this';
}
```

Note what is **absent by design**: no PAN, no masked identifiers, no bank account, no nominee, no holdings, no free-form catalogue dump. The model receives one recommendation, the customer's four answers, and the blocked rules.

```ts
/* ---------- Output ---------- */

type ProvenanceClass =
  | 'user-provided'
  | 'rule-outcome'
  | 'platform-calculated'
  | 'catalogue-data'
  | 'institution-provided'   // reserved; nothing today
  | 'unavailable';

/** One sentence, and where it is allowed to come from. */
interface GroundedClaim {
  text: string;
  provenance: ProvenanceClass;
  /** The rule it restates, when it restates one. */
  ruleId?: RuleId;
  /** Figures used, by reference. Each must match the request exactly. */
  figuresUsed: readonly {
    field: keyof ExplanationRequest['subject'] | 'principal' | 'horizonMonths';
    value: number;
  }[];
}

type ExplanationResponseType =
  | 'explanation'
  | 'comparison'
  | 'refusal'
  | 'clarification-needed';

type RefusalReason =
  | 'data-not-recorded'        // e.g. why a product was excluded
  | 'not-published'            // e.g. premature-withdrawal terms
  | 'outside-platform-scope'   // tax liability, bank safety
  | 'requires-advice'          // "should I"
  | 'unsupported-question';

interface ExplanationResponse {
  type: ExplanationResponseType;
  level: ExplanationRequest['level'];

  /** Ordered claims. Empty for a refusal. */
  claims: readonly GroundedClaim[];

  /** Every rule id the response draws on. Must be a subset of the request's. */
  referencedRuleIds: readonly RuleId[];

  /** Blocked rules the response mentions — as unevaluated, never as evaluated. */
  unavailable: readonly {
    ruleId: BlockedRuleId;
    intent: string;
    missingData: string;
  }[];

  warnings: readonly string[];

  refusal?: {
    reason: RefusalReason;
    /** What is missing, in the customer's words. */
    explanation: string;
    /** A real thing they can do instead. */
    alternative?: { label: string; action: 'compare' | 'open-product' | 'contact-support' };
  };

  /** Set when the deterministic fallback rendered instead of a model response. */
  degraded?: { cause: 'provider-unavailable' | 'validation-failed' | 'timeout' };
}
```

**No `confidence` field.** Deliberate, and §G says why.

---

## L. Validation architecture

The validator sits **between the model and the UI**, is deterministic, and **rejects rather than repairs**. A repaired response is one nobody reviewed.

| # | Check | Method | On failure |
|---|---|---|---|
| 1 | **Every figure is traceable** | Extract every currency/percentage/duration token from `claims[].text`; each must equal a value in `ExplanationRequest` after formatting | Reject |
| 2 | **No new rule** | `referencedRuleIds ⊆ request.subject.reasons[].ruleId` | Reject |
| 3 | **No blocked rule shown as evaluated** | No `BlockedRuleId` may appear in a `rule-outcome` claim; blocked rules only in `unavailable[]` | Reject |
| 4 | **Provenance present** | Every claim carries a `ProvenanceClass`; `platform-calculated` claims name a figure | Reject |
| 5 | **Demo data stays labelled** | Any claim citing a rate or bank attribute must be `catalogue-data`, and the panel renders `DataProvenanceNote` | Reject |
| 6 | **No advice language** | Deny-list on imperative financial phrasing — "you should", "best choice", "safest", "guaranteed", "risk-free", "we recommend you" | Reject |
| 7 | **No unsupported institutional claim** | Deny-list: "RBI verified", "DICGC covered", "insured", "AAA rated" as assertion rather than catalogue attribution | Reject |
| 8 | **No product outside the result set** | Any bank/product named must appear in `recommendations[]` — catches the invented "why not HDFC" answer | Reject |
| 9 | **No confidence expression** | No `%` unless it equals a rate in the request; no "likely/probably/should be fine" about outcomes | Reject |
| 10 | **Level integrity** | Simple must not contradict Standard: the set of `ruleId`s cited at L1 ⊆ those at L2 | Reject |

Rejection → `degraded: { cause: 'validation-failed' }` → Level 2 renders. The customer sees a complete explanation; the platform logs the rejection with the offending claim.

---

## M. Test strategy

The existing harness (`verification/run.mjs` — units, invariants, boundaries, journeys) covers this without new infrastructure.

**Unit — the validator, no model involved.** Feed hand-written `ExplanationResponse` fixtures and assert each of the ten checks fires: a figure that appears nowhere in the request; a `RuleId` not in `reasons[]`; a blocked rule cited as a reason; "this is the safest bank"; "your returns are guaranteed"; a bank not in `recommendations[]`; "AI confidence: 97%". Every one must reject. Because the validator is pure, this is ordinary unit testing.

**Unit — grounding fixtures from the real engine.** Snapshot `recommendForGoal` output for a fixed set of goals (the four in §N) and assert the `ExplanationRequest` projection is complete and carries no identifier, account or holding data.

**Invariants — static.** The explanation module names no institution; contains no hardcoded rate or currency literal; imports no financial calculator (it must not be able to compute); renders `DataProvenanceNote` and `SafetyNote`; contains no `confidence`; the deny-lists live in exactly one file.

**Journeys — DOM.** Open the panel from the best-fit card; assert all four blocks render; assert the blocked-rule block is present and collapsed with a count of 6; switch levels and assert the figures are byte-identical across all three; simulate provider-unavailable and assert Level 2 renders with no error dialog and no loss of content; ask an unsupported question and assert a specific refusal with an alternative.

**Adversarial — pre-release, manual, recorded.** A fixed prompt-injection set (a product name containing "ignore previous instructions", a goal label carrying an instruction) run against the validator with results recorded in the repo. Not automated in CI, but not optional either.

---

## N. Five realistic examples — all figures from the live engine

### 1 · Normal recommendation
**Input:** education · ₹2,00,000 · 24 months · standard rates
**Engine:** Kotak Mahindra Bank · 7.4% · 24 months · ₹2,31,589 · 4 reasons · 0 warnings · 24 of 26 fit

**Level 1:**
> You're saving for education and need the money in about two years. This deposit runs exactly two years, so it matures when you need it. Your ₹2,00,000 clears the bank's ₹50,000 minimum, and at 7.4% the platform estimates about **₹2,31,589** at maturity. Six checks didn't run because the information isn't published.

**Level 2:** the four `reason.text` sentences verbatim, then the calculated figures.
**Level 3:** adds `R-TENURE-001`, `R-GOAL-002`, `§8.investment-amount`, `§8.tenure-constraints`; *rate quoted from this product's 24-month band*; *1 of 24 that fit, 26 considered*; the six blocked rules in full.

### 2 · Recommendation carrying a warning
**Input:** emergency fund · ₹1,00,000 · 12 months
**Engine:** DBS Bank India · 7.6% · **6 months** · ₹1,03,836 · 4 reasons · **1 limitation warning**

> **What to keep in mind**
> This deposit matures in 6 months, before your 12 months horizon ends. Reinvesting afterwards is at rates not yet published.

**Level 1 must carry the warning, not bury it:**
> An emergency fund works best when you can reach it quickly, so the shorter six-month deposit was preferred. One thing to know: it matures at six months, halfway to your twelve-month timeline — and what you'd earn reinvesting after that isn't published yet.

Note the reason set here contains `R-GOAL-001` and `R-TENURE-003` but **no `R-ELIG-001`**, because DBS publishes no senior-citizen benefit. The panel says nothing about senior rates. That absence is correct and must not be narrated as "senior rates were considered and did not apply".

### 3 · Blocked rules
Identical on every result. Collapsed:

> **What we could not check** — 6 checks did not run because the data isn't published. ▸

Expanded (Level 2 wording, from `intent` + `missingData`):

> **Recommend only products the customer is eligible for.** Eligibility exists only on the product details payload and is identical for every product, so it cannot discriminate between candidates.
>
> **Filter out products whose maximum investment the allocation would exceed.** No maximum investment is published for catalogue products.
>
> *(four more)*
>
> These are checks the platform could not run, not problems with this deposit. They are unavailable for every product in the catalogue.

### 4 · "Why this FD?"
Opens the panel at the customer's last-used level. No model call at Level 2 or 3.

### 5 · "Why not the Axis Bank one?" — answerable
Both are in `recommendations[]`: Kotak 7.4% → ₹2,31,589; Axis 7% → ₹2,29,776. Identical reason sets apart from the rate line.

> Both fit your plan the same way — both run 24 months, matching your timeline exactly, and both accept ₹2,00,000.
>
> The difference is the rate. Kotak publishes 7.4% for this term against Axis's 7%, so the platform estimates **₹2,31,589** rather than **₹2,29,776** — about ₹1,813 more.
>
> Nothing else separated them. The checks that could not run are the same for both.

Deterministic comparison; AI narrates. Both figures by reference.

### 5b · "Why not HDFC?" — the refusal
> **We can't tell you that.** HDFC Bank isn't among the 24 deposits that fit this plan, and the platform doesn't record why a product was set aside — only that 26 were considered. What we can show you is any deposit that did fit. **[Compare the alternatives →]**

---

## O. Competitive differentiation

| Typical marketplace | This |
|---|---|
| "Best FD" | A ranking with the rule that produced it |
| "Highest rate" | The rate **and** what it was quoted from, and that rate alone did not decide |
| "AI recommends this FD" | The platform recommends it; here is the reasoning; here is what it could not check |

The differentiator is not that an explanation exists — it is that the explanation is **falsifiable**. Every line names a rule. Every figure names its calculator. And the product volunteers six things it could not evaluate, which no marketing-led competitor will copy, because disclosing gaps looks like weakness until a customer compares two platforms and notices only one of them is being straight with them.

**This is achievable here only because `blockedRules[]` was built as engine output before AI was on the roadmap.** A competitor adding an LLM to a ranking engine gets fluent explanations of decisions it cannot actually account for — which is worse than no explanation, because it is confidently unfalsifiable.

---

## P. What should NOT be built

- A global chatbot, an assistant avatar, or any persistent AI entry point
- AI on Product Details, Comparison, Marketplace, Booking, Portfolio or Tax
- AI-generated ratings, rankings, safety judgements or rate assessments
- Any AI-computed figure — the validator's first check exists to make this impossible
- Confidence scores or probability language
- Invented rejection reasons for excluded products
- Turning a blocked rule into an assumption, a reassurance, or a dismissal
- Free-text chat as the first affordance
- AI branding — no robot icon, no "powered by", no sparkle badge on a deterministic panel
- Any change to `engine.ts`, `explain.ts`, `candidates.ts`, `ranking.ts` or `calculateDepositReturns`

---

## Q. Exact scope for the next task

**Shipment 1a — deterministic, no AI, no SDK, no provider.**

1. `ExplanationRequest` projection built from an existing `Recommendation` + `GoalInput` (pure function, unit-tested).
2. Explanation panel component: four blocks, three levels, bottom sheet < 768 / inline ≥ 768.
3. Trigger in `BestFitCard` above the footer; secondary trigger in `CompactRecommendationCard`.
4. Reuse `DataProvenanceNote` and `SafetyNote`; add no fourth wording.
5. Level 1 rendered from a **deterministic template** for now — a placeholder the AI layer replaces in 1b, so the level control ships complete.
6. Move blocked rules into the panel; keep the page-level `<details>` until the panel is proven, then remove one of the two.
7. Invariant amendment for rule ids at Level 3 — **as a reviewed decision**, with rationale in the invariant.
8. Coverage: units for the projection, invariants for the module boundary and the no-calculator rule, a journey opening the panel and switching levels.

**Explicitly deferred to 1b:** provider selection, the model call, the validator, prompt design, follow-up questions, free text.

**Explicitly deferred to Phase 2:** `excluded[]` on `selectCandidates`; rate `effectiveFrom`; `DemoTermId` on recommendations.

**Definition of done for 1a:** a customer can open "How we reached this" on any recommendation, read it at three depths, see every figure attributed to what produced it, and see the six checks that did not run — with no AI in the product at all.

---

## Final note

The intended experience — *"I understand why this was shown to me, I can see what was considered, and I know what the platform could not evaluate"* — is achievable **today, without a model**, because the engine already produces all three. Phase 1a delivers it. Phase 1b makes it readable to someone who has never opened a fixed deposit before, and answerable in their own words.

Building it in that order means the feature is never dependent on a model for its correctness, only for its friendliness. That is the right dependency for a financial product.
