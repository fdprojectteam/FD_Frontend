Document 11 – Mock API Strategy

Project: FD Investment Platform

Version: 1.0

Status: Engineering Blueprint

1. Purpose

The Mock API Strategy defines how backend behavior is simulated during the POC phase while preserving compatibility with future production APIs.

The objectives are to:

Enable frontend development without a backend.
Mimic production API behavior.
Maintain the same request and response contracts.
Allow seamless replacement with real backend services.

The UI should never know whether the data comes from a mock service or a production API.

2. Mock API Philosophy

The platform follows these principles.

Contract First

Mock APIs must implement the same contract as the future backend.

This includes:

Endpoint paths
HTTP methods
Request payloads
Response formats
Error structures
Service Layer Isolation

Components communicate only with services.

Never with:

JSON files
Static imports
Mock objects

Correct flow:

Component
      ↓
Feature Hook
      ↓
Module Service
      ↓
Mock API

Later:

Component
      ↓
Feature Hook
      ↓
Module Service
      ↓
Production API

The component remains unchanged.

Production-Like Behavior

Mock APIs should simulate:

Network delay
Pagination
Filtering
Sorting
Validation
Error responses

The goal is to test real user flows, not just display data.

3. Mock API Architecture
UI Component
      │
      ▼
Feature Hook
      │
      ▼
Feature Service
      │
      ▼
API Client
      │
      ▼
Mock Handler (MSW)
      │
      ▼
Mock Data

When production is ready:

Mock Handler

↓

Real Backend

No changes to UI components.

4. Recommended Technology
Responsibility	Technology
HTTP Client	Axios
Server State	TanStack Query
Mock Server	Mock Service Worker (MSW)
Mock Data	JSON / TypeScript Factories
Validation	Zod
Development	Next.js App Router

MSW intercepts HTTP requests, making the frontend behave as though it is communicating with a live backend.

5. Mock Data Organization

Mock data should mirror business modules.

mocks/
│
├── products/
├── banks/
├── bookings/
├── portfolio/
├── reports/
├── notifications/
├── users/
├── support/
└── admin/

Each module owns its own mock data.

6. Mock Handler Organization

Each module defines its own request handlers.

mocks/
│
├── handlers/
│   ├── products.ts
│   ├── banks.ts
│   ├── bookings.ts
│   ├── portfolio.ts
│   ├── reports.ts
│   └── users.ts

Handlers simulate API behavior using the same endpoints defined in Document 10.

7. Response Consistency

Every mock endpoint returns the same response structure as production.

Example:

{
  "success": true,
  "message": "Products retrieved successfully.",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 180,
    "totalPages": 15
  }
}

Consistency reduces migration effort.

8. Simulated Network Behavior

Mocks should imitate real-world conditions.

Supported scenarios:

Fast response
Slow response
Timeout
Server error
Validation failure
Empty result
Partial data

This allows the UI to be tested under realistic conditions.

9. Pagination Strategy

Pagination should be calculated dynamically.

Example:

Request

GET /api/v1/products?page=2&limit=12

Mock handler returns:

Products 13–24

instead of returning the full dataset.

10. Search & Filtering

Mock handlers should implement the same filtering logic expected in production.

Examples:

search=hdfc

bank=ICICI

minInterestRate=7

maxTenure=36

category=SeniorCitizen

This ensures search and filter components behave correctly before backend development.

11. Sorting Strategy

Supported parameters:

sort=interestRate

order=asc

sort=tenure

order=desc

Sorting should be performed within the mock handler.

12. Validation Simulation

Mocks should validate incoming requests.

Example:

Booking request:

Invalid:

Deposit Amount

↓

0

Response:

{
  "success": false,
  "message": "Deposit amount must be greater than zero.",
  "error": {
    "code": "INVALID_DEPOSIT_AMOUNT"
  }
}

This allows frontend validation and error handling to be tested.

13. Authentication Simulation

Protected endpoints should require a simulated authentication token.

Example:

Authorization: Bearer mock-access-token

Unauthorized requests return:

401 Unauthorized

This enables authentication flows before backend implementation.

14. Error Scenario Library

Every module should define reusable error scenarios.

Examples:

Marketplace

Product not found
Invalid filter
Search failure

Booking

Invalid amount
Booking conflict
Validation error

Portfolio

Empty portfolio
Data unavailable

Support

Ticket creation failed

These scenarios improve UI robustness.

15. Mock Data Factories

Avoid manually duplicating records.

Use factories to generate consistent datasets.

Example:

Product Factory

↓

200 FD Products

↓

Different Banks

↓

Different Interest Rates

↓

Different Tenures

Factories make large datasets easier to maintain and expand.

16. Environment Strategy

The application should switch between mock and production APIs through configuration.

Example:

Development

↓

Mock APIs Enabled
Production

↓

Real Backend APIs Enabled

No component changes are required.

17. Testing Strategy

The mock layer should support:

Component testing
Integration testing
User acceptance testing
Design review
Investor demonstrations

Using the same contracts ensures confidence when the real backend is introduced.

18. Migration Strategy

When the backend is ready:

Replace:

Mock Handler

With:

Production Backend

Everything else remains unchanged:

Components
Hooks
Services
Queries
State Management

This minimizes integration risk.

19. Success Criteria

The Mock API Strategy is successful when:

The frontend cannot distinguish between mock and production APIs.
Mock responses follow production contracts.
Realistic success and failure scenarios are supported.
Backend integration requires minimal code changes.
All modules can be developed independently of backend progress.
20. Deliverable Outcome

This document establishes the mock service architecture for the FD Investment Platform.

It defines:

Mock API philosophy
Mock server architecture
Folder organization
Request and response contracts
Search, filtering, sorting, and pagination
Authentication simulation
Validation and error scenarios
Environment switching
Migration to production

It ensures that the POC is built on the same API contracts that will support the future production platform.