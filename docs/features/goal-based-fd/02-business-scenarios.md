# Goal-Based FD — Business Scenarios

## 1. Purpose

This document defines the confirmed business scenarios for the
Goal-Based FD POC.

The POC will demonstrate three recommendation scenarios using
rule-based logic.

AI/ML is not part of the POC.

---

# 2. Scenario 1 — Senior Citizen FD Investment

## Customer Situation

A senior citizen has ₹5,00,000 to invest and does not need the
money before 2 years.

## Inputs

| Input | Value |
|---|---|
| Investment Amount | ₹5,00,000 |
| Goal | Capital protection + fixed return |
| Time Horizon | 2 years / 730 days |
| Customer Type | Senior Citizen |
| Liquidity Requirement | Not required before maturity |
| Product | Bank FD |

## Expected Recommendation

The system should:

1. Identify the customer as a senior citizen.
2. Identify the required time horizon.
3. Find eligible FDs matching the 2-year horizon.
4. Apply applicable senior-citizen benefits.
5. Compare eligible products.
6. Recommend the most suitable FD.
7. Explain why it was recommended.
8. Allow the customer to proceed to booking.

## Recommendation Reason

The recommendation should consider:

- Time-horizon match
- Senior-citizen eligibility
- Applicable rate/benefit
- Expected return
- Product conditions

The system must not simply say:

"Highest rate = Best FD."

---

# 3. Scenario 2 — Multi-Goal FD Allocation

## Customer Situation

A customer has ₹25,00,000 and has three different financial goals.

## Goals

### Emergency Fund

| Input | Value |
|---|---|
| Amount | ₹5,00,000 |
| Timeline | 91 days |
| Intent | Short-term liquidity |

### Children's Education

| Input | Value |
|---|---|
| Amount | ₹10,00,000 |
| Timeline | 3 years |
| Intent | Goal matching + diversification |

### Retirement

| Input | Value |
|---|---|
| Amount | ₹10,00,000 |
| Timeline | 10 years |
| Intent | Long-term fixed return |

## Expected Recommendation

The system should:

1. Understand each goal separately.
2. Match each goal with an appropriate FD tenure.
3. Identify suitable FD products.
4. Allocate the available amount across suitable products.
5. Apply diversification rules.
6. Explain the allocation.
7. Show expected maturity for each allocation.
8. Show the combined plan.
9. Allow the customer to review and proceed to booking.

## Important Rule

The system should not automatically put the entire amount
into the FD with the highest rate.

Goal suitability and diversification must influence the recommendation.

---

# 4. Scenario 3 — Target Maturity

## Customer Situation

A customer has ₹20,00,000 and wants approximately ₹27,00,000
after 5 years.

## Inputs

| Input | Value |
|---|---|
| Investment Amount | ₹20,00,000 |
| Target Amount | ₹27,00,000 |
| Time Horizon | 5 years |
| Goal | Growth through FD |
| Risk Preference | Moderate |
| Diversification | Required |
| Product | Bank FD |

## Expected Recommendation

The system should:

1. Understand the target amount.
2. Identify the available time horizon.
3. Find suitable FD products.
4. Build a diversified allocation.
5. Calculate expected maturity.
6. Compare expected maturity against the target.
7. Show whether the target is achievable.
8. Explain the recommendation.

## Target Gap

If:

Expected Maturity < Target Amount

the system should show a gap and suggest possible actions:

- Increase investment amount
- Extend tenure
- Consider a different product mix

---

# 5. Common Recommendation Principles

All three scenarios should follow these principles.

## Goal First

The system starts with the customer's goal,
not simply the highest FD rate.

## Suitability

An FD must be suitable for:

- Goal
- Amount
- Time horizon
- Customer profile
- Eligibility
- Other applicable conditions

## Diversification

Where applicable, the system should avoid excessive
concentration in a single bank/product.

## Explainability

Every recommendation should answer:

> Why was this FD recommended?

## Transparency

The customer should see:

- Recommended bank
- Tenure
- Rate
- Investment allocation
- Expected maturity
- Reason for recommendation
- Important conditions
- Applicable deposit-insurance information

## Booking

Once the customer accepts a recommendation,
the system should hand off to the existing FD booking flow.

---

# 6. POC Boundaries

The POC does NOT implement:

- AI/ML recommendations
- LLM-based recommendations
- Live bank API integration
- Production rate feeds
- Dynamic learning
- Predictive recommendation
- Complete wealth-management planning

The recommendation engine will use deterministic,
rule-based conditions.