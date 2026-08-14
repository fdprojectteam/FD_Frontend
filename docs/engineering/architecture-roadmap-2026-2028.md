# Architecture Roadmap 2026 – 2028

**Date** 2026-08-06 · **Status** proposed · **Horizon** ~2 years
**Inputs** Founder Vision · `rfc-001` · `fd-domain-model-greenfield.md` · `shared-finance-layer.md`

**Governing principle:** every milestone earns its architecture. Nothing is built
before the milestone that needs it, and every deferral carries a named trigger so
deferral is a decision rather than drift.

---

## Milestone map

| # | Milestone | Target | Architectural centre of gravity |
|---|---|---|---|
| **M0** | Current POC | now → Wk 8 | Frontend modular monolith |
| **M1** | MVP | +3 mo | Real API, real money paths |
| **M2** | Production | +6 mo | Correctness, audit, compliance |
| **M3** | 100 banks | +9 mo | Rate-card scale, partner integration |
| **M4** | 1000 banks | +15 mo | Service extraction, data pipelines |
| **M5** | International | +18 mo | Multi-currency, multi-regulator |
| **M6** | AI Advisor | +12 mo *(parallel)* | Controlled inference over the domain |
| **M7** | Event-driven | +18 mo | Domain events as the integration seam |
| **M8** | Distributed services | +24 mo | Bounded contexts become deployables |

M6 runs in parallel deliberately — Founder §6 names it a differentiator, and it
depends on the domain model rather than on scale.

---

## M0 — Current POC *(now → Week 8)*

**Goal:** a serious customer or deposit investor says *"this can become a serious
fixed-income wealth platform"* (Founder §12). Not screens completed.

| Area | State |
|---|---|
| Architecture | Next.js modular monolith; ESLint-enforced module boundaries |
| Data | Fixtures + MSW; no backend |
| Domain | Maturity, tenure→rate, payout, validation — done and asserted |
| Debt | TD-001 duplicate maturity engine (contained by test) |

**Remaining M0 work, in priority order:**

1. **RFC-001 Stage 1** — ~90 min. Integer rupees, display-copy invariant,
   `label?`, remove `tenureMonths`
2. **T3.2.10** tenure selector — on rate-card data
3. **T3.3–T3.6** Nominee, Bank Account, Review, Pay & Confirm — **minimal**
4. **Then stop, and pivot to the differentiators** — Goal Planner, Suitability
   Score, Safety/Concentration, FD Ladder, Explainability

**The single most important call in this roadmap:** finish Booking to
production quality but *minimal scope*, then move. Founder §12 is explicit that
the PoC will not be measured by screens, and risk R-F3 already records that none
of the seven named differentiators is booking configuration.

**Not built at M0:** `RateQuote` · effective dating · `Money` value object ·
event sourcing · any service extraction.

---

## M1 — MVP *(+3 months)*

**Trigger:** first real users, real money, one or two partner banks.

| Change | Why now |
|---|---|
| **Real API replaces MSW** | The seams exist (`services/api`, repositories, module services). Fixtures were designed to be deleted |
| **`compoundingFrequency` per product** (RFC D6) | Second bank almost certainly compounds differently |
| **Value date + maturity date + business-day calendar** | Spec 21b §E requires maturity date; a real booking has a real value date |
| **`appliedQuote` captured on the booking** | Doc 19: a booking must reference the rate effective at the time |
| **R1 shared finance layer** | `src/utils/finance/`; TD-001 repaid; scheduled after Booking, before Portfolio |
| **Correlation ids on every request** | Doc 18. Cheap now, painful after the first incident |
| **Pricing-cache staleness policy** | Rate data must not share catalogue TTLs (risk H-1) |
| **Goal Planner + Recommendation Engine** | The Founder Vision's headline. Deferred through M0, not optional at M1 |

**Architecture stays a monolith.** One deployable, five clear module boundaries.

**Explicitly deferred:** microservices · event bus · multi-currency · 1000-bank
data pipelines.

---

## M2 — Production *(+6 months)*

