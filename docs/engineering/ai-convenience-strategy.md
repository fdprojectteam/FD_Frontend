# AI convenience & intelligence strategy

**Date:** 30 August 2026
**Status:** discovery and architecture only. Nothing in this document is implemented, and nothing here should be implemented before the data gaps in §10 are closed.

---

## 1. Executive conclusion

> **Where can AI genuinely make this FD platform more convenient?**

In three places, and it is worth being blunt that the list is short.

**1. Explaining decisions the platform has already made.** This is the strongest and safest opportunity, and it is strong *because of an accident of how this codebase was built*: the recommendation engine already emits a structured `reasons[]` array where every reason carries a `RuleId` traceable to an approved document, plus `warnings[]` and — unusually — `blockedRules[]`, a machine-readable list of the rules it **could not** evaluate and the data that is missing. Almost no consumer product has this. It means an explanation layer can be grounded in facts the system genuinely holds rather than generated from a prompt, and it means the platform can say *"I cannot establish that"* with a citation.

**2. Turning a sentence into a filtered, priced query.** A customer thinking *"about a year, roughly a lakh, I might need it early"* currently has to translate that into a tenure chip, an amount preset, a rate band and a sort order. That translation is genuine, repeated, avoidable work. AI does the translation; the existing engine does the filtering and every rupee of arithmetic.

**3. Reading the portfolio back in plain language.** `buildMaturitySchedule` already classifies every holding as `scheduled` / `maturing-soon` / `matured` / `undated` and produces an `outlook` sentence; `summarisePortfolio` already totals principal, interest and maturity value; the tax module already allocates interest per tax year. The answers exist. What does not exist is a way to ask for them in a sentence.

**Everything else is weaker than the existing UI**, and §7 says so explicitly. In particular: amount entry, tenure selection, comparison tables, and every step of the booking flow are faster and safer as forms. A chatbot bolted over this product would make it worse.

**The single largest constraint, stated up front:** this platform holds **one** investor, whose portfolio contains **only deposits booked inside this application** (`recordHolding` is called from exactly one place — the booking success screen). There is no import, no manual FD entry, no bank integration, no document ingestion, and no rate timestamp anywhere in the codebase. That constraint eliminates most of what "AI for an existing FD depositor" would normally mean, and §3B is honest about it.

---

## 2. Current product capability map

Compiled by reading the domain types, stores, engines and fixtures — not from assumption.

### 2.1 What the platform knows about a user

| Data | Exists? | Source | Notes |
|---|---|---|---|
| Full name, DOB, mobile, email, address | Yes | `InvestorProfile` | One hard-coded investor. Not user-editable. |
| PAN / Aadhaar | **Masked only** | `InvestorIdentifier` | The type *cannot hold* a full number. Deliberate. |
| KYC status, method, verifiedAt, expiry | Yes | `InvestorIdentity.kyc` | Six methods declared; most are `not-connected`. |
| Senior-citizen status | Yes, transient | Goal planner answer | Asked per planning session; never persisted. |
| Holdings (deposits) | Yes | `PortfolioHolding[]` in `sessionStorage` | **Only deposits booked here.** Lost when the tab closes. |
| Funding bank accounts | Yes | `ExternalBankAccount` vault | Last four digits + IFSC. No full account number. |
| Nominee | Session only | Booking draft | Deliberately never persisted. |
| Goals | **No** | — | The planner is a stateless wizard. Nothing is saved. |
| Risk profile, income, tax slab, dependants | **No** | — | Never collected. |
| Family members | Demo fixture | `family-fixture.ts` | One demo spouse, labelled `isDemo`. |
| Support requests | Yes | `sessionStorage` | Simulated; author is `customer` or `platform`, never `agent`. |

### 2.2 What the platform can calculate

All deterministic, all pure, all already tested:

| Capability | Where | Notes |
|---|---|---|
| Deposit returns (quarterly compounding) | `calculateDepositReturns` | The single maturity authority. |
| Applicable rate from tenure + amount + senior status | `resolveProductRate` → `RateQuote` | Returns provenance: rate **and** the band it came from. |
| Maturity date, months until | `maturityDate`, `monthsUntil` | `null` for day-published terms — never approximated. |
| Portfolio totals | `summarisePortfolio` | Principal, interest, maturity value, active count. |
| Maturity schedule + stage + outlook sentence | `buildMaturitySchedule` | Four stages including `undated`. |
| Goal recommendation + ranking | `recommendForGoal` | With reasons, warnings, blocked rules. |
| Multi-goal allocation across banks | `recommendForPlan` | Equal-split legs, distinct banks, insurance-aware. |
| Emergency-fund reserve (10%) | `calculateEmergencyFundAmount` | The only derived allocation. |
| FD interest per tax year (day-count) | `allocateInterest` | Sums exactly to `calculateDepositReturns`. |
| Comparison rows + "best" qualifier | `buildCompareRows` | Up to 4 products. |
| Document projections | `buildReportCatalogue` | 4 platform-derived kinds + 1 bank-issued (unavailable). |
| Notifications | `deriveNotifications` | Derived from holdings; nothing stored but read state. |

