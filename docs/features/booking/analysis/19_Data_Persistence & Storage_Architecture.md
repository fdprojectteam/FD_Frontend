Purpose of this Document

The Data Persistence & Storage Architecture defines how business data is stored, protected, versioned, and managed throughout its lifecycle.

This document establishes the persistence strategy for the FD Investment Platform, ensuring that transactional integrity, auditability, scalability, and regulatory compliance are built into the foundation of the platform.

Rather than describing specific database tables, this document defines the architectural principles governing persistent data across all business domains.

Objectives

This document answers:

How should business data be stored?
Which service owns which data?
How is transactional consistency maintained?
Which data is immutable?
How is historical information preserved?
How are failures recovered?
How is data secured and retained?
How does the storage architecture support future growth?
Persistence Principles
1. Service-Owned Data

Every business capability owns its own persistent data.

No service writes directly into another service's data store.

Example:

Marketplace Service
        │
 Owns Product Data

Booking Service
        │
 Owns Booking Data

Payment Service
        │
 Owns Payment Data

Portfolio Service
        │
 Owns Portfolio Holdings

Ownership ensures clear responsibility and prevents coupling.

2. Single Source of Truth

Every business entity has exactly one authoritative storage location.

Examples:

Entity	Source of Truth
Investor	Investor Service
Product	Marketplace Service
Booking	Booking Service
Payment	Payment Service
Portfolio Holding	Portfolio Service
Consent	Compliance Service

Other services reference the data rather than duplicate ownership.

3. Transactional Integrity

Financial operations must maintain consistency.

Examples:

Booking creation
Payment confirmation
Portfolio creation

Critical operations should either complete successfully or fail safely without leaving inconsistent business states.

4. Immutable Financial Records

Certain records must never be modified after creation.

Examples:

Booking Reference
Transaction Reference
Consent Acceptance
Payment Confirmation
Audit Events

If business corrections are required, create a new compensating record rather than editing historical data.

5. Derived Data

Avoid storing values that can be recalculated unless historical accuracy requires persistence.

Derived examples:

Estimated Interest
Estimated Maturity Amount
Remaining Tenure

Persisted examples:

Confirmed Interest Rate
Confirmed Maturity Amount
Booking Timestamp
Data Classification
Master Data

Relatively stable business information.

Examples:

Partner Banks
Investment Products
Configuration
Interest Payout Types
Transactional Data

Created during business operations.

Examples:

Bookings
Payments
Portfolio Holdings
Reference Data

Shared lookup values.

Examples:

Relationship Types
Residential Status
Investment Categories
Audit Data

Historical records used for compliance.

Examples:

State Transitions
Consent Acceptance
Administrative Actions

Audit records should be append-only.

Operational Data

Supports platform operation.

Examples:

Session Information
Job Status
Notification Queue
Retry Metadata

Operational data may have shorter retention periods.

Data Lifecycle
Create
   │
   ▼
Validate
   │
   ▼
Persist
   │
   ▼
Read
   │
   ▼
Update (if permitted)
   │
   ▼
Archive
   │
   ▼
Retention
   │
   ▼
Secure Disposal

Each entity follows a defined lifecycle based on business and regulatory requirements.

Transaction Boundaries
Local Transactions

Used when a single service owns the complete operation.

Example:

Update Investor Contact Details
Distributed Business Processes

Used when multiple services participate.

Example:

Booking

↓

Payment

↓

Partner Confirmation

↓

Portfolio Creation

These should be coordinated through workflow orchestration and domain events rather than distributed database transactions.

Consistency Model
Scenario	Consistency
Payment Status	Strong Consistency
Booking Confirmation	Strong Consistency
Portfolio Creation	Eventual Consistency (after confirmation)
Notifications	Eventual Consistency
Analytics	Eventual Consistency

The platform applies the strongest consistency only where business correctness requires it.

Storage Strategy
Structured Data

Stores:

Investors
Products
Bookings
Payments
Portfolio Holdings

Characteristics:

ACID transactions
Indexed lookups
Referential integrity at the service boundary
Document Storage

