# Goal-Based FD — API Contract

**Feature:** Goal-Based FD Booking  
**Status:** POC Implementation Contract  
**Version:** 1.0  
**Date:** 2026-08  
**Related Documents:**
- `README.md`
- `02-business-scenarios.md`
- `03-rule-engine.md`
- `04-user-flow.md`
- `05-screen-specification.md`
- `06-architecture.md`
- `07-implementation-plan.md`
- `08-data-model.md`

---

# 1. Purpose

This document defines the API contract required for the Goal-Based FD Booking POC.

The API layer is responsible for:

1. Receiving the user's financial goal.
2. Receiving the user's basic preferences.
3. Validating the request.
4. Evaluating the rule-based scenarios.
5. Finding suitable FD products from the existing FD domain.
6. Calculating the required investment where applicable.
7. Returning explainable recommendations.
8. Passing the selected recommendation into the existing FD booking flow.

The API does NOT own the final booking transaction.

The existing Booking module remains responsible for the actual FD booking journey.

---

# 2. High-Level API Flow

```text
User
 │
 ▼
Goal-Based FD UI
 │
 │ POST /goal-based-fd/recommendations
 ▼
Goal-Based FD API
 │
 ├── Validate Input
 │
 ├── Normalize Goal
 │
 ├── Evaluate Rule Engine
 │
 ├── Query FD Product Domain
 │
 ├── Calculate Required Investment
 │
 ├── Rank Matching Products
 │
 └── Generate Explanation
 │
 ▼
Recommendation Response
 │
 ▼
Goal-Based FD Result Screen
 │
 ▼
User Selects FD
 │
 ▼
Existing FD Booking Flow