18 — API & Integration Architecture Specification
Purpose of this Document

The API & Integration Architecture Specification defines the communication contracts between the platform's business capabilities, frontend applications, external partner systems, and third-party providers.

The objective is to establish a consistent, secure, versioned, and scalable integration model that supports both current business requirements and future platform evolution.

Rather than documenting individual endpoints, this document defines the architectural standards that every API and integration must follow.

Objectives

This document answers:

How do frontend applications communicate with backend services?
How do services communicate with each other?
How are partner banks integrated?
How are asynchronous events exchanged?
How are APIs versioned?
How are errors standardized?
How is authentication enforced?
How are retries handled safely?
API Design Principles
1. Business-Oriented APIs

APIs expose business capabilities rather than database operations.

✅ Good

POST /bookings

❌ Avoid

POST /insertBooking
2. Resource-Based Design

Every API represents a business resource.

Examples

/products

/bookings

/payments

/portfolio

/investors

/nominees

/bank-accounts
3. Stateless Communication

Every request contains all information required for processing.

No server-side session dependency for API correctness.

4. Idempotent Financial Operations

Critical operations such as booking creation and payment initiation must support idempotency to prevent duplicate financial transactions.

5. Consistent Naming

Use nouns for resources.

Avoid verbs in endpoint names.

API Categories
Category	Purpose
Customer APIs	Used by Web and Mobile applications
Internal Service APIs	Communication between business capabilities
Partner APIs	Communication with banks and external providers
Webhooks	Incoming asynchronous notifications
Event Contracts	Internal asynchronous communication
Customer APIs

These APIs are consumed by frontend applications.

Examples

GET /products

GET /products/{id}

POST /bookings

GET /bookings/{id}

POST /payments

GET /portfolio

These APIs should remain stable even if backend implementations evolve.

Internal Service APIs

Used only between platform services.

Examples

Booking Service

↓

Investor Service

Eligibility Check

↓

Payment Service

Payment Request

↓

Portfolio Service

Create Holding

Internal APIs may evolve independently but should follow the same architectural standards.

Partner Integration APIs

The platform communicates with external financial institutions through dedicated integration adapters.

Examples

Product Catalogue Synchronization
Booking Submission
Booking Status
Interest Rate Updates
Maturity Notifications

Partner-specific formats should be translated into the platform's canonical model.

Webhooks

External providers notify the platform asynchronously.

Examples

Payment Completed
Payment Failed
Bank Booking Confirmed
Bank Booking Rejected

Webhook processing should:

Validate authenticity.
Be idempotent.
Record all received events.
Acknowledge quickly.
Process asynchronously.
Event Contracts

Internal business events enable decoupled communication.

Examples

BookingCreated

PaymentSuccessful

BookingConfirmed

PortfolioCreated

NotificationRequested

Events are immutable and versioned.

API Versioning Strategy
Principles
Version only when introducing breaking changes.
Maintain backward compatibility where possible.
Deprecate versions through a defined lifecycle.
Example
/v1/products

/v1/bookings

/v2/bookings
Request & Response Standards
Request Principles
Validate input at the API boundary.
Reject malformed requests with clear error responses.
Use canonical field names.
Response Principles

Every successful response should include:

Requested resource data.
Server-generated identifiers where applicable.
Relevant timestamps.
Current workflow status (if applicable).
Error Contract

Errors should follow a consistent structure.

Example:

{
  "code": "BOOKING_VALIDATION_FAILED",
  "message": "Investment amount is below the minimum allowed.",
  "details": [
    {
      "field": "investmentAmount",
      "reason": "MINIMUM_AMOUNT_NOT_MET"
    }
  ],
  "correlationId": "abc123xyz"
}
HTTP Status Guidelines
Status	Usage
200	Successful retrieval
201	Resource created
202	Accepted for asynchronous processing
204	Successful request with no response body
400	Validation error
401	Authentication required
403	Authorization failure
404	Resource not found
409	Conflict or duplicate request
422	Business rule violation
429	Rate limit exceeded
500	Unexpected server error
503	Service temporarily unavailable
Authentication & Authorization
Authentication
OAuth 2.0 / OpenID Connect compatible architecture.
Token-based authentication.
Short-lived access tokens with refresh mechanisms.
Authorization

Role-based access control (RBAC).

Examples

Customer
Operations
Admin
Support
Partner Integration

Authorization decisions belong to the backend.

Pagination Standard

For collection resources:

GET /products?page=1&pageSize=20

Response metadata should include:

Current Page
Page Size
Total Records
Total Pages

Cursor-based pagination may be introduced for high-volume datasets in future versions.

Filtering & Sorting

Example:

GET /products?bank=HDFC&tenure=365&sort=interestRate:desc

Filtering should be declarative and composable.

Idempotency

Critical write operations should accept an idempotency key.

Example:

Idempotency-Key: 6f9b8c12-...

This ensures duplicate requests caused by retries or network interruptions do not create duplicate bookings or payments.

Rate Limiting

Protect platform stability through configurable rate limits.

Responses should communicate:

Remaining quota.
Reset time.
Retry guidance where appropriate.
Observability

Every API request should include:

Correlation ID
Request ID
Timestamp
Service Name
Response Time

These identifiers enable end-to-end tracing across services.

Integration Patterns
Scenario	Pattern
Product Search	Synchronous API
Investment Calculation	Synchronous API
Payment Initiation	Synchronous API
Booking Confirmation	Asynchronous Event
Portfolio Synchronization	Asynchronous Event
Notifications	Asynchronous Event
Analytics	Event Stream
API Lifecycle
Design
   ↓
Review
   ↓
Approval
   ↓
Implementation
   ↓
Testing
   ↓
Release
   ↓
Versioning
   ↓
Deprecation

Every API should follow a governed lifecycle to maintain compatibility and quality.

Design Implications
Product Decisions
Design APIs around business capabilities.
Ensure contracts remain stable as the platform evolves.
Separate public, internal, and partner-facing interfaces.
Engineering Decisions
Adopt consistent naming, validation, and error handling across all APIs.
Translate partner-specific payloads into canonical business models.
Use asynchronous communication for long-running workflows.
Security Decisions
Authenticate every request.
Authorize every operation.
Protect against replay attacks through idempotency.
Validate webhook authenticity.
QA Decisions
Test API contracts independently of UI.
Verify backward compatibility for versioned APIs.
Validate retry behavior, error handling, and idempotency.
Architecture Decision Records (ADR)
ADR-001 — Capability-Based API Design

Decision: APIs represent business capabilities rather than database entities.

Why: This aligns interfaces with business concepts, improving clarity and long-term maintainability.

ADR-002 — Canonical Integration Layer

Decision: All partner integrations translate external formats into the platform's canonical data model.

Why: Isolates external changes from internal systems and provides a consistent business language.

ADR-003 — Idempotent Financial Operations

Decision: All critical financial write operations require idempotency support.

Why: Prevents duplicate bookings and payments caused by retries, network issues, or provider callbacks.

Document Outcome

The API & Integration Architecture Specification establishes the communication standards for the FD Investment Platform. It defines how business capabilities expose services, how external systems integrate with the platform, and how APIs remain secure, consistent, versioned, and resilient as the ecosystem grows.