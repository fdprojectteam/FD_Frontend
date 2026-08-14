# Goal-Based FD — Rule Engine

## 1. Purpose

The Goal-Based FD Rule Engine converts customer goals and
financial inputs into explainable FD recommendations.

The POC uses deterministic rule-based logic.

No AI, ML, LLM, predictive model, or learning mechanism is
used in this POC.

---

# 2. Rule Engine Input

The engine may receive:

- Customer profile
- Customer age
- Senior citizen status
- Investment amount
- Goal type
- Goal amount
- Target maturity amount
- Time horizon
- Liquidity requirement
- Risk preference
- Diversification preference

The engine also receives eligible FD product data from the
existing FD domain.

---

# 3. Rule Engine Output

The engine should produce:

- Recommended FD/product
- Recommended tenure
- Recommended allocation
- Expected maturity amount
- Applicable customer benefits
- Recommendation reasons
- Warnings / gaps
- Target achievement status

The output must be explainable.

---

# 4. Rule Categories

The rules are divided into:

1. Goal Classification
2. Customer Eligibility
3. Tenure Matching
4. Product Eligibility
5. Rate/Benefit Evaluation
6. Allocation
7. Diversification
8. Target Maturity
9. Recommendation
10. Explanation

---

# 5. Goal Classification Rules

## R-GOAL-001 — Emergency Goal

IF:

goal = Emergency

THEN:

prefer short-duration FD products.

Reason:

Emergency funds require relatively higher liquidity.

---

## R-GOAL-002 — Education Goal

IF:

goal = Children's Education

THEN:

prefer FD tenure aligned with the education time horizon.

---

## R-GOAL-003 — Retirement Goal

IF:

goal = Retirement

THEN:

prefer longer-term FD products aligned with the retirement
time horizon.

---

## R-GOAL-004 — Capital Protection

IF:

goal requires capital protection and fixed return

THEN:

consider eligible FD products matching the customer's
time horizon.

---

# 6. Customer Eligibility Rules

## R-ELIG-001 — Senior Citizen

IF:

customer is eligible as a senior citizen

THEN:

consider senior-citizen FD rates/benefits where available.

The system must not invent a senior-citizen benefit if the
product data does not contain one.

---

## R-ELIG-002 — Product Eligibility

Only recommend products for which the customer is eligible.

---

# 7. Tenure Matching Rules

## R-TENURE-001 — Exact Match

IF:

FD tenure exactly matches the customer's goal horizon

THEN:

give the product a strong tenure-match preference.

---

## R-TENURE-002 — Goal Horizon Compatibility

If exact tenure is unavailable, evaluate available tenures
against the goal horizon.

The POC must use explicitly defined rules and must not
interpolate or invent a tenure/rate.

---

## R-TENURE-003 — Emergency Liquidity

For emergency goals:

prefer shorter available tenures.

---

# 8. Product Filtering Rules

Before recommendation, remove products that fail:

- Customer eligibility
- Required tenure constraints
- Investment amount constraints
- Product availability
- Required goal conditions

Only eligible products proceed to recommendation.

---

# 9. Rate and Benefit Evaluation

The system should consider:

- Applicable interest rate
- Senior-citizen benefit
- Tenure suitability
- Goal suitability
- Product conditions

IMPORTANT:

Highest interest rate alone does NOT determine the
recommendation.

The recommendation must consider the customer's goal.

---

# 10. Multi-Goal Allocation Rules

For a multi-goal scenario:

1. Separate the total investment by goal.
2. Determine the required timeline for each goal.
3. Determine suitable FD tenure for each goal.
4. Identify eligible products.
5. Allocate the required amount.
6. Apply diversification rules.
7. Calculate expected maturity for each allocation.
8. Calculate combined expected maturity.

---

# 11. Diversification Rules

Where diversification is required:

Do not automatically allocate the entire amount to one bank.

The recommendation may distribute the investment across
multiple eligible banks/products.

The exact concentration limit must come from configured
business rules.

The POC must not invent a percentage limit unless it has
been explicitly approved.

---

# 12. Target Maturity Rules

For target-based scenarios:

INPUT:

- Current investment
- Target maturity
- Time horizon
- Available FD products

Calculate:

expected maturity

Then compare:

expected maturity >= target

---

## R-TARGET-001 — Target Achieved

IF:

expected maturity >= target amount

THEN:

mark the target as achievable under the proposed plan.

---

## R-TARGET-002 — Target Gap

IF:

expected maturity < target amount

THEN:

calculate:

target gap =
target amount - expected maturity

Show the gap to the customer.

---

## R-TARGET-003 — Target Adjustment

When the target is not achievable, the system may present:

- Increase investment
- Extend tenure
- Modify product allocation

The system must not claim that the target is achievable when
the calculated maturity is below the target.

---

# 13. Recommendation Priority

Recommendation should follow this priority:

1. Customer eligibility
2. Goal suitability
3. Tenure suitability
4. Required liquidity
5. Target achievement
6. Applicable benefits
7. Diversification
8. Interest rate
9. Expected maturity

Rate should therefore NOT be the first or only criterion.

---

# 14. Recommendation Explanation

Every recommendation must provide explainable reasons.

Example:

"Recommended because the FD matches your 2-year investment
horizon and you are eligible for the applicable senior-citizen
benefit."

For a multi-goal plan:

"₹5,00,000 is allocated to a short-duration FD for your
emergency goal, while longer tenures are used for education
and retirement goals."

For a target goal:

"The proposed allocation is expected to mature to ₹27,00,000
within the selected horizon."

---

# 15. Rule Execution Flow

Customer Input
      ↓
Validate Input
      ↓
Classify Goal
      ↓
Check Customer Eligibility
      ↓
Filter Eligible FDs
      ↓
Match Goal → Tenure
      ↓
Evaluate Benefits
      ↓
Allocate Investment
      ↓
Apply Diversification
      ↓
Calculate Maturity
      ↓
Check Target
      ↓
Rank Suitable Options
      ↓
Generate Recommendation
      ↓
Generate Explanation

---

# 16. Important POC Constraints

The rule engine must NOT:

- Invent rates
- Invent bank products
- Interpolate rates
- Automatically choose the highest rate without considering
  the goal
- Claim a target is achievable without calculation
- Invent customer benefits
- Invent diversification limits
- Use AI/ML
- Modify the existing FD domain unnecessarily

---

# 17. Existing Architecture Boundary

The Rule Engine is an additional capability.

It does not replace:

- FD Domain
- Marketplace
- Booking
- Maturity calculation
- Existing product/rate models

Conceptually:

Goal Input
    ↓
Goal-Based Rule Engine
    ↓
Existing FD Domain
    ↓
Existing Marketplace
    ↓
Existing Booking

---

# 18. Rule Configuration

Rules should be represented as configurable business logic
where practical.

Example:

- Goal types
- Goal-to-tenure mapping
- Senior-citizen eligibility
- Diversification constraints
- Target calculation rules

Business rules should not be scattered across UI components.

---

# 19. Determinism

For identical:

- Customer inputs
- Goal
- FD product data
- Rate data
- Rule configuration

the engine must produce the same recommendation.

---

# 20. Future AI Extension

The POC rule engine should provide a clean boundary for
future AI integration.

Future architecture may become:

Customer Input
      ↓
AI / Intelligence Layer
      ↓
Rule Validation
      ↓
FD Recommendation
      ↓
Existing FD Domain
      ↓
Booking

AI is NOT implemented in this POC.