Stores:

Investment Certificates
Statements
Regulatory Documents
Uploaded Files

Characteristics:

Immutable where applicable
Version-aware
Secure access
Cache

Stores:

Frequently accessed configuration
Product catalogue snapshots
Non-sensitive reference data

Cache must never become the source of truth.

Audit Storage

Every financial action should generate an audit record.

Minimum fields:

Audit ID
Entity Type
Entity ID
Previous State
New State
Actor
Timestamp
Correlation ID

Audit data should be tamper-evident and retained according to compliance requirements.

Data Versioning

Version business records where changes affect historical interpretation.

Examples:

Product Catalogue
Interest Rates
Consent Text
Regulatory Documents

Historical bookings should always reference the version that was effective at the time of investment.

Deletion Strategy
Hard Delete

Use only for transient or non-business operational data where appropriate.

Examples:

Temporary caches
Expired sessions
Soft Delete

Use when recovery or traceability is required.

Examples:

Saved nominees
Bank account preferences
Immutable Retention

Never delete:

Confirmed Bookings
Payment Records
Audit Events
Accepted Consents

These should remain available for compliance and historical reporting.

Backup & Recovery
Objectives
Protect against accidental data loss.
Support disaster recovery.
Preserve financial integrity.
Principles
Automated backups.
Point-in-time recovery where supported.
Regular restore validation.
Encrypted backup storage.
Geographic redundancy where required.
Security
Encryption

Sensitive information should be protected:

At rest.
In transit.
During backup.
Sensitive Data

Examples:

PAN
Bank Account Details
Personally Identifiable Information

Only authorized services may access sensitive fields, following the principle of least privilege.

Retention Strategy
Data Type	Retention Approach
Booking Records	Retain according to financial and regulatory requirements
Payment Records	Retain according to financial and regulatory requirements
Audit Logs	Long-term retention with integrity protection
Operational Logs	Configurable retention based on operational needs
Analytics Data	Retain according to business reporting policies

Retention periods should be configurable to support evolving regulatory requirements.

Cross-Service Data Access

Services should communicate through:

APIs
Domain Events
Read Models (where appropriate)

Direct database access between services is prohibited.

Storage Architecture Overview
                  Customer Applications
                           │
                           ▼
                    Business Services
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  Structured Data     Document Store       Cache
        │                  │                  │
        └──────────────┬───┴──────────────────┘
                       ▼
                 Backup & Recovery
                       │
                       ▼
                  Audit Repository
Design Implications
Product Decisions
Preserve financial records for the full required lifecycle.
Ensure users can trust that confirmed investments remain historically accurate.
Treat business history as a first-class platform capability.
Engineering Decisions
Enforce service-level ownership of persistent data.
Prefer immutable records for financial events.
Separate transactional, reference, operational, and audit storage concerns.
Use event-driven synchronization rather than shared databases.
Security Decisions
Encrypt sensitive information at rest and in transit.
Restrict access through role- and service-based authorization.
Validate backup and recovery processes regularly.
QA Decisions
Test transaction integrity across service boundaries.
Verify backup restoration procedures.
Validate audit completeness and immutability.
Confirm retention and deletion policies behave as expected.
Architecture Decision Records (ADR)
ADR-001 — Service-Owned Persistence

Decision: Each business capability owns and manages its own persistent data.

Why: Reduces coupling, improves autonomy, and enables independent evolution of services.

ADR-002 — Immutable Financial Records

Decision: Financially significant records are append-only after confirmation.

Why: Preserves auditability, regulatory compliance, and user trust.

ADR-003 — Event-Driven Synchronization

Decision: Synchronize business data between services using events rather than shared databases.

Why: Supports scalability, resilience, and clear ownership boundaries.

Document Outcome

The Data Persistence & Storage Architecture establishes the principles governing how the FD Investment Platform stores, protects, versions, and manages business data. By separating ownership, enforcing transactional integrity, preserving immutable financial records, and defining lifecycle policies, the platform gains a durable and scalable persistence foundation suitable for long-term evolution and regulatory compliance.