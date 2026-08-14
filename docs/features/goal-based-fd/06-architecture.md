# Goal-Based FD — Architecture

## 1. Architecture Objective

Build Goal-Based FD as an additive feature on top of the existing FD platform.

The POC must:
- Preserve the existing FD Domain
- Preserve the existing Marketplace
- Preserve the existing Booking flow
- Introduce Goal Planning
- Introduce a Rule-Based Recommendation Engine
- Reuse existing FD product/rate/tenure data
- Hand the selected recommendation into the existing booking journey

No replacement of the current platform architecture is required.

---

## 2. High-Level Architecture

Customer
   ↓
Goal Planning
   ↓
Rule-Based Recommendation Engine
   ↓
Existing FD Domain
   ↓
Recommendation Result
   ↓
Marketplace / Compare
   ↓
Existing Booking Flow

Existing Booking Flow:
Overview → Investment Details → Nominee → Confirmation → Success

---

## 3. New vs Existing Components

### New

#### Goal Planning Module
Responsible for:
- Goal selection
- Investment amount
- Target amount
- Time horizon
- Customer profile
- Preferences

#### Rule-Based Recommendation Engine
Responsible for:
- Eligibility evaluation
- Goal matching
- Tenure matching
- Rate/benefit evaluation
- Allocation
- Diversification
- Maturity calculation
- Target-gap calculation
- Recommendation reasons
- Warnings

### Existing

#### FD Domain
Source of truth for:
- FD products
- Banks
- Tenures
- Rates
- Benefits
- Eligibility
- Payout options

#### Marketplace
Responsible for:
- FD product details
- Comparison
- Selection

#### Booking
Responsible for:
- Investment configuration
- Nominee
- Confirmation
- Final booking journey

---

## 4. Data Flow

Goal Input
   ↓
Goal Configuration
   ↓
Load eligible FD products
   ↓
Apply rules
   ↓
Filter unsuitable products
   ↓
Match suitable tenure
   ↓
Calculate expected maturity
   ↓
Allocate investment
   ↓
Check target
   ↓
Generate recommendation
   ↓
Show reasons / warnings
   ↓
Customer reviews
   ↓
Customer selects FD
   ↓
Existing Booking Flow

---

## 5. Rule Engine Responsibility

The rule engine should NOT own FD product data.

It consumes data from the FD Domain and applies business rules.

Example:

FD Domain:
    Product A
    Bank A
    2 Years
    7.25%
    Senior benefit
    Min ₹10,000

Goal:
    Retirement
    ₹5,00,000
    5 Years

Rule Engine:
    → Check eligibility
    → Check tenure suitability
    → Calculate maturity
    → Apply customer benefit
    → Apply diversification
    → Rank suitable products

Output:
    Recommended FD Plan