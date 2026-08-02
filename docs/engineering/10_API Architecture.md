Document 10 – API Architecture

Project: FD Investment Platform

Version: 1.0

Status: Engineering Blueprint

1. Purpose

The API Architecture defines the communication contract between the frontend and backend of the FD Investment Platform.

Its objectives are to:

Provide a consistent API design across all modules.
Decouple frontend implementation from backend services.
Enable a seamless transition from mock APIs to production APIs.
Ensure scalability, maintainability, and security.

The API layer should be treated as a product interface, not merely a transport mechanism.

2. API Design Principles

The platform follows these principles.

Resource-Oriented

APIs are organized around business resources.

Examples:

Products
Banks
Bookings
Portfolio
Reports
Users
Predictable

Endpoints follow consistent naming, request structures, and response formats.

Stateless

Each request contains all the information required for processing.

The server does not rely on client session state between requests.

Versioned

Every public API is versioned.

Example:

/api/v1/products
/api/v1/bookings
/api/v1/portfolio

Future versions should coexist without breaking existing clients.

Secure

Authentication and authorization are enforced consistently across protected endpoints.

3. API Layer Architecture

The frontend should never call HTTP clients directly from UI components.

React Component
        │
        ▼
Feature Hook
        │
        ▼
Module Service
        │
        ▼
API Client
        │
        ▼
Backend API

Each layer has a single responsibility.

4. API Modules

APIs are grouped by business capability.

Authentication API

Products API

Banks API

Comparison API

Bookings API

Portfolio API

Maturity API

Tax API

Reports API

Notifications API

Support API

Admin API

This mirrors the platform architecture.

5. REST Endpoint Conventions

Use nouns rather than verbs.

Examples:

GET    /api/v1/products

GET    /api/v1/products/{id}

POST   /api/v1/bookings

GET    /api/v1/portfolio

PATCH  /api/v1/profile

DELETE /api/v1/notifications/{id}

Avoid endpoint names such as:

/getProducts

/createBooking

/updateProfile
6. Request Standards

Requests should use standard HTTP methods.

Method	Purpose
GET	Retrieve resources
POST	Create resources
PUT	Replace resources
PATCH	Partially update resources
DELETE	Remove resources

Query parameters should be used for filtering, searching, sorting, and pagination.

Example:

GET /api/v1/products?page=1&limit=12&sort=interestRate&order=desc
7. Response Format

All APIs should follow a consistent response envelope.

Success Response
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
Error Response
{
  "success": false,
  "message": "Unable to retrieve products.",
  "error": {
    "code": "PRODUCT_FETCH_FAILED",
    "details": []
  }
}

A predictable response structure simplifies frontend handling.

8. Pagination Strategy

Collection endpoints should support pagination.

Standard parameters:

page

limit

sort

order

search

Example:

GET /api/v1/products?page=2&limit=12&search=hdfc
9. Filtering Strategy

Filtering should use query parameters.

Examples:

bank=ICICI

minInterestRate=7

maxTenure=36

category=SeniorCitizen

Filters should be combinable.

10. Error Handling

HTTP status codes should reflect the outcome.

Status	Meaning
200	Success
201	Created
400	Validation Error
401	Authentication Required
403	Forbidden
404	Resource Not Found
409	Conflict
422	Business Validation Error
500	Internal Server Error

Business errors should return meaningful error codes in the response body.

11. Authentication Strategy

Protected endpoints require authentication.

Example:

Authorization: Bearer <access-token>

The API should not expose implementation details to the client.

12. Validation Strategy

Input validation occurs at two levels:

Client
Required fields
Format validation
Immediate user feedback
Server
Business rules
Security validation
Data integrity

Server validation is always authoritative.

13. API Client Strategy

The frontend communicates through a shared API client.

Responsibilities:

Base URL
Authentication headers
Request interceptors
Response interceptors
Error normalization
Retry logic (where appropriate)

Feature modules should not implement their own HTTP clients.

14. Service Layer

Every module owns a service layer.

Example:

Marketplace

├── ProductService

Comparison

├── ComparisonService

Portfolio

├── PortfolioService

Services transform API responses into frontend-friendly models when needed.

15. Data Transformation

Business components should never transform raw API responses.

Transformation occurs in the service layer.

Example:

Backend Response
        │
        ▼
Service Layer
        │
        ▼
Frontend Model
        │
        ▼
React Component

This keeps presentation components simple.

16. API Versioning

The initial platform uses:

v1

Future changes should introduce:

v2

without breaking existing consumers.

17. Rate Limiting & Idempotency

The architecture should support:

Rate limiting for public endpoints.
Idempotency for operations such as booking creation and payment initiation.

This prepares the platform for production-grade financial workflows.

18. Observability

Every API should support operational monitoring.

Recommended capabilities:

Request logging
Error logging
Performance metrics
Correlation IDs for tracing requests across services

These are essential for diagnosing production issues.

19. Future Evolution

The API architecture should support:

Mobile applications
Partner integrations
Banking APIs
AI recommendation services
Open Banking standards (where applicable)

without changing frontend architecture.

20. Success Criteria

The API Architecture is successful when:

Frontend components never depend on raw HTTP calls.
Mock APIs and production APIs share the same contract.
Every endpoint follows consistent conventions.
New modules integrate without redefining API patterns.
Backend evolution does not require UI redesign.
21. Deliverable Outcome

This document establishes the API foundation of the FD Investment Platform.

It defines:

API principles
Endpoint conventions
Request and response standards
Pagination and filtering
Authentication
Validation
Error handling
Service layer responsibilities
Versioning
Future scalability

It serves as the contract between the frontend and backend, ensuring a stable, maintainable, and production-ready integration layer.