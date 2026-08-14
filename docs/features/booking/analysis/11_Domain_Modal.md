11 — Domain Model (Business Domain Architecture)
Purpose of this Document

The Domain Model defines the core business entities, their responsibilities, relationships, ownership, and lifecycle within the FD Booking module.

Unlike a database schema, which describes how data is stored, the Domain Model describes how the business operates.

It establishes a shared business language across Product, Engineering, Design, QA, and Business teams, ensuring every stakeholder refers to the same concepts with the same meaning.

The objective is to build a technology platform based on stable business domains rather than page-specific implementations.

Why Domain Modeling?

A common mistake in software projects is designing the database before understanding the business.

Instead, we define:

Business

↓

Domains

↓

Capabilities

↓

Entities

↓

Database

↓

API

↓

Frontend

This ensures the implementation reflects business needs rather than technical shortcuts.

Core Business Domains

For the Booking module, the primary business domains are:

FD Investment Platform
│
├── Investor Domain
├── Investment Product Domain
├── Booking Domain
├── Nominee Domain
├── Banking Domain
├── Payment Domain
├── Compliance Domain
├── Portfolio Domain
└── Notification Domain (Future)

Each domain owns its own business rules and data.

Domain 1 — Investor
Purpose

Represents the individual making investments through the platform.

Responsibilities
Maintain identity.
Store verified profile information.
Track regulatory status.
Manage contact details.
Link investment accounts.
Owns
Personal Information
Verification Status
PAN
Aadhaar Status
Contact Details
Residential Status
Used By
Booking
Portfolio
Support
KYC
Future Products
Lifecycle
Registered

↓

Verified

↓

Eligible

↓

Active Investor
Domain 2 — Investment Product
Purpose

Represents an investment opportunity offered through the platform.

Owns
Bank
Interest Rate
Tenure Options
Minimum Amount
Maximum Amount
Interest Payout Rules
Product Status
Responsibilities

Provide all information required for users to evaluate an FD before booking.

Lifecycle
Created

↓

Published

↓

Available

↓

Unavailable

↓

Archived
Domain 3 — Booking
Purpose

Represents the user's intent to invest in a selected FD product.

This is the central domain of the Booking module.

Owns
Booking Status
Selected Product
Investment Amount
Booking Timestamp
Booking Reference
Current Workflow State
Lifecycle
Initiated

↓

In Progress

↓

Review

↓

Payment Pending

↓

Processing

↓

Confirmed

↓

Cancelled

↓

Failed
Relationships

Booking references:

Investor
Investment Product
Nominee
Bank Account
Payment
Consent
Domain 4 — Nominee
Purpose

Represents the beneficiary associated with an investment.

Owns
Nominee Information
Relationship
Guardian Information
Verification Status (Future)
Lifecycle
Created

↓

Verified

↓

Associated with Booking
Product Decision

Nominees belong to the investor profile and can be reused across multiple investments, subject to regulatory and business rules.

Domain 5 — Banking
Purpose

Represents the user's linked bank accounts for funding and maturity proceeds.

Owns
Account Number
IFSC
Bank Name
Verification Status
Primary Account
Lifecycle
Added

↓

Verified

↓

Primary / Secondary

↓

Active

↓

Removed
Product Decision

A user may have multiple linked bank accounts, but each booking should reference one funding account and one maturity credit account (which may be the same account).

Domain 6 — Payment
Purpose

Represents the financial transaction that funds the investment.

Owns
Payment Amount
Payment Method
Transaction ID
Payment Status
Retry Information
Failure Reason
Lifecycle
Created

↓

Initiated

↓

Pending

↓

Successful

↓

Failed

↓

Refunded (Future)
Product Decision

Payment is an independent business process and should not be tightly coupled to the booking workflow.

Domain 7 — Compliance
Purpose

Represents all regulatory declarations and user acknowledgements required for investment.

Owns
Consent
Declarations
Terms Acceptance
Audit Timestamp
Lifecycle
Generated

↓

Accepted

↓

Recorded

↓

Archived
Product Decision

Compliance records must be immutable after acceptance to maintain a reliable audit trail.

Domain 8 — Portfolio
Purpose

Represents a successfully created investment owned by the investor.

Owns
Investment Holdings
Current Status
Maturity Date
Returns
Certificate Reference
Lifecycle
Created

↓

Active

↓

Matured

↓

Closed
Product Decision

Only successfully confirmed bookings become portfolio holdings.

Domain Relationship Diagram
                           Investor
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
 Nominee                  Bank Account          Portfolio
        │                      ▲
        │                      │
        └──────────────┐       │
                       ▼       │
                    Booking ───┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
Investment Product   Payment   Compliance

This model shows the business relationships while keeping each domain independent.

Domain Ownership Matrix
Domain	Primary Owner	Shared With
Investor	Investor Service	Booking, Portfolio
Investment Product	Product Service	Marketplace, Booking
Booking	Booking Service	Payment, Portfolio
Nominee	Investor Service	Booking
Banking	Banking Service	Booking, Portfolio
Payment	Payment Service	Booking
Compliance	Compliance Service	Booking
Portfolio	Portfolio Service	Dashboard, Notifications
Domain Boundaries

Each domain is responsible for its own business rules.

For example:

Booking Domain

Responsible for:

Booking status
Workflow progression
Investment initiation

Not responsible for:

Payment gateway logic
Investor verification algorithms
Bank account validation

This separation prevents business logic from becoming tightly coupled.

Design Implications
Product Decisions
Treat each business domain as an independent capability with clear ownership.
Avoid mixing unrelated responsibilities within a single domain.
Reuse shared domains across current and future investment products.
UX Decisions
Present information based on business domains rather than technical entities.
Ensure users experience consistent behaviors for shared domains such as Investor Profile and Bank Account Management.
Engineering Decisions
Structure backend services, frontend modules, and APIs around domain boundaries.
Enforce a single source of truth for each domain.
Avoid cross-domain data duplication.
Use domain events for communication between services where appropriate.
QA Decisions

Each domain should have dedicated test coverage for:

Business rules.
State transitions.
Validation.
Integration with dependent domains.
Failure and recovery scenarios.
Success Indicators

The Domain Model is successful when:

Every business concept has a clear owner.
No business rule exists in multiple domains.
New investment products can reuse existing domains.
Teams share a consistent business vocabulary.
Architecture remains maintainable as the platform scales.
Domain Decision Records
Decision 01 — Booking as an Independent Domain

Decision: Model Booking as its own business domain rather than embedding it within the Investment Product.

Why: A booking represents a user's transaction and workflow, while an investment product represents a market offering. Their lifecycles are independent.

Decision 02 — Payment as a Separate Domain

Decision: Keep Payment independent of Booking.

Why: Payment processing, retries, reconciliation, and refunds have their own lifecycle and integrations. Separating them improves resilience and allows payment capabilities to be reused across future products.

Decision 03 — Portfolio Created from Booking

Decision: A Portfolio Holding is created only after the partner bank confirms the investment.

Why: This ensures the portfolio reflects only successful investments and avoids displaying pending or failed bookings as active holdings.

Document Outcome

The Domain Model establishes the business foundation of the FD Booking module. It defines the core domains, their responsibilities, ownership, relationships, and lifecycles, creating a shared business language that guides architecture, APIs, database design, frontend implementation, and testing.

By modeling the platform around stable business domains rather than screens or tables, we create an architecture that can evolve to support new investment products, partner integrations, and future capabilities while remaining maintainable and consistent.