**Trigger:** real customer money at scale; regulatory exposure becomes real.

| Change | Why |
|---|---|
| **`RateQuote` fully adopted** (RFC D7) | BR-PROD-003 becomes implementable |
| **Effective-dated rate cards** | Dynamic rates need versioning + audit |
| **`Money` value object — minor units, integer** | Float rupees are unacceptable at production volume |
| **`Rate` as basis points** | Kills the `7.25` / `0.0725` class of error permanently |
| **Append-only audit store** | Doc 13: every transition, actor, timestamp, correlation id |
| **Consent records immutable** | Doc 19 ADR-002 |
| **Day-count convention per product** | Precision matters once interest is real money |
| **Time-zone discipline: `BusinessDate` ≠ instant** | Risk H-2. A 23:30 IST booking must not book on the wrong day |
| **DICGC exposure calculator** | ₹5 lakh per depositor per bank — Founder §6's concentration feature, cross-holding by nature |
| **RBI reporting extracts** | Compliance |

**This is the milestone where correctness stops being a code-review concern and
becomes a regulatory one.** Most of RFC-001's deferrals come due here.

---

## M3 — 100 Banks *(+9 months)*

**Trigger:** partner count outgrows manual rate maintenance.

| Change | Why |
|---|---|
| **`RateCard` becomes its own aggregate and resource** | Rates change daily; products rarely. Versioning the wrong thing makes every rate update a product write |
| **`RateBand` discriminators** — amount range, payout mode, investor segment | Amount slabs, payout pricing and senior rates all become *a band with more fields set*. No new types |
| **Partner rate-sync adapters** | Per-bank ingestion → canonical model (Doc 18 ADR-002) |
| **Ingestion validation** — uniqueness, overlap, unit sanity | Catches the `0.0725` error the platform cannot detect downstream |
| **Rate-card admin + approval workflow** | Someone must own publication |
| **Senior-citizen products** | `investorSegment` band |
| **Catalogue read models / caching tier** | 100 banks × N products × M bands |

**Still a monolith, now with a serious catalogue subsystem.** The greenfield
model's Catalogue context earns its boundary here.

---

## M4 — 1000 Banks *(+15 months)*

**Trigger:** catalogue volume and rate-update frequency exceed a single
deployable's comfort.

| Change | Why |
|---|---|
| **Extract Catalogue as a service** | The first context whose scale genuinely diverges |
| **Search/filter moves to a dedicated index** | Marketplace filtering over 10⁴+ products |
| **Rate-update pipeline** — streaming ingestion, staged publication | Daily updates × 1000 banks is a data problem |
| **Read models per consumer** | Marketplace, Booking, Ladder want different projections |
| **Cache invalidation on rate publication** | Correctness at scale |
| **Multi-region CDN for catalogue reads** | Latency |

**First real distribution.** Booking, Investor, Portfolio and Payments remain
co-deployed.

---

## M5 — International *(+18 months)*

**Trigger:** a second jurisdiction.

| Change | Why |
|---|---|
| **`Money.currency` enforced end to end** | Already in the greenfield model |
| **`BusinessDate.calendar` per jurisdiction** | Holidays and value dates differ |
| **Regulator abstraction** — RBI is one implementation | Deposit insurance, KYC and reporting all differ |
| **Locale-aware formatting** | `formatCompactCurrency` is lakh/crore only (risk H-5) |
| **Deposit-insurance rules per regulator** | DICGC ₹5 lakh is an Indian rule, not a platform constant |
| **Per-jurisdiction tax engines** | TDS is Indian |

**The greenfield model anticipates this** — `Money`, `BusinessDate` and
`EligibilityRules` are already jurisdiction-parameterised. Nothing structural
changes; several constants become policies.

---

## M6 — AI Advisor *(+12 months, parallel)*

**Trigger:** the domain model is stable enough to ground answers in.

Founder §7 is explicit: *"Controlled assistant answering approved questions such
as 'Why this FD?', 'Should I split?', 'What if I withdraw early?'"* — **not an
open-ended chatbot**.

