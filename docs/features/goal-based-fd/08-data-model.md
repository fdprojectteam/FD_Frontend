# Goal-Based FD Booking — Data Model

## 1. Purpose

This document defines the data contracts required to implement Goal-Based FD Booking.

The model must support:

- Goal capture
- Goal-specific inputs
- Rule evaluation
- FD eligibility
- FD suitability
- Recommendation ranking
- Recommendation explanation
- Existing Marketplace integration
- Existing Booking integration

The POC uses deterministic rule-based logic.

No AI/LLM-specific data model is introduced at this stage.

---

# 2. Core Data Ownership

The most important architectural rule is:

> Goal-Based FD must consume the existing FD product model. It must not create a second FD product catalogue.

The ownership is:

```text
┌───────────────────────────────┐
│        Goal-Based FD          │
│                               │
│ Goal                          │
│ Goal Parameters               │
│ Rule Evaluation               │
│ Recommendation                │
│ Recommendation Reasons        │
└───────────────┬───────────────┘
                │
                │ reads
                ▼
┌───────────────────────────────┐
│     Existing FD Product       │
│          Model                │
│                               │
│ Product                       │
│ Bank                          │
│ Tenure                        │
│ Rate                          │
│ Minimum Investment            │
│ Payout Options                │
└───────────────┬───────────────┘
                │
                │ productId
                ▼
┌───────────────────────────────┐
│      Existing Booking        │
│                               │
│ Investment                    │
│ Tenure                        │
│ Payout                        │
│ Nominee                       │
│ Confirmation                  │
└───────────────────────────────┘