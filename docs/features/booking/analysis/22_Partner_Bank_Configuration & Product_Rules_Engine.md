Version: 1.0
Module: FD Booking
Document Type: Product Architecture & Platform Capability

1. Purpose

The Partner Bank Configuration & Product Rules Engine defines how the FD Investment Platform supports multiple partner banks through a single, standardized booking experience.

Instead of creating custom booking flows for every bank, the platform uses configurable rules to dynamically adapt the user journey, validations, business logic, required documents, and API integrations based on the selected partner bank.

The objective is to provide users with a consistent experience while allowing each partner bank to enforce its own regulatory and operational requirements.

2. Problem Statement

Every partner bank has different requirements.

Examples include:

Minimum investment amount
Supported tenures
Interest payout options
Nominee requirements
Joint holder support
Required KYC documents
Payment methods
Account verification process
API payload structure
Certificate generation timeline

Building separate booking flows for every bank would lead to:

Duplicate development effort
Higher maintenance costs
Inconsistent user experience
Longer onboarding time for new banks

The platform should instead adapt behavior through configuration, not through duplicated code.

3. Objectives

The Rules Engine should enable the platform to:

Support multiple partner banks using one booking flow.
Configure business rules without frontend changes where possible.
Reduce engineering effort for onboarding new banks.
Maintain a consistent user experience.
Centralize partner-specific logic.
Support future expansion to other investment products.
4. Design Principles
Configuration Over Customization

Business behavior should be driven by configuration rather than hardcoded implementations.

One Booking Experience

Users should feel they are investing through a single trusted platform, regardless of the underlying bank.

Progressive Adaptation

Only show fields, validations, and steps that are required for the selected bank.

Extensibility

New partner banks should be added primarily by creating configuration, not rewriting booking screens.

5. High-Level Architecture
                Partner Bank Configuration Repository
                               │
                               ▼
                Configuration & Rules Engine
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
   Booking Engine        Validation Engine      API Mapping
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
                      Standardized User Experience
6. Configuration Categories
6.1 Bank Profile

Defines the identity of the partner bank.

Example attributes:

Bank Name
Bank Code
Logo
Support Contact
Working Hours
Regulatory Information
6.2 Product Configuration

Defines product-level capabilities.

Examples:

Minimum investment
Maximum investment
Available tenures
Interest payout options
Senior citizen rates
Premature withdrawal support
6.3 Booking Rules

Defines booking behavior.

Examples:

Nominee mandatory or optional
Multiple nominees supported
Joint holder supported
Guardian required for minors
Existing customer shortcut available
6.4 Validation Rules

Examples:

PAN mandatory
Aadhaar mandatory
IFSC validation
Account ownership verification
Mobile verification
Email verification
6.5 Payment Rules

Examples:

UPI supported
Net Banking supported
NEFT/RTGS supported
Debit mandate supported
Maximum UPI amount
Payment timeout
6.6 Document Requirements

Examples:

PAN Card
Aadhaar
Address Proof
Signature
Photograph
Additional declarations
6.7 Settlement Rules

Examples:

Booking confirmation SLA
FD certificate generation
Cooling-off period
Cancellation window
7. Dynamic Screen Behavior

The Booking Engine evaluates configuration before rendering each step.

Example:

Configuration	UI Behavior
Nominee Mandatory	Display nominee step and require completion
Nominee Optional	Allow user to skip with an informational message
Joint Holder Supported	Show Joint Holder section
Monthly Payout Not Supported	Hide monthly payout option
UPI Not Supported	Remove UPI from payment methods
8. Dynamic Form Definitions

Each field is described using metadata rather than hardcoded UI logic.

Example field definition:

Property	Example
Field ID	nominee_name
Type	Text
Required	Yes
Max Length	100
Validation	Alphabetic
Visible	True
Editable	True

The Booking Engine interprets these definitions to render the form.

9. API Mapping

Different banks often require different payloads.

Instead of changing frontend logic, the platform should map a standard booking model to each bank's API contract.

Conceptually:

Platform Booking Model
          │
          ▼
API Mapping Layer
          │
   ┌──────┼──────┐
   ▼      ▼      ▼
Bank A  Bank B  Bank C

This keeps the frontend independent of partner-specific payload structures.

10. Versioning Strategy

Configurations should be versioned independently of application releases.

Benefits:

Update business rules without deploying the frontend.
Roll back configuration changes safely.
Support different rule sets for different products.
11. Governance

Every partner bank configuration should undergo:

Product Review
Compliance Review
Engineering Validation
QA Verification

before being activated.

12. Non-Functional Requirements

The Rules Engine should provide:

Low-latency configuration retrieval.
High availability.
Auditability of rule changes.
Backward compatibility.
Secure access controls.
Configuration caching.
13. Future Extensibility

The same engine should support future products, including:

Corporate Fixed Deposits
Bonds
Mutual Funds
Government Securities
Recurring Deposits

Only the configuration changes; the underlying booking framework remains reusable.

14. Architecture Decision Records (ADR)
ADR-001 — Configuration-Driven Platform

Decision: Partner-specific behavior will be managed through configuration rather than separate booking implementations.

Rationale: Reduces code duplication and accelerates onboarding of new partner banks.

ADR-002 — Standardized User Experience

Decision: Users interact with a unified booking experience regardless of the selected bank.

Rationale: Builds trust, reduces cognitive load, and simplifies user education.

ADR-003 — Metadata-Based Forms

Decision: Form rendering should be driven by metadata where practical.

Rationale: Enables flexible adaptation to partner requirements while minimizing code changes.

15. Success Metrics

The Rules Engine is considered successful if it achieves:

New partner bank onboarding with minimal frontend code changes.
Consistent booking experience across all banks.
Reduced engineering effort for partner integrations.
High configuration accuracy.
Faster time-to-market for new products.
Improved maintainability.
Document Outcome

The Partner Bank Configuration & Product Rules Engine establishes the architectural foundation for a scalable, multi-bank FD platform. By separating partner-specific rules from the booking experience, the platform delivers a consistent user journey while remaining flexible enough to support diverse banking requirements and future financial products without redesigning the application.