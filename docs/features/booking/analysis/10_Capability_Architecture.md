10 — Capability Architecture
Purpose of this Document

The Capability Architecture defines the reusable business capabilities required to deliver the FD Booking experience.

Rather than organizing the application around screens or pages, the platform is organized around independent capabilities that encapsulate business logic, user interactions, validation, and data management.

Each capability is designed to be modular, reusable, independently testable, and extensible. This architecture ensures that future investment products can leverage the same foundational capabilities without duplicating implementation.

The objective is to establish a capability-driven architecture that supports long-term scalability, maintainability, and consistent user experiences across the platform.

What is a Capability?

A capability represents a business function that delivers a specific outcome.

It is independent of:

Pages
Navigation
Layout
UI composition

A capability may be used by multiple modules throughout the platform.

Capability Architecture Overview
                     FD Booking

                          │
──────────────────────────┼──────────────────────────

Investment Summary

Investor Profile

Investment Configuration

Nominee Management

Bank Account Management

Review Engine

Consent Management

Payment Orchestration

Booking Processing

Booking Confirmation

Portfolio Synchronization

Each capability owns a specific responsibility and communicates with other capabilities through clearly defined interfaces.

Capability 1 — Investment Summary
Responsibility

Maintain a consistent representation of the selected investment throughout the user journey.

Provides
Bank Information
Product Details
Deposit Amount
Interest Rate
Tenure
Estimated Returns
Maturity Value
Maturity Date
Used By
Marketplace
Product Details
Booking
Review
Portfolio
Renewal
Notifications
Product Decision

The investment summary should remain consistent across the platform to reinforce user confidence and eliminate conflicting information.

Capability 2 — Investor Profile
Responsibility

Manage investor identity and regulatory information.

Owns
Personal Information
PAN
Aadhaar Status
Contact Details
Verification Status
Eligibility
Used By
Booking
Portfolio
KYC
Support
Future Products
Product Decision

The platform should reuse verified investor information wherever possible, minimizing repeated data entry.

Capability 3 — Investment Configuration
Responsibility

Capture and validate investment-specific choices.

Owns
Deposit Amount
Interest Payout Option
Renewal Preference
Maturity Instructions
Rules
Validate product limits.
Update return calculations in real time.
Prevent invalid configurations.
Capability 4 — Nominee Management
Responsibility

Manage beneficiary information.

Owns
Nominee Details
Relationship
Guardian Details
Allocation Rules (future)
Reusable Across
Booking
Portfolio Updates
Future Investment Products
Product Decision

Nominee information belongs to the investor, not to a single booking workflow.

Capability 5 — Bank Account Management
Responsibility

Manage linked bank accounts used for investment funding and maturity proceeds.

Owns
Linked Accounts
Verification Status
Primary Account
Maturity Credit Instructions
Future Expansion
Multiple Accounts
Joint Accounts
Corporate Accounts
Account Preferences
Capability 6 — Review Engine
Responsibility

Generate a comprehensive review of the investment before confirmation.

Aggregates
Investment Summary
Investor Profile
Nominee
Bank Account
Returns
Declarations
Product Decision

The review engine assembles information from multiple capabilities rather than storing duplicate data.

Capability 7 — Consent Management
Responsibility

Manage regulatory acknowledgements and user consent.

Owns
Terms Acceptance
Declarations
Regulatory Consent
Audit Trail
Engineering Consideration

Consent records should be immutable once accepted to maintain a reliable audit history.

Capability 8 — Payment Orchestration
Responsibility

Coordinate the payment lifecycle.

Handles
Payment Initiation
Status Tracking
Retry Logic
Timeout Handling
Failure Recovery
States
Created

↓

Pending

↓

Processing

↓

Success

↓

Failed

↓

Cancelled
Product Decision

Payment state must remain independent from the booking workflow so interrupted payments can be recovered without restarting the journey.

Capability 9 — Booking Processing
Responsibility

Coordinate communication between the platform and the partner bank after payment.

Handles
Booking Request
Partner Validation
Booking Status
Reference Generation
Retry Mechanisms
Failure Recovery
Outputs
Booking Status
Investment Record
Confirmation Data
Capability 10 — Booking Confirmation
Responsibility

Generate a trustworthy post-booking experience.

Displays
Booking Reference
Investment Summary
Certificate Timeline
Next Steps
Portfolio Availability
Product Decision

Confirmation should reduce uncertainty by clearly explaining what has happened and what the user can expect next.

Capability 11 — Portfolio Synchronization
Responsibility

Make the newly created investment available in the user's portfolio.

Handles
Investment Creation
Status Synchronization
Portfolio Updates
Maturity Tracking
Future Notifications
Future Expansion

This capability can also support imported investments and consent-based synchronization from external sources, enabling a unified portfolio experience.

Capability Interaction Model
Investment Summary
        │
        ▼
Investment Configuration
        │
        ▼
Investor Profile
        │
        ▼
Nominee Management
        │
        ▼
Bank Account Management
        │
        ▼
Review Engine
        │
        ▼
Consent Management
        │
        ▼
Payment Orchestration
        │
        ▼
Booking Processing
        │
        ▼
Booking Confirmation
        │
        ▼
Portfolio Synchronization

Each capability has a single responsibility and collaborates with others through defined interfaces, reducing coupling and improving maintainability.

Capability Ownership Matrix
Capability	Product	Frontend	Backend	Shared
Investment Summary	✓	✓	✓	✓
Investor Profile	✓	✓	✓	✓
Investment Configuration	✓	✓	✓	✓
Nominee Management	✓	✓	✓	✓
Bank Account Management	✓	✓	✓	✓
Review Engine	✓	✓		✓
Consent Management	✓	✓	✓	✓
Payment Orchestration	✓	✓	✓	✓
Booking Processing	✓		✓	✓
Booking Confirmation	✓	✓	✓	✓
Portfolio Synchronization	✓	✓	✓	✓
Design Implications
Product Decisions
Treat business capabilities as long-lived platform assets.
Build new investment journeys by composing existing capabilities.
Avoid embedding business rules directly into pages.
UX Decisions
Design capabilities as reusable interaction patterns.
Maintain consistent behaviors regardless of where a capability is used.
Ensure users experience the same investment summary, review flow, and confirmation style across the platform.
Engineering Decisions
Organize the codebase around feature modules and capabilities rather than page folders.
Expose well-defined interfaces between capabilities.
Keep each capability independently testable and deployable where appropriate.
Maintain a single source of truth for each business domain.
Quality Decisions

Every capability should have:

Unit tests
Integration tests
API contract validation
Accessibility verification
Performance benchmarks
Error and recovery scenarios
Document Outcome

The Capability Architecture defines the reusable business building blocks that power the FD Booking experience. By organizing the platform around capabilities instead of pages, the system becomes easier to maintain, extend, and reuse across future investment products.

This architecture creates a scalable foundation that supports the long-term vision of evolving from an FD marketplace into a comprehensive investment platform.