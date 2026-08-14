# Goal-Based FD Booking — Implementation Plan

## 1. Objective

Implement the Goal-Based FD Booking experience as a feature on top of the existing FD Marketplace and Booking platform.

The POC should allow a customer to:

1. Select or describe a financial goal.
2. Provide the minimum information required to understand that goal.
3. Apply predefined business rules.
4. Identify suitable FD options from the existing FD product data.
5. Explain why the recommended FD is suitable.
6. Allow the customer to continue into the existing FD booking flow.

The implementation must enhance the existing platform rather than replace or redesign the current architecture.

---

## 2. Implementation Principles

### 2.1 Preserve the existing architecture

The Goal-Based FD feature must be implemented as a feature/module within the existing platform architecture.

Do not introduce a new platform-level architecture.

Existing:

- Marketplace
- Booking
- Shared UI components
- Existing domain models
- Existing state management
- Existing validation patterns
- Existing routing structure

should continue to work without modification unless a change is genuinely required by the Goal-Based FD feature.

---

### 2.2 Rule-based first

The current MVP/POC will use deterministic business rules.

The system must not depend on:

- LLMs
- Generative AI
- RAG
- ML models
- external AI services

The rule engine should produce deterministic and explainable recommendations.

Example:

```text
Goal
  ↓
Goal parameters
  ↓
Business rules
  ↓
Eligibility filtering
  ↓
FD ranking
  ↓
Recommendation