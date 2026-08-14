# Goal-Based FD — User Flow

## 1. Purpose

Define the end-to-end customer journey for Goal-Based FD booking.

The Goal-Based FD experience is an intelligent entry point into
the existing FD Marketplace and Booking journey.

The POC uses rule-based recommendation logic.

---

## 2. High-Level Journey

Landing
  ↓
Understand Goal
  ↓
Select Goal
  ↓
Enter Goal Details
  ↓
Enter Customer / Investment Details
  ↓
Rule-Based Analysis
  ↓
Recommended FD Plan
  ↓
Understand Recommendation
  ↓
Review / Compare
  ↓
Select FD
  ↓
Existing FD Booking Flow
  ↓
Investment Details
  ↓
Nominee
  ↓
Continue Booking

---

## 3. Step 1 — Goal-Based FD Landing

The customer enters through the Goal-Based FD experience.

### Purpose

Explain that the platform helps customers choose an FD based
on their financial goal rather than simply searching for an FD.

### Primary CTA

Start Planning

### Secondary Action

Explore FDs

The existing Marketplace remains available as the direct
product-discovery journey.

---

## 4. Step 2 — Select Goal

The customer chooses the goal that best represents their need.

Example goals:

- Emergency Fund
- Children's Education
- Retirement
- Target Maturity
- Other / Custom Goal

The POC scenarios are:

1. Senior Citizen Investment
2. Multi-Goal Allocation
3. Target Maturity

---

## 5. Step 3 — Goal Details

The required inputs depend on the selected goal.

### Emergency / Short-Term Goal

Collect:

- Required amount
- Time horizon
- Liquidity requirement

### Education Goal

Collect:

- Required amount
- Target date / time horizon

### Retirement Goal

Collect:

- Investment amount
- Time horizon

### Target Maturity

Collect:

- Current investment amount
- Target maturity amount
- Time horizon

---

## 6. Step 4 — Customer Profile

Collect only information required by the POC rules.

Possible inputs:

- Age
- Senior citizen status
- Investment amount
- Risk preference where required
- Liquidity requirement

The system should avoid collecting unnecessary information.

---

## 7. Step 5 — Rule-Based Analysis

The system evaluates:

1. Goal
2. Customer eligibility
3. Investment amount
4. Time horizon
5. Liquidity requirement
6. Eligible FD products
7. Applicable benefits
8. Tenure suitability
9. Diversification requirements
10. Expected maturity
11. Target achievement

No AI/LLM is used in the POC.

---

## 8. Step 6 — Recommendation

The customer receives a recommended FD or FD plan.

The result should clearly show:

- Recommended bank
- FD product
- Investment amount
- Tenure
- Interest rate
- Expected maturity
- Goal
- Recommendation reason

Example:

"Recommended for your 2-year goal because the tenure matches
your investment horizon and the product provides an applicable
senior-citizen benefit."

---

## 9. Step 7 — Recommendation Explanation

The customer should understand WHY the system selected the FD.

Show:

### Goal Match

How the FD matches the customer's goal.

### Tenure Match

Why the selected tenure is appropriate.

### Eligibility

Why the customer qualifies.

### Return

Expected maturity based on the existing maturity calculation.

### Other Considerations

Applicable diversification, liquidity or product conditions.

The recommendation must be explainable without requiring the
customer to understand the underlying rules.

---

## 10. Step 8 — Review / Compare

The customer can:

- Review the recommended FD
- Compare with other eligible FDs
- Modify goal inputs
- Return to recommendation

The existing Marketplace comparison capability should be reused
where applicable.

Do not create a second comparison engine.

---

## 11. Step 9 — Select FD

Once the customer accepts an FD:

Goal-Based Recommendation
        ↓
Selected FD
        ↓
Existing FD Product
        ↓
Existing Booking Flow

The Goal-Based layer ends at product selection.

---

## 12. Step 10 — Existing Booking Flow

