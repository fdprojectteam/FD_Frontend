# Fixed-Income Domain Model — Greenfield Design

**Date** 2026-08-06 · **Status** reference design, not a migration plan
**Constraint** designed from scratch, ignoring the current implementation

**Scope of the exercise:** 100+ partner banks · dynamic rates · senior-citizen
products · tax rules · amount slabs · effective dating · versioned rate cards ·
RBI compliance.

This is what the model *should* be. `t3.2.10-review-challenge.md` §8 says which
parts are needed when; nothing here is proposed for the POC.

---

## 1. Bounded contexts

Five, drawn along the lines the business actually splits on. Getting these
boundaries right matters more than any single entity.

| Context | Owns | Does not own |
|---|---|---|
| **Catalogue** | Banks, products, rate cards, eligibility | Bookings, investors |
| **Investor** | Identity, KYC, tax profile, residency, senior status | Deposits, money |
| **Booking** | The act of committing money — draft → confirmed | Rates, investors, payments |
| **Portfolio** | Confirmed holdings, accruals, maturity lifecycle | Booking mechanics |
| **Payments** | Funding, settlement, refunds | Whether a booking is valid |

**The single most important boundary is Catalogue ↔ Booking.** Catalogue owns
*what a deposit costs*; Booking owns *what this investor committed to*. Every
serious defect in this space comes from a booking that recomputes a price instead
of recording one.

---

## 2. Value Objects

Value objects first, because the aggregates are mostly composed of them.

### 2.1 `Money`
```
Money { amountMinor: bigint, currency: CurrencyCode }
```
**Minor units (paise), integer, always.** Rupees-as-float is the defect that
ends careers. `bigint` rather than `number` so a ₹10,000 crore institutional
deposit cannot silently lose precision.
**Owner:** platform. **Immutable.** Arithmetic returns new instances and refuses
to mix currencies.

### 2.2 `Rate`
```
Rate { basisPoints: number }   // 725 = 7.25%
```
**Basis points, integer.** Kills the `7.25` vs `0.0725` ambiguity permanently —
there is no unit to get wrong, and no float to drift. Banking already speaks bps.
**Owner:** Catalogue. **Immutable.**

### 2.3 `Tenure`
```
Tenure { days: number }        // canonical
```
Days, integer, canonical. Expresses 7 days and 10 years alike, sorts and
compares as a single integer, and is what banks settle on.
**Display is derived, never stored** — except an optional `label` on a rate band
so a bank may say "1 Year" in its own words.
**Owner:** Catalogue for offered tenures; Booking for the chosen one.

### 2.4 `DateRange` / `EffectivePeriod`
```
EffectivePeriod { from: BusinessDate, to: BusinessDate | null }
```
`null` end = currently effective. Every priced thing carries one.
**Owner:** whichever aggregate is versioned by it.

### 2.5 `BusinessDate`
```
BusinessDate { isoDate: string, calendar: CalendarId }
```
**A date, not an instant.** Value dates and maturity dates are calendar days in
the bank's jurisdiction, and modelling them as timestamps is how a 23:30 IST
booking books on the wrong day. Carries its calendar so holiday and business-day
rolling is answerable.
**Owner:** platform.

### 2.6 `DayCountConvention`
```
DayCountConvention = 'ACT/365' | 'ACT/ACT' | '30/360'
```
Named, never assumed. **Owner:** Catalogue, per product.

### 2.7 `CompoundingFrequency`
```
CompoundingFrequency = 'simple' | 'monthly' | 'quarterly' | 'half-yearly' | 'annual'
```
**A contract term, not a platform constant.** **Owner:** Catalogue, per rate band
— banks price cumulative and payout products on different compounding.

### 2.8 `PayoutMode`
```
PayoutMode = 'cumulative' | 'monthly' | 'quarterly' | 'half-yearly' | 'annual'
```
**Owner:** Catalogue defines availability; Booking records the choice.

### 2.9 `RateQuote` — the pivotal value object
```
RateQuote {
  rate: Rate
  bandId: RateBandId
  rateCardVersion: RateCardVersion
  compounding: CompoundingFrequency
  dayCount: DayCountConvention
  quotedAt: Instant
  effectivePeriod: EffectivePeriod
}
```
**The answer to "what does this cost", carrying its own provenance.** This is
what makes BR-PROD-003 (rate changed mid-booking) implementable, what a booking
persists, and what an auditor reads. Without it, a rate is a number with no story.
**Owner:** produced by Catalogue's pricing service; **held immutably by Booking.**

### 2.10 `TaxProfile`
```
TaxProfile { marginalRate: Rate, isSeniorCitizen: boolean,
             hasForm15GH: boolean, residency: ResidencyStatus }
```
**Owner:** Investor. Booking reads, never stores — tax status changes and a
booking must not freeze a stale one.

---

## 3. Aggregates and Entities

### 3.1 Catalogue context

**`PartnerBank`** *(aggregate root)*

