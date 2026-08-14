# Goal-Based FD — Testing Strategy

## 1. Purpose

This document defines the testing strategy for the Goal-Based FD POC.

The primary objective is to verify that:

1. User goal information is captured correctly.
2. The rule engine evaluates the goal correctly.
3. Suitable FD products are identified from available product data.
4. Recommendations are ranked consistently.
5. Recommendation explanations are generated from actual rule results.
6. The selected FD can continue into the existing Booking flow.
7. Existing Marketplace and Booking functionality remains unchanged.

This is a POC testing strategy. It focuses on validating the agreed business scenarios and the integration with the existing FD platform architecture.

---

# 2. Testing Scope

## In Scope

### Goal-Based FD

- Goal input validation
- Goal classification
- Rule evaluation
- Rule priority
- Product eligibility
- Product matching
- Recommendation ranking
- Match score
- Recommendation explanation
- No-match handling
- Partial-match handling

### Financial calculations

- Investment amount
- Target amount
- Tenure
- Interest rate
- Expected maturity
- Goal gap
- Rounding
- Invalid financial inputs

### User Flow

```text
Goal Selection
      ↓
Goal Details
      ↓
Rule Evaluation
      ↓
FD Matching
      ↓
Recommendation
      ↓
Recommendation Explanation
      ↓
Select FD
      ↓
Existing Booking Flow