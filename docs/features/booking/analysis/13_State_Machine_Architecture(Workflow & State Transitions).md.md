13 — State Machine Architecture (Workflow & State Transitions)
Purpose of this Document

The State Machine Architecture defines the lifecycle of an FD Booking from initiation to completion.

Unlike screen navigation, which describes where users move within the interface, the state machine describes the business state of the booking itself.

Each booking exists in exactly one state at any given time and may transition only through explicitly defined events and business rules.

This architecture ensures consistency across frontend applications, backend services, partner integrations, and operational processes while providing a robust foundation for recovery, auditing, and future scalability.

Objectives

The State Machine answers:

What states exist?
Which transitions are valid?
Which actor initiates each transition?
Which business rules apply?
Which transitions are prohibited?
How are failures handled?
How are interrupted workflows recovered?
State Machine Principles

The Booking workflow follows these principles:

Single Source of Truth

A booking can exist in only one primary state at a time.

Explicit Transitions

No state change occurs without a defined event.

Deterministic Behavior

Given the same state and event, the system always produces the same outcome.

Recoverability

Interrupted workflows should resume from the current state rather than restarting.

Auditability

Every transition must be recorded with:

Previous State
New State
Timestamp
Triggering Event
Actor
Correlation ID (optional but recommended)
Booking Lifecycle
Created
    │
    ▼
Investment Validated
    │
    ▼
Investor Verified
    │
    ▼
Configuration Completed
    │
    ▼
Review Completed
    │
    ▼
Consent Accepted
    │
    ▼
Payment Initiated
    │
    ▼
Payment Processing
    │
    ▼
Payment Successful
    │
    ▼
Booking Processing
    │
    ▼
Partner Confirmation
    │
    ▼
Confirmed
    │
    ▼
Portfolio Created
Failure States
Payment Failed

Booking Failed

Cancelled

Expired

Pending Confirmation

Retry Required

These are valid business states, not exceptions.

State Definitions
State 1 — Created
Meaning

User has initiated the booking.

Entry Event

Invest Now clicked.

Exit Event

Investment validation succeeds.

Allowed Actions
Cancel
Continue
State 2 — Investment Validated
Meaning

Selected FD is still available.

Validated:

Product Status
Interest Rate
Investment Limits
Exit Event

Investor verification.

State 3 — Investor Verified
Meaning

Investor satisfies onboarding requirements.

Includes:

Identity
Regulatory Requirements
Eligibility
Exit Event

Configuration completed.

State 4 — Configuration Completed
Meaning

Investment options finalized.

Examples:

Amount
Payout
Renewal
Exit Event

Review begins.

State 5 — Review Completed
Meaning

User has reviewed all information.

Exit Event

Consent accepted.

State 6 — Consent Accepted
Meaning

Required declarations accepted.

Exit Event

Payment initiated.

State 7 — Payment Initiated
Meaning

Payment request created.

Possible Next States
Payment Processing
Payment Failed
State 8 — Payment Processing
Meaning

Payment gateway processing transaction.

Allowed Outcomes
Success
Failed
Pending
Timeout
State 9 — Payment Successful
Meaning

Funds successfully received.

Booking has NOT yet been confirmed.

This distinction is important.

State 10 — Booking Processing

Platform communicates with:

Partner Bank

↓

Booking Engine

↓

Confirmation Service

Possible Outcomes

Confirmed
Pending
Failed
State 11 — Pending Confirmation

Partner bank has received the request but has not yet returned a final status.

User sees:

Your investment has been submitted and is awaiting confirmation from the partner bank. We'll notify you once it's complete.

State 12 — Confirmed

Booking officially exists.

Generate:

Booking Reference
Certificate Request
Portfolio Creation Event
State 13 — Portfolio Created

Terminal Success State.

The investment becomes visible in:

Portfolio

Dashboard

Notifications

Reports

Failure States
Payment Failed

User may retry.

No information lost.

Booking Failed

Payment succeeded.

Partner rejected booking.

Requires investigation and recovery.

Cancelled

User voluntarily exits.

Progress retained if permitted.

Expired

Booking timed out.

Requires restart.