### 2.3 What is static demonstration data

- **The entire catalogue.** 26 products, 10 banks. Six approved seeds carry client-document figures; 18 are generated from fixed rate/tenure cycles; DBS's rates are the platform's own demonstration figures because the DBS form publishes none.
- Bank ratings (`'AAA'`), trust indicators, DICGC labels — fixture strings, not verified.
- Rate slabs (`SLAB_DELTAS`) — explicitly marked placeholder.
- The demo family member, demo bank accounts, demo admin queue.

### 2.4 What is missing — and matters for AI

| Missing | Consequence for AI |
|---|---|
| **Rate effective dates / `asOf` timestamps** | AI can never answer "is this rate current?" `RateQuote` carries `annualRate` and `tenureMonths` only — the doc comment records that `effectiveFrom`, `bandId`, `dayCountBasis` and `compoundingFrequency` "do not exist anywhere in this repository". |
| **Any persistence beyond the session** | No memory across visits. No goal history. No "last time you told me…". |
| **A way to record an externally-held FD** | Persona B is structurally unserved. See §3B. |
| **Document ingestion** | No upload, no parser, no storage. Reports are *generated*, never *read*. |
| **Rejected-candidate reasons** | The engine returns `candidatesConsidered` as a **count**. It cannot say *why* a specific product was excluded — so "why not HDFC?" is unanswerable today. |
| **Product availability, max investment, premature-withdrawal terms** | Already declared as `blockedRules`. AI must inherit those blocks, not fill them. |
| **Tax slab / TDS** | Deliberately absent. `TaxYearSummary` carries no `taxPayable`, `taxRate`, `tdsAmount` or `taxableIncome`. |

---

## 3. Four-persona analysis

### Persona A — Investor: *"I have money. Why here?"*

**Real friction today.** The planner asks five questions in a fixed order and the customer must already know their horizon in months and whether they want a target. The marketplace requires translating an intention into four independent controls. The recommendation explains itself well — but only *after* the customer has navigated to it.

**Where AI helps:**

| Need | AI role | Deterministic role | Feasible now? |
|---|---|---|---|
| Express a goal naturally | Parse "₹2 lakh for a car in two years" → `{principal, horizonMonths, goalType?}` | `recommendForGoal` prices and ranks | **Yes** |
| Understand the allocation | Narrate the existing total → deposit → remainder breakdown | `calculateEmergencyFundAmount` | **Yes** |
| Understand a recommendation | Expand `reasons[]` into prose at the reader's level | Engine produced the reasons | **Yes** |
| Understand trade-offs | Compare two products on facts already in `buildCompareRows` | Comparison engine | **Yes** |
| Maturity planning | Summarise `buildMaturitySchedule` | Schedule + dates | **Yes** |
| "Which is safest?" | **Must refuse.** Ratings are fixture data | — | **No** |

**What AI must not do for this persona:** recommend an amount, assert that one bank is safer, or claim a return. The engine already refuses to invent rates; AI inherits that refusal.

### Persona B — Existing FD depositor: *"I already have FDs elsewhere."*

**This is the persona the current architecture serves least, and pretending otherwise would be the most damaging thing in this document.**

`recordHolding` is called from exactly one place: the booking success screen. There is no import path, no manual-entry form, no bank connection, no statement parser. **A customer with six FDs at three banks cannot get any of them into this product.** Every "AI for your existing FDs" idea therefore depends on a data-entry capability that does not exist.

Split honestly:

**Possible with current data — but only for deposits booked here:**

| Capability | Basis |
|---|---|
| "What matures next, and what happens then?" | `buildMaturitySchedule` + `maturityInstruction` (which is `null` when the bank's form did not ask — and the UI already says so) |
| "How much interest will I earn this financial year?" | `allocateInterest` per tax year |
| "Summarise my deposits" | `summarisePortfolio` |
| "Which deposits have no maturity instruction recorded?" | Holding field, already nullable and surfaced |

**Requires new capability — ordered by cost:**

1. **Manual FD entry** (bank, amount, rate, start date, tenure, payout). Cheapest by far, unlocks the entire persona, and every existing calculator works on it unchanged because `PortfolioHolding` does not care where a holding came from. **This is a prerequisite, not an AI feature.**
2. **Durable storage** — `sessionStorage` loses the portfolio when the tab closes.
3. **A `source` field on `PortfolioHolding`** (`booked-here` / `self-reported`) so nothing self-reported is ever presented with the confidence of a booked deposit.
4. Document ingestion (upload an FD advice, extract terms). Only *after* 1–3, and always as a **draft the customer confirms** — never as a fact.
5. Account aggregator / bank APIs. Out of scope for this platform's current posture.

**The honest AI opportunity for Persona B today** is the one that makes step 1 painless: *conversational FD capture*. "SBI, 2 lakh, 7.1%, started March, one year" → a filled form the customer checks and saves. AI does extraction; the customer confirms; deterministic code computes everything downstream. That is a real, safe, high-value use of AI — and it is worth noting it is valuable **precisely because typing six fields is the friction**, not because a chatbot is desirable.

### Persona C — Financially experienced / ex-RBI: *"Why should I trust this?"*

This persona is **already well served by the existing architecture**, and AI's job here is to expose what is present rather than to add anything.

The platform already carries: `RateQuote` with the band it was quoted from; `blockedRules[]` naming rules that did not run and the data missing; `DemoTermId[]` marking which terms on a deposit are placeholders; `DocumentAvailability` distinguishing platform-derived from bank-issued; `DataProvenanceNote` and `SafetyNote` stating what has and has not been verified.

**What AI adds:** an interrogation surface. *"What rate band produced this figure?"* — answerable from `RateQuote.tenureMonths`. *"What did you not consider?"* — answerable from `blockedRules`. *"Is this rate current?"* — **must answer "the catalogue carries no effective date; this is demonstration data"**, because that is true.

**The critical rule for this persona:** AI must never gain authority from being AI. The correct response to a question the data cannot support is a refusal with a reason, and this persona will test exactly that. A product that answers "which bank is safest?" with a hedge-free ranking loses this customer permanently; one that says *"I can tell you the rating recorded in the catalogue, and that this platform has not verified it with the agency"* keeps them.

### Persona D — Young / first-time depositor: *"I don't understand FDs."*

**Highest convenience upside, highest care required.**

Friction: the word "tenure"; not knowing that a rate is annual; not knowing what "cumulative" means; not knowing that ₹5,000 is enough to start; the planner's assumption that the customer can state a horizon in months.

| Need | AI role | Deterministic role |
|---|---|---|
| Terminology in plain words | Translate "cumulative", "tenure", "payout", "premature withdrawal" — grounded in the product's own fields | — |
| Guided goal capture | Ask one clarifying question at a time; map to `GoalInput` | Engine validates and prices |
| "Is this good?" | Explain what the figure means and what it depends on | Maturity engine produced the figure |
| "What if I need the money early?" | **Must qualify.** Premature-withdrawal terms are a `blockedRule` — the data is not there | — |

Note the constraint this persona creates: **the reading level of an explanation must change without the facts changing.** That is exactly the AI/deterministic split in §5 — one set of numbers, many possible narrations.

---

## 4. FD lifecycle opportunity map

| Stage | Existing friction | Realistic AI assistance | Data needed | Available now? | Depends on deterministic system | Risk if wrong | Value |
|---|---|---|---|---|---|---|---|
| **Discover** | Four filter controls + sort must be composed manually | Natural-language → filter params | Catalogue, filter vocabulary | **Yes** | Product filtering, `resolveProductRate` | Low — results are visible and checkable | **High** |
| **Understand** | "Cumulative", "tenure", "payout" unexplained | Term translation grounded in the product's own fields | Product terms | **Yes** | — | Low–Med (a wrong definition misleads) | **High** |
| **Plan** | Five fixed questions; horizon must be in months | Parse a sentence into `GoalInput`; ask *one* clarifying question | Goal vocabulary, horizons | **Yes** | `recommendForGoal` | Med — a misparsed amount must never book | **High** |
| **Compare** | Table is precise but not interpreted | Narrate the trade-off between two chosen products | `buildCompareRows` output | **Yes** | Comparison engine | Med — must not rank on unverified fields | **Medium** |
| **Decide** | "Why this one?" answered as rule chips | Expand `reasons[]` + `warnings[]` + `blockedRules[]` into prose | Recommendation result | **Yes** | Engine | Low — every claim is already rule-backed | **High** |
| **Book** | Multi-step form; bank application has manual fields | Explain *why a field is asked*; nothing more | Application template + `sourceDocument` | **Yes** | Schema, validation, guards | **High** if AI touches values | **Low** |
| **Track** | Portfolio requires reading several screens | Answer questions over the existing projections | Holdings, summary, schedule | **Yes** (session-scoped) | `summarisePortfolio` | Low–Med | **Medium** |
| **Maturity** | Instruction may be `null`; options unexplained | Explain what each recorded instruction means; flag absence | Schedule, `maturityInstruction` | **Yes** | Schedule | Med — must not invent a default | **High** |
| **Reinvest** | No reinvestment flow exists | Frame the choice; hand off to the existing marketplace | Maturing holding + catalogue | Partly | Engine | **High** — becomes advice quickly | **Medium** |

---

## 5. AI vs deterministic responsibility — the boundary

This boundary is not a guideline. It is the condition under which AI may ship at all.

### AI may

- Interpret natural language and extract intent
- Ask clarifying questions
- Map an intent to **parameters of an existing API** (never to a result)
- Summarise, narrate and re-level information the system produced
- Translate terminology, using the product's own definitions
- Compare values the deterministic layer has already computed
- State what is unknown, unverified or unavailable

### Deterministic systems own

- Interest and maturity arithmetic (`calculateDepositReturns`)
- Rate resolution (`resolveProductRate`)
- Tax-year interest allocation (`allocateInterest`)
- Eligibility, filtering and ranking (`recommendForGoal`)
- Allocation policy (`calculateEmergencyFundAmount`, `DEFAULT_ALLOCATION_POLICY`)
- Every constraint: minimums, tenure validity, step guards
- Booking amounts, references, state transitions

### The rule that makes this enforceable

> **No number in an AI response may originate from the model.** Every figure must be a value the deterministic layer returned in the same request, passed through by reference — not re-typed, not rounded, not recomputed.

Concretely: AI receives `{ maturityValue: 107291 }` and may write "about ₹1,07,291 at maturity"; it may **not** be asked "what does ₹1,00,000 at 7.1% for 12 months mature to?" That single rule prevents almost every way this could go wrong in a financial product, and it is testable — the platform can assert that every currency figure in a response appears in the tool result that produced it.

---

## 6. Ranked AI opportunities

| # | Opportunity | Persona | User problem | Convenience gain | Data available | Risk | Complexity | Priority |
|---|---|---|---|---|---|---|---|---|
| 1 | **Explain this recommendation** | A, C, D | "Why this FD?" | High | **Yes — `reasons[]`, `warnings[]`, `blockedRules[]`** | Low | Low | **P0** |
| 2 | **Natural-language product search** | A, D | Translating intent into 4 controls | High | Yes | Low | Medium | **P0** |
| 3 | **Conversational goal capture** | A, D | Five questions, months as a unit | High | Yes | Medium | Medium | **P0** |
| 4 | **Plain-language term translation** | D | Financial vocabulary | High | Yes | Low–Med | Low | **P1** |
| 5 | **Portfolio Q&A over existing projections** | B (booked-here), A | Reading several screens | Medium–High | Yes (session-scoped) | Low–Med | Medium | **P1** |
| 6 | **Maturity explanation & options framing** | B, A | `null` instruction; unclear options | High | Yes | Medium | Medium | **P1** |
| 7 | **Conversational FD capture (self-reported)** | **B** | Typing 6 fields per existing FD | High | **No — needs manual-entry capability first** | Medium | Medium | **P1**\* |
| 8 | **Comparison trade-off narration** | A, C | Table is precise, not interpreted | Medium | Yes | Medium | Low | **P2** |
| 9 | **Support answer synthesis over 14 help articles** | All | Navigating help categories | Medium | Yes | Low | Low | **P2** |
| 10 | **Provenance interrogation** ("what did you not consider?") | **C** | Trust | Medium | Yes | Low | Low | **P2** |
| 11 | **Booking field explanation** ("why is this asked?") | D | Unfamiliar bank-form fields | Medium | Yes (`sourceDocument`, hints) | Low | Low | **P2** |
| 12 | **Proactive maturity nudges** | B | Forgetting a maturity | Medium | Partly — no durable storage/delivery | Medium | High | **P3** |
| 13 | **Document ingestion of external FD advices** | B | Re-keying from paper | High | **No** | High | High | **P3** |
| 14 | **Reinvestment guidance** | B | What to do at maturity | Medium | Partly | **High — becomes advice** | High | **P3** |
| 15 | Tax optimisation advice | — | — | — | **No** | **Unacceptable** | — | **Do not build** |
| 16 | Bank safety ranking | — | — | — | **No** | **Unacceptable** | — | **Do not build** |

\* #7 is P1 in *value* but blocked on a non-AI prerequisite. Sequence it after manual FD entry exists.

---

## 7. Where AI should **not** be used

Evaluated against the test: *is conversation actually easier than the existing UI?*

| Interaction | Verdict | Why |
|---|---|---|
| Entering an investment amount | **No AI** | A numeric field with formatting and validation is faster and unambiguous. "About two lakh" introduces a rounding question that money should not have. |
| Choosing a tenure | **No AI** | Six chips. One tap. Conversation is strictly slower. |
| Reading the comparison table | **No AI for the values** | The table is the right instrument for precise comparison. AI may narrate *beside* it, never replace it. |
| Confirming a booking | **Never** | Irreversible intent must be an explicit, unambiguous control. |
| Entering PAN, account or nominee details | **Never** | Sensitive data must not pass through a model. The vault already refuses to store full account numbers; a conversational capture would defeat that. |
| Final payment confirmation | **Never** | Same reason. |
| Selecting a payout option | **No AI** | Three options, each with a one-line explanation already on screen. |
| Navigating to a screen | **No AI** | Existing nav is two taps. |

**A general principle worth writing down:** AI belongs where the user's input is *ambiguous and rich* (a sentence about a goal) or where the system's output is *dense and interpretable* (a ranked recommendation with nine reasons). It does not belong where the input is a number or the output is a confirmation.

---

## 8. Interaction model

A chatbot is **not** the recommendation. Evaluated:

| Pattern | Verdict | Reasoning |
|---|---|---|
| **A. Contextual "Ask" action** ("Why this FD?") | **Adopt — primary** | Zero navigation cost, appears only where there is something to explain, inherits the screen's context automatically. This is the highest-value-per-unit-risk pattern in the list. |
| **B. Natural-language search** | **Adopt** | Replaces a genuine four-control translation task. Must render **as applied filters the user can see and correct**, never as an opaque result set. |
| **C. Conversational onboarding** | **Adopt, scoped** | For the *first* question only — capturing the goal. Then hand over to the existing stepper, which is better at collecting the remaining structured answers. |
| **D. Portfolio questions** | **Adopt, after durable storage** | Valuable, but answering questions about a portfolio that vanishes with the tab is a poor experience. |
| **E. Explanation layer** | **Adopt — this is really pattern A generalised** | Should be a *capability every surface can call*, not a separate feature. |
| **F. Document understanding** | **Defer** | No ingestion exists. Revisit only after §10's Phase 3. |
| **G. Proactive intelligence** | **Defer** | Requires durable storage and a delivery channel; the notification centre is derived and explicitly states nothing is sent anywhere. |
| **Global chatbot** | **Reject** | It would duplicate navigation, invite out-of-scope questions the platform must refuse, and detach answers from the context that makes them safe. Every valuable case above is better served in place. |

**Conclusion on the model:** an **in-place explanation and intent layer**, not an assistant. The customer never leaves the screen they are on.

---

## 9. Placement

| Surface | Pattern | Verdict |
|---|---|---|
| Home hero | "Tell us what you're trying to achieve" | **Yes** — replaces the guess about which of three goals fits |
| Marketplace | "Describe what you're looking for" | **Yes** — the natural-language → filters case |
| Product Details | "Why this FD?" / "Explain these terms" | **Yes** — terms are on screen; explanation is grounded |
| Comparison | "Help me understand the difference" | **Yes**, beside the table, not instead of it |
| Goal Planner amount step | — | **No** — the numeric field is better |
| Goal Planner results | "Why this recommendation?" | **Yes** — the single strongest placement |
| Portfolio | "Ask about your FDs" | **After durable storage** |
| Maturity | "What are my options?" | **Yes**, framing only — never a recommendation to renew |
| Booking steps | "Why is this asked?" | **Yes**, read-only. **No AI on any value.** |
| Payment / Review / Success | — | **Never** |
| Tax Center | "What does this mean?" | **Yes**, explanation only — no liability, no slab, no TDS |

---

## 10. Data and integration requirements

### Already available (AI could use today)

- Product catalogue with resolved rate quotes carrying their band
- Deterministic maturity, tax-allocation, allocation and ranking engines
- `reasons[] / warnings[] / blockedRules[]` — machine-readable explanation source
- `DemoTermId[]` — which terms are placeholders
- `DocumentAvailability` — platform-derived vs bank-issued vs unavailable
- Maturity schedule with stage and outlook
- 14 help articles with keywords, categories and routes
- Support subject context (`holding` / `bank-account` / `none`) already carried into a request
- Bank application templates with `sourceDocument` provenance and per-field hints

### Required before the corresponding capability ships

| Requirement | Unblocks | Priority |
|---|---|---|
| **Manual FD entry** + `PortfolioHolding.source` | Persona B entirely; opportunity #7 | **First** |
| **Durable, account-scoped storage** (replacing `sessionStorage`) | Portfolio Q&A, proactive nudges | **First** |
| **Rate `effectiveFrom` / `asOf` metadata** | Any answer about rate currency; Persona C | High |
| **Structured rejection reasons from the engine** | "Why *not* this product?" | High |
| **Persisted goals** | Cross-session planning, "last time you said…" | Medium |
| Real per-bank product data replacing fixtures | Any statement presented as fact | Medium |
| Document ingestion + storage | Opportunity #13 | Later |
| Audit log of AI responses (input, tool results, output) | Regulated operation, dispute handling | **With first release** |
| Rating/insurance data with a stated methodology | Any safety comparison | Only if genuinely obtained |

---

## 11. Safety and trust requirements

### AI may say

- What the catalogue records, labelled as catalogue data
- What the platform calculated, with the inputs it used
- What the customer told the platform, played back
- What a term means, using the product's own definition
- What the system does not know, and why

### AI must qualify

- Every rate → "as recorded in the demonstration catalogue; not verified with the bank"
- Every maturity figure → "estimated, calculated from these terms; the bank confirms final terms"
- Every rating or insurance label → "recorded in the catalogue; not verified with the agency, the RBI or DICGC"
- Anything about a self-reported holding → "as you entered it"

### AI must never claim

- That a return, principal or bank is guaranteed or safe
- That a deposit is DICGC-covered or a bank is RBI-verified — the platform has verified neither
- A rate, tenure, minimum, penalty or tax rule not present in the data
- A recommendation framed as advice ("you should")
- Certainty about anything in `blockedRules`

### AI must refuse when

- The question needs data the platform does not hold (tax liability, TDS, premature-withdrawal penalties, comparative bank safety)
- The answer would require the model to compute a financial figure
- The question asks for personalised financial advice
- The request concerns another person's data

The required refusal is **specific**, not generic: *"I can't establish that — the catalogue records no premature-withdrawal terms for this product, and that rule is listed as not evaluated."* A vague "I can't help with that" wastes the trust the provenance architecture earns.

### AI must ask for clarification when

An amount, horizon or goal is ambiguous — and it must ask **one** question, then hand to the structured UI.

### AI must defer to deterministic output when

Always, for every number. See §5.

---

## 12. AI + provenance

The platform already answers *"where did this come from?"* for figures. Every AI response must answer the same question, because an explanation is exactly where provenance is most easily lost.

**Product requirement:** an AI response carries, in a form the UI can render:

```text
AI answer
  ↓
Grounding
  ├─ Catalogue data        → "demonstration catalogue, not verified"
  ├─ Platform calculation  → which engine, and the inputs used
  ├─ User-provided         → played back, marked as theirs
  └─ Institution-provided  → none today; the slot exists for when it is
  ↓
Unavailability
  └─ blockedRules / DemoTermId / missing data, named explicitly
```

Minimum fields: **source class**, **calculation reference** (which engine produced each figure), **assumptions used**, and **what was unavailable**. A timestamp becomes meaningful only once §10's `effectiveFrom` exists — until then the honest statement is that the catalogue carries no date, and AI should say so rather than omit the field.

**Availability, not confidence.** A model-generated confidence score would be a number about a number, and this platform's whole posture is that unearned numeric precision is a lie. The product states *what it has* and *what it lacks*.

---

## 13. Top five capabilities

### 1. Explainable recommendation ("Why this FD?")

- **User problem:** "The platform picked this. I don't know why, or what it ignored."
- **User input:** A tap on the recommendation, optionally a follow-up question.
- **AI responsibility:** Expand `reasons[]`, `warnings[]` and `blockedRules[]` into prose at the reader's level; answer follow-ups strictly within that set.
- **Deterministic responsibility:** Produced every reason, every rule id, every figure, and the list of rules it could not run.
- **Required data:** `GoalRecommendationResult`. **Available today.**
- **Expected output:** A short explanation, each claim traceable to a rule, ending with what was *not* considered.
- **User benefit:** Understanding without financial literacy; the ability to disagree with a reason.
- **Risk:** Low — AI cannot introduce a claim the engine did not make, if constrained to the reason set.
- **Better than UI because:** The UI can show nine rule chips; it cannot answer "so is the shorter one better for me?" The chips are the *evidence*; the explanation is the *reading of it*.
- **Differentiator:** Most FD marketplaces rank and do not explain. This one can explain **and disclose what it ignored** — the second half is what no competitor will copy quickly, because it requires having built `blockedRules` before AI was on the roadmap.

### 2. Natural-language product search

- **User problem:** "I know what I want but not which filter says it."
- **User input:** "around a year, about a lakh, might need it early"
- **AI responsibility:** Map to `{ tenure, amount, minRate, sort }`; ask one question if ambiguous.
- **Deterministic responsibility:** Filter, price, rank, paginate — the existing marketplace path, unchanged.
- **Required data:** Catalogue + filter vocabulary. **Available today.**
- **Expected output:** The normal results grid, with the applied filters shown as editable chips.
- **User benefit:** One sentence replaces four controls.
- **Risk:** Low — the interpretation is visible and correctable.
- **Better than UI because:** It collapses a translation step, and it degrades gracefully: a wrong parse is a visible wrong chip, not a wrong answer.
- **Differentiator:** Modest alone; strong combined with #1.

### 3. Conversational goal capture

- **User problem:** "I know what I'm saving for. I don't know my horizon in months."
- **User input:** "₹2 lakh for a car in about two years"
- **AI responsibility:** Extract principal, horizon and goal type; ask **one** clarifying question; hand to the stepper.
- **Deterministic responsibility:** Validate, price, allocate, rank; the emergency-fund split remains `calculateEmergencyFundAmount`'s.
- **Required data:** Goal vocabulary, horizon presets. **Available today.**
- **Expected output:** A pre-filled planner the customer confirms — never a booking.
- **User benefit:** Five questions become one sentence and a confirmation.
- **Risk:** Medium — a misparsed amount must be visible before it reaches anything financial. Mitigated by confirming in the existing UI.
- **Better than UI because:** The wizard's first three questions are a translation exercise. The confirmation step keeps precision where it matters.
- **Differentiator:** Meaningful for Persona D.

### 4. Plain-language term translation

- **User problem:** "What does cumulative mean? Is 7.1% per year or in total?"
- **User input:** Tapping a term, or asking about one on screen.
- **AI responsibility:** Explain using this product's actual fields and figures.
- **Deterministic responsibility:** Supplies the values being explained.
- **Required data:** Product terms, application-field hints. **Available today.**
- **Expected output:** Two or three sentences grounded in the deposit in front of the customer.
- **User benefit:** No glossary, no leaving the screen.
- **Risk:** Low–Medium — a wrong definition misleads, so definitions should be reviewed content the model *selects and personalises*, not invents.
- **Better than UI because:** A static glossary explains "cumulative" in general; this explains what it means for *this* deposit at *this* amount.
- **Differentiator:** Table stakes soon; its absence is conspicuous.

### 5. Maturity intelligence

- **User problem:** "When does my money come back, and what happens then?"
- **User input:** "What matures next?" or a tap on the maturity screen.
- **AI responsibility:** Summarise the existing schedule; explain what each recorded instruction means; **flag where no instruction was recorded**.
- **Deterministic responsibility:** `buildMaturitySchedule`, `maturityDate`, `summarisePortfolio`.
- **Required data:** Holdings. **Available today**, but session-scoped — needs durable storage to be genuinely useful.
- **Expected output:** What matures, when, how much is expected, what the bank was instructed to do, and where that is unknown.
- **User benefit:** One answer instead of three screens.
- **Risk:** Medium — must never default a `null` instruction into "it will renew". The schedule already refuses to; AI must inherit that.
- **Better than UI because:** "What matters in the next 90 days?" is a query, and a list is not a query interface.
- **Differentiator:** Strong once Persona B can enter existing FDs — this is where #7 pays off.

---

## 14. The strongest differentiator

> **Explainable, provenance-carrying FD guidance — a platform that can tell you why it recommended something *and what it could not take into account*.**

Not a chatbot. Not "AI recommendations". The differentiator is **auditable reasoning**, and the evidence that it is achievable here is already in the repository:

- Every reason carries a `RuleId` traceable to an approved document; `RuleId` is a closed union precisely so a reason cannot have invented provenance.
- `blockedRules[]` is part of the engine's *output* — a machine-readable statement of which rules did not run and what data is missing.
- `RateQuote` returns the rate **and the band it came from**.
- `DemoTermId[]` marks which terms on a deposit are placeholders.
- The provenance and safety notes already distinguish catalogue data, platform calculation and bank confirmation.

No competitor can add this by adding an LLM, because the hard part is not the model — it is having a financial engine that already knows the difference between *a fact*, *a calculation* and *a gap*. This platform has that. AI turns it from a set of chips and disclosure notes into something a customer can interrogate in their own words.

The customer value, plainly: **"I understand why, I can check it, and I know what it didn't know."** For Persona C that is the reason to trust the platform. For Persona D it is the reason to use it at all. It is the same capability serving both ends of the expertise range — which is why it is the one to build.

---

## 15. Conceptual architecture

```text
                        User (on a specific screen, with context)
                                      │
                        ┌─────────────▼─────────────┐
                        │   AI Interaction Layer     │  in-place, contextual
                        │   (Ask / describe / query) │  never a global chatbot
                        └─────────────┬─────────────┘
                                      │  utterance + screen context
                        ┌─────────────▼─────────────┐
                        │  Intent & Context          │  LLM
                        │  - classify intent         │  extracts PARAMETERS only
                        │  - extract parameters      │  never results
                        │  - detect ambiguity        │
                        └─────────────┬─────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  Capability Router / Guardrail     │  deterministic
                    │  - is this in scope?               │  refuses out-of-scope
                    │  - which existing API answers it?  │  before any call
                    │  - does it need confirmation?      │
                    └─────────────────┬─────────────────┘
                                      │  typed parameters
                    ┌─────────────────▼─────────────────┐
                    │  EXISTING PRODUCT APIs             │  unchanged
                    │  products · recommendForGoal ·     │
                    │  summarisePortfolio · schedule ·   │
                    │  allocateInterest · compareRows    │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  DETERMINISTIC FINANCIAL ENGINE    │  sole numeric authority
                    │  calculateDepositReturns ·         │
                    │  resolveProductRate · allocation   │
                    └─────────────────┬─────────────────┘
                                      │  verified result
                    ┌─────────────────▼─────────────────┐
                    │  Provenance Envelope               │  deterministic
                    │  source class · calc reference ·   │  attached, not generated
                    │  assumptions · blockedRules ·      │
                    │  demoTerms · unavailability        │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  AI Explanation Layer              │  LLM
                    │  narrates ONLY the envelope        │
                    │  no figure may originate here      │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │  Response Validator                │  deterministic
                    │  - every currency/rate figure      │  REJECTS on failure
                    │    appears in the tool result      │
                    │  - no prohibited claim             │
                    │  - provenance present              │
                    └─────────────────┬─────────────────┘
                                      │
                       User  ◄────────┘  + explicit UI confirmation
                                          for any state change
```

**Where each concern lives:**

- **LLM:** two bounded places only — parameter extraction (before) and narration (after). It never sits between the engine and the answer.
- **Deterministic:** routing, all computation, the provenance envelope, and the output validator.
- **Product data:** the existing repositories and stores; AI adds no data source.
- **Provenance:** attached by the deterministic layer from data the engines already return.
- **Safety:** twice — a scope guard *before* any call, and a response validator *after* generation. The second is what makes the §5 rule enforceable rather than aspirational.
- **User confirmation:** every state change (booking, saving a goal, recording a holding) goes through the existing UI. AI may prepare; only the customer commits.

---

## 16. Does AI actually improve convenience?

| Capability | Steps without AI | Steps with AI | Cognitive effort removed | New risk | Worth it? |
|---|---|---|---|---|---|
| Explain recommendation | Read 9 rule chips, infer relevance, open the blocked-rules disclosure | 1 tap + read | Interpreting rule labels; noticing the disclosure exists | Over-trusting a fluent explanation | **Yes** |
| NL product search | 4 control interactions + sort | 1 sentence + confirm chips | Mapping intent to filter vocabulary | Misparse — visible and correctable | **Yes** |
| Goal capture | 5 questions | 1 sentence + 1 confirm | Converting a horizon to months | Misparsed amount reaching the planner | **Yes**, with confirmation |
| Term translation | Leave screen, search help, return | 1 tap | Vocabulary | A wrong definition | **Yes**, with reviewed content |
| Maturity Q&A | Portfolio → maturities → open holdings | 1 question | Assembling dates across screens | Defaulting a `null` instruction | **Yes**, after durable storage |
| Amount entry | 1 field | 1 sentence + confirm | **None** | Rounding ambiguity | **No** |
| Tenure choice | 1 tap | 1 sentence + confirm | **None** | Misparse | **No** |
| Booking confirm | 1 tap | — | **None** | Severe | **Never** |

The pattern is consistent: **AI wins where the user's input is a sentence or the system's output is dense; it loses wherever a single control already expresses the intent exactly.**

---

## 17. Roadmap

### Phase 1 — Explain what already exists *(no new data required)*

1. Contextual **"Why this FD?"** on the recommendation — grounded in `reasons`/`warnings`/`blockedRules`.
2. **Term translation** on Product Details and the booking application, from reviewed definitions.
3. The **provenance envelope** and the **response validator** — built first, because they are the constraint everything else runs inside.
4. **AI response audit log**.

Phase 1 ships the differentiator and touches no financial logic.

### Phase 2 — Understand what the user says *(no new data required)*

5. **Natural-language product search**, rendering visible, editable filter chips.
6. **Conversational goal capture**, handing to the existing stepper.
7. **Support answer synthesis** over the 14 help articles, linking to the existing routes.
8. **Provenance interrogation** for Persona C — "what did you not consider?"

### Phase 3 — Serve the existing depositor *(new capability required first)*

9. **Manual FD entry** + `PortfolioHolding.source` + **durable storage** — not AI, and the prerequisite for everything after it.
10. **Conversational FD capture** — extraction into a form the customer confirms.
11. **Portfolio Q&A** and **maturity intelligence** over a portfolio that now persists.
12. Rate `effectiveFrom` metadata; structured rejection reasons.

### Explicitly not on the roadmap

Tax advice, bank safety rankings, guaranteed-return language, automatic bank imports, AI-initiated bookings, and a global chatbot.

---

## Final note

The reason this platform can do explainable AI well is that it was built to be honest before AI was considered — closed rule-id unions, blocked rules as output, rate quotes carrying their band, demo terms marked as demo, and figures that are never stored when they can be derived. That groundwork is the asset. The recommendation is to build AI **on** it rather than beside it, and to accept that the honest answer to *"where can AI help?"* here is "in three places, very well" rather than "everywhere".