Reuse the existing Booking journey.

Current implemented flow:

Overview
   ↓
Investment Details
   ↓
Nominee
   ↓
Future Booking Steps

Goal-Based FD should not duplicate these screens.

The selected FD should be passed into the existing booking
domain and draft model.

---

## 13. Multi-Goal Branch

For customers with multiple goals:

Customer
   ↓
Multiple Goals
   ↓
Goal 1 ──→ Suitable FD
Goal 2 ──→ Suitable FD
Goal 3 ──→ Suitable FD
   ↓
Combined FD Plan
   ↓
Review Allocation
   ↓
Select Products
   ↓
Existing Booking

Example:

₹25,00,000

├── Emergency → ₹5,00,000
├── Education → ₹10,00,000
└── Retirement → ₹10,00,000

The system explains the allocation for each goal.

---

## 14. Target Maturity Branch

Customer enters:

Investment = ₹20,00,000
Target = ₹27,00,000
Horizon = 5 years

        ↓

Evaluate eligible FDs
        ↓
Calculate expected maturity
        ↓
Compare with target
        ↓

      ┌───────────────┐
      │ Target met?   │
      └───────┬───────┘
              │
       ┌──────┴──────┐
       │             │
      YES            NO
       │             │
Recommended      Show gap
Plan              │
       │          Suggest:
       │          • Increase amount
       │          • Extend tenure
       │          • Modify allocation
       │
       └──────┬──────┘
              ↓
          Review Plan
              ↓
          Select FD
              ↓
       Existing Booking

---

## 15. Senior Citizen Branch

Customer enters profile.

        ↓

Senior citizen eligible?
        ↓
      YES
        ↓
Find applicable FD benefits
        ↓
Match goal + tenure
        ↓
Recommend suitable FD
        ↓
Explain senior-citizen benefit
        ↓
Existing Booking

The system must only show benefits available in the product
data.

---

## 16. Failure / No Suitable FD

If no suitable FD satisfies the rules:

Show:

"We couldn't find an FD that matches all your requirements."

Then explain the reason where possible.

Possible actions:

- Change investment amount
- Change time horizon
- Review goal
- Explore Marketplace

The system must not recommend an ineligible product simply
because no perfect match exists.

---

## 17. Rule-Based vs AI Boundary

### POC

Customer Input
    ↓
Rule Engine
    ↓
Recommendation
    ↓
Explanation
    ↓
Booking

### Future

Customer Input
    ↓
AI / Intelligence Layer
    ↓
Rule Validation
    ↓
Recommendation
    ↓
Explanation
    ↓
Booking

The existing FD domain remains underneath both approaches.

---

## 18. Existing Platform Reuse

Goal-Based FD should reuse:

- Existing FD product model
- Existing rate model
- Existing maturity calculation
- Existing Marketplace
- Existing comparison
- Existing Booking
- Existing investment configuration
- Existing draft architecture
- Existing design system

Goal-Based FD is an additional product capability,
not a replacement for the existing platform.

---

## 19. POC Screen Map

### New Goal-Based Screens

1. Goal-Based Landing
2. Goal Selection
3. Goal Details
4. Customer/Profile Inputs
5. Recommendation Loading / Analysis
6. Recommendation Result
7. Recommendation Explanation
8. Plan Review

### Existing Screens Reused

9. Marketplace Product Details
10. Comparison
11. Booking Overview
12. Investment Details
13. Nominee
14. Future Booking Steps

---

## 20. Core UX Principle

The customer should feel:

"I tell the platform what I want to achieve,
and it helps me choose the appropriate FD."

Not:

"I search through hundreds of FD products
and decide everything myself."

---

## 21. POC Boundary

The Goal-Based experience does NOT:

- Execute bank transactions directly
- Replace Booking
- Replace Marketplace
- Use AI
- Predict customer behaviour
- Automatically invest money
- Guarantee financial outcomes
- Invent unavailable FD products or rates