State Transition Matrix
Current State	Event	Next State
Created	Product Valid	Investment Validated
Investment Validated	Investor Eligible	Investor Verified
Investor Verified	Configuration Complete	Configuration Completed
Configuration Completed	Review Complete	Review Completed
Review Completed	Consent Accepted	Consent Accepted
Consent Accepted	Payment Started	Payment Initiated
Payment Initiated	Gateway Accepted	Payment Processing
Payment Processing	Success	Payment Successful
Payment Processing	Failure	Payment Failed
Payment Successful	Booking Submitted	Booking Processing
Booking Processing	Bank Confirmed	Confirmed
Booking Processing	Awaiting Response	Pending Confirmation
Confirmed	Portfolio Synced	Portfolio Created
State Ownership
State	Primary Owner
Created	Frontend
Investment Validated	Booking Service
Investor Verified	Investor Service
Configuration Completed	Booking Service
Review Completed	Frontend
Consent Accepted	Compliance Service
Payment Initiated	Payment Service
Payment Processing	Payment Gateway
Payment Successful	Payment Service
Booking Processing	Booking Service
Pending Confirmation	Partner Integration
Confirmed	Booking Service
Portfolio Created	Portfolio Service
Events

Events trigger transitions.

Examples:

INVESTMENT_SELECTED

INVESTOR_VERIFIED

AMOUNT_UPDATED

REVIEW_COMPLETED

CONSENT_ACCEPTED

PAYMENT_SUCCESSFUL

BOOKING_CONFIRMED

PORTFOLIO_SYNCHRONIZED

Events are immutable records and provide a reliable audit trail.

Invalid Transitions

The system must reject transitions that violate the defined workflow.

Examples:

Invalid Transition	Reason
Created → Payment Processing	Mandatory validation steps skipped
Payment Failed → Portfolio Created	No successful booking exists
Review Completed → Confirmed	Payment and processing not completed
Cancelled → Confirmed	User cancelled the workflow
Timeout & Recovery Rules
State	Timeout Behavior
Payment Processing	Retry or pending status after configured timeout
Pending Confirmation	Continue polling or await asynchronous notification
Created	Expire after inactivity threshold
Review Completed	Preserve progress for configurable duration

Recovery should resume from the last valid state whenever possible.

State Machine Diagram
Created
   │
   ▼
Investment Validated
   │
   ▼
Investor Verified
   │
   ▼
Configuration Completed
   │
   ▼
Review Completed
   │
   ▼
Consent Accepted
   │
   ▼
Payment Initiated
   │
   ▼
Payment Processing
   ├──────────────┐
   │              │
   ▼              ▼
Payment Failed  Payment Successful
                     │
                     ▼
             Booking Processing
              ├─────────────┬─────────────┐
              ▼             ▼             ▼
       Confirmed   Pending Confirmation  Booking Failed
              │
              ▼
      Portfolio Created
Design Implications
Product Decisions
Separate payment completion from booking confirmation.
Treat pending confirmation as a first-class business state.
Ensure every state communicates clear next steps to the user.
UX Decisions
Reflect the current workflow state in the interface.
Provide meaningful messaging for pending and failure states.
Preserve user confidence by avoiding ambiguous loading experiences.
Engineering Decisions
Implement the booking workflow as a state machine rather than page-based logic.
Centralize state transition validation in the domain layer.
Emit domain events for each successful transition.
Make transitions idempotent where appropriate to support retries.
QA Decisions

Test every valid transition, invalid transition, timeout, retry path, and recovery scenario. State coverage should be treated as a core quality metric.

State Transition Decision Records
Decision 01 — Separate Payment Success from Booking Confirmation

Decision: Payment completion does not automatically imply a successful booking.

Why: Payment and partner-bank confirmation are independent processes. Keeping them separate allows the platform to handle delayed confirmations, reconciliation, and exceptional cases without misleading users.

Decision 02 — Introduce Pending Confirmation

Decision: Model "Pending Confirmation" as an explicit state.

Why: Partner responses may be asynchronous. Treating this as a defined state improves transparency, enables notifications, and avoids indefinite loading indicators.

Decision 03 — Preserve Workflow State

Decision: Resume interrupted bookings from the last valid state whenever feasible.

Why: Users should not lose progress because of session expiry, network interruptions, or application restarts, improving both user experience and completion rates.

Document Outcome

The State Machine Architecture defines the operational lifecycle of the Booking workflow. By modeling the journey as explicit business states and controlled transitions, the platform gains consistency, recoverability, auditability, and scalability.

This document becomes the authoritative reference for workflow implementation across frontend, backend, partner integrations, and testing, ensuring that every booking follows a predictable and resilient lifecycle.