| Change | Why |
|---|---|
| **Explainability as a first-class output** | `RateQuote` provenance + `ExposureAssessment` make "why this FD" answerable from data, not from a model's imagination |
| **A bounded question catalogue** | Founder §9 defers open-ended chat precisely to avoid inaccurate advice |
| **Deterministic computation, generated narration** | The numbers come from the domain services; the model only phrases them |
| **Advice audit trail** | Every recommendation reproducible — regulatory necessity |

**The architectural point:** M6 is cheap *if* the domain services are pure and
the quote carries provenance, and near-impossible otherwise. This is the
strongest long-run argument for `RateQuote` — it just isn't an argument for
building it in August.

---

## M7 — Event-Driven *(+18 months)*

**Trigger:** cross-context workflows outgrow synchronous calls — typically at
Payments ↔ Booking ↔ Portfolio reconciliation.

| Change | Why |
|---|---|
| **Domain events published** — `BookingConfirmed`, `PaymentSuccessful`, `PortfolioCreated` | Doc 13 and Doc 18 already specify them |
| **Outbox pattern** | Doc 19: transactional integrity without distributed transactions |
| **Idempotent consumers** | Doc 18 ADR-003 |
| **Event store as the audit backbone** | Subsumes M2's append-only audit |
| **Webhook ingestion** — payment and partner callbacks | Already specified in Doc 18 |

**Not event sourcing.** Event-*driven* integration; aggregates keep current-state
storage. Event sourcing is a much larger commitment and nothing so far requires
it.

---

## M8 — Distributed Services *(+24 months)*

**Trigger:** team topology, not technology. Contexts split when the teams owning
them need independent release cadence.

| Service | Extracted because |
|---|---|
| Catalogue | Already extracted at M4 |
| Booking | Workflow-heavy, distinct release rhythm |
| Payments | PCI scope isolation |
| Portfolio | Read-heavy, different scaling curve |
| Investor | KYC/PII isolation |
| Compliance | Independent audit surface |

**The bounded contexts in `fd-domain-model-greenfield.md` §1 are the extraction
seams.** They were chosen for that reason, and are worth defending in code long
before anything is deployed separately.

---

## What is deliberately *not* on this roadmap

| Not doing | Why |
|---|---|
| Microservices before M8 | Team topology does not justify them; distributed monoliths are worse than monoliths |
| Event sourcing | Event-driven ≠ event-sourced. Nothing requires the latter |
| GraphQL | REST + typed clients is sufficient; Doc 18 specifies REST |
| Custom rules engine | Business rules are typed functions with tests. A DSL is a project of its own |
| Native mobile | Founder §9: responsive web is enough if mobile UX is excellent |
| Blockchain / tokenised deposits | No regulatory or product driver |

---

## Debt register with repayment milestones

| Debt | Incurred | Repay at | Contained by |
|---|---|---|---|
| **TD-001** duplicate maturity engine | T3.2.4 | **R1 / M1** | Six cross-implementation assertions |
| Compounding as a platform constant | M2.1 | **M1** | Correct for all current products |
| `tenureMonths` unit | T3.2.4b | **Trigger** — first sub-month row | Ingestion check (RFC D1) |
| Float rupees | M2.1 | **M2** (`Money`) | Integer discipline (RFC D5) |
| Rate as percent-number | M2.1 | **M2** (`Rate` bps) | Ingestion sanity check |
| Display-copy duplication | T3.2.4b / T3.2.9 | **Never removed** — constrained instead | Read-restriction invariant (RFC D3) |
| No effective dating | T3.2.4b | **M2** | Static rates until then |
| No correlation ids | Phase 0 | **M1** | — |

---

## The one thing to get right

Across all eight milestones, one property decides whether this scales: **the
domain layer stays pure, and every price carries its provenance.**

Purity is what has made 399 unit assertions possible without a browser, and it is
what will make the AI Advisor groundable rather than hallucinatory. Provenance —
`RateQuote` — is what makes a booking reproducible, a rate change detectable and
a regulator answerable.

Everything else on this roadmap is scheduling.