| Field | Owner | Notes |
|---|---|---|
| `bankId` | Catalogue | Immutable identity |
| `name`, `shortCode`, `logoUrl` | Catalogue | Presentation, but bank-owned facts |
| `regulator`, `licenceType` | Compliance | Drives RBI reporting |
| `dicgcInsured: boolean` | Compliance | Feeds the exposure calculation (§5.4) |
| `creditRating` | Catalogue | Sourced from agencies; versioned |

**`DepositProduct`** *(aggregate root)*

| Field | Owner | Notes |
|---|---|---|
| `productId`, `bankId` | Catalogue | |
| `name`, `description`, `marketingCopy` | Catalogue | **Explicitly display copy.** No behavioural path reads these |
| `investmentBounds: { min: Money, max: Money, increment?: Money }` | Catalogue | Source of truth |
| `dayCount: DayCountConvention` | Catalogue | |
| `prematureWithdrawal: WithdrawalPolicy` | Catalogue | Entity, not a flag — penalties are rate- and tenure-dependent |
| `autoRenewal: RenewalPolicy` | Catalogue | |
| `eligibility: EligibilityRules` | Compliance | Age, residency, entity type |
| `currentRateCardId` | Catalogue | **Pointer, not embedded** — the card versions independently |

**Deliberately absent:** any headline rate, any tenure range, any payout list.
Every one of those is derivable from the current rate card, and storing them is
the duplication that produces two screens quoting two numbers.

**`RateCard`** *(aggregate root — separately versioned)*

```
RateCard {
  rateCardId, productId
  version: RateCardVersion
  effectivePeriod: EffectivePeriod
  publishedAt, publishedBy, sourceReference
  bands: RateBand[]
}
```

**Its own aggregate, not a field on the product.** Rates change daily across 100+
banks while products change rarely; binding them would version the wrong thing
and make every rate update a product write. It is also what "dynamic rates" and
"versioned rate cards" mean concretely.

**`RateBand`** *(entity within `RateCard`)*

| Field | Owner | Notes |
|---|---|---|
| `bandId` | Catalogue | **Referenced by every quote and every booking** |
| `tenure: Tenure` | Catalogue | Days |
| `label?: string` | Catalogue | The bank's own wording |
| `amountRange?: { from: Money, to: Money \| null }` | Catalogue | Amount slabs |
| `payoutMode?: PayoutMode` | Catalogue | Payout-specific pricing |
| `investorSegment?: InvestorSegment` | Catalogue | `'retail' \| 'senior' \| 'staff'` |
| `rate: Rate` | Catalogue | |
| `compounding: CompoundingFrequency` | Catalogue | Per band, not per platform |

**The four optional discriminators are the whole design.** Every scalability
requirement — amount slabs, payout pricing, senior rates — is *a band with more
of them set*. No new type, no signature change, no migration. A band with none
set is a plain tenure rate.

**Uniqueness:** `(tenure, amountRange, payoutMode, investorSegment)` must be
unique within a card. Overlapping bands are a data error and must be rejected at
ingestion, not resolved by ordering.

### 3.2 Investor context

**`Investor`** *(aggregate root)* — `investorId`, `kycStatus`, `dateOfBirth`
(derives senior status; never store the boolean), `residency`, `taxProfile`,
`nominees[]`, `bankAccounts[]`.

**`Nominee`**, **`BankAccount`** — entities within `Investor`. Soft-deleted per
Doc 19.

### 3.3 Booking context

**`Booking`** *(aggregate root)*

| Field | Owner | Mutable | Notes |
|---|---|---|---|
| `bookingId`, `bookingReference` | Booking | No | Reference generated on confirmation |
| `investorId`, `productId` | Booking | No | **References, never copies** |
| `principal: Money` | Booking | Until payment | |
| `tenure: Tenure` | Booking | Until payment | |
| `payoutMode: PayoutMode` | Booking | Until payment | |
| **`appliedQuote: RateQuote`** | Booking | No | **The single most important field in the model.** What the investor was quoted, from which band, from which card version, under which compounding and day count |
| `valueDate: BusinessDate` | Booking | No | Set at confirmation |
| `maturityDate: BusinessDate` | Booking | No | Derived once, then frozen |
| `status: BookingStatus` | Booking | Yes | Doc 13's state machine |
| `nomineeId`, `bankAccountId` | Booking | Until payment | **Ids, never copies** — Doc 19 §Security |
| `consents: ConsentRecord[]` | Compliance | Append-only | Immutable |
| `stateTransitions: StateTransition[]` | Booking | Append-only | Doc 13 audit |

**`Booking` never stores estimated interest or estimated maturity value.**
Estimates are derived; only *confirmed* figures persist, and they persist because
`appliedQuote` makes them reproducible.

**`BookingDraft`** — a separate, non-durable aggregate. Same shape minus
`appliedQuote`, `valueDate`, `maturityDate` and `bookingReference`; holds
identifiers only, never raw PAN or account numbers.

### 3.4 Portfolio context

**`Holding`** *(aggregate root)* — created only from a confirmed booking, carries
its own copy of `appliedQuote`, and owns `accruedInterest`, `payoutSchedule[]`
and `maturityInstruction`.

---

## 4. Domain Services

Services exist where a rule belongs to no single aggregate.

| Service | Signature | Owner | Why a service |
|---|---|---|---|
| **`RateResolver`** | `(rateCard, criteria) → RateQuote \| null` | Catalogue | Selecting a band from *(tenure, amount, payout, segment, asOf)* spans bands. **Never invents a rate** — no match returns `null` |
| **`InterestCalculator`** | `(principal, quote, tenure) → InterestProjection` | Catalogue | Pure. Compounding and day count come from the quote, so it cannot be handed a rate without knowing how to apply it |
| **`MaturityScheduler`** | `(valueDate, tenure, calendar) → BusinessDate` | Catalogue | Business-day rolling and holiday calendars |
| **`TaxEstimator`** | `(projection, taxProfile) → TaxProjection` | Investor + Catalogue | TDS thresholds, 15G/H, senior exemptions |
| **`EligibilityService`** | `(investor, product) → EligibilityResult` | Compliance | Spans two aggregates |
| **`ExposureCalculator`** | `(holdings, newBooking) → ExposureAssessment` | Portfolio | **DICGC is ₹5 lakh per depositor per bank** — inherently cross-holding. Founder §6's concentration feature |
| **`BookingStateMachine`** | `(booking, event) → Booking \| InvalidTransition` | Booking | Doc 13, centralised so no screen invents a transition |

**`RateResolver` and `InterestCalculator` are separate on purpose.** One decides
*what it costs*, the other *what it earns*. Merging them is how a calculator ends
up choosing a rate.

---

## 5. Field ownership rules

### 5.1 The three-tier rule
1. **Source of truth** — one owner, read by logic
2. **Derived** — computed on read, never stored (except when frozen at
   confirmation, where the freezing is the point)
3. **Display copy** — bank-authored words; **no behavioural code path may read it**

Tier 3 is enforced by a probe, not by discipline.

### 5.2 What is frozen and when

| Value | Frozen at | Why |
|---|---|---|
| `appliedQuote` | Confirmation | Reproducibility, audit, dispute |
| `valueDate`, `maturityDate` | Confirmation | Contractual |
| `principal`, `tenure`, `payoutMode` | Payment initiation | Doc 17: mutable "until payment" |
| Estimated interest / maturity | **Never** | Doc 09 §10, Doc 19 §5, BR-INV-004 |

### 5.3 Cross-context references
Ids only. Booking references `investorId` and `productId`; it never copies an
investor's name or a product's rate. The one exception is `appliedQuote`, copied
deliberately because a booking must survive the rate card that produced it.

### 5.4 Compliance-owned fields
`dicgcInsured`, `consents[]`, `eligibility`, `stateTransitions[]` are owned by
Compliance and **append-only**. Correction is a compensating record, never an
edit (Doc 19 ADR-002).

---

## 6. How the requirements land

| Requirement | Mechanism | New type? |
|---|---|---|
| 100+ banks | `RateCard` is its own aggregate, fetched per product | No |
| Dynamic rates | Card versioning + `EffectivePeriod` | No |
| Senior-citizen rates | `RateBand.investorSegment` | No |
| Tax rules | `TaxEstimator` + `TaxProfile` | No |
| Amount slabs | `RateBand.amountRange` | No |
| Effective dating | `EffectivePeriod` on card and band | No |
| Versioned cards | `RateCard.version` | No |
| Payout-specific pricing | `RateBand.payoutMode` | No |
| RBI compliance | Append-only consents and transitions; `RateQuote` provenance | No |
| Sub-month tenures | `Tenure.days` | No |
| Multi-country | `Money.currency`, `BusinessDate.calendar` | No |

**Every one lands as a field on an existing type.** That is the test a domain
model should pass: growth adds data, not structure.

---

## 7. Distance from the current implementation

Not a migration plan — a map.

| Greenfield | Today | Gap |
|---|---|---|
| `Money` (minor units, bigint) | `number` rupees | Real; fractional rupees currently possible |
| `Rate` (bps) | `number` percent | Real but low-frequency |
| `Tenure` (days) | `tenureMonths` | Real; deferred on a trigger |
| `RateCard` aggregate | `tenureRates[]` inline | Structural; R1 |
| `RateBand` discriminators | tenure only | Structural; R1 |
| `RateQuote` | `number \| null` | Structural; R1 |
| `appliedQuote` on booking | absent | **Before Review & Confirm** |
| `BusinessDate`, calendars | absent | Before maturity dates |
| Display-copy tier | mixed | **Enforceable today with one probe** |

**The cheapest high-value item is the tier rule** — it needs no type changes and
prevents the class of defect the current `DepositTerms` already exhibits.
