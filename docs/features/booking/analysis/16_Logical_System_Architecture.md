Purpose of this Document

The Logical System Architecture defines the major logical components of the FD Investment Platform, their responsibilities, interactions, and boundaries.

Rather than focusing on infrastructure or deployment, this document explains how the platform is structured from a software architecture perspective.

It provides a technology-agnostic blueprint that ensures every capability has clear ownership, communicates through well-defined interfaces, and can evolve independently.

The objective is to build a modular, scalable, and maintainable technology platform that supports future investment products beyond Fixed Deposits.

Architectural Principles

The platform follows these principles:

1. Capability-Oriented Architecture

The system is composed of independent business capabilities rather than page-centric implementations.

Examples:

Marketplace
Booking
Portfolio
Payments
Investor
Notifications

Each capability owns its business logic.

2. Domain-Driven Design

Business domains determine service boundaries.

Not database tables.

Not UI screens.

This ensures business logic remains cohesive.

3. API-First

Every capability exposes clear interfaces.

Future clients may include:

Web
Mobile
Internal Admin
Partner APIs
AI Assistants
Third-party Integrations
4. Event-Driven Collaboration

Long-running workflows communicate through business events where appropriate instead of tightly coupled synchronous calls.

Examples:

Booking Confirmed

↓

Portfolio Updated

↓

Notification Sent

↓

Analytics Recorded

5. Single Source of Truth

Every business entity has one owning capability.

Example:

Investor Profile

↓

Owned only by Investor Domain

Other services consume it but never duplicate ownership.

High-Level Logical Architecture
                    FD Investment Platform

                           │
───────────────────────────┼───────────────────────────

        Experience Layer (Frontend Applications)

───────────────────────────┼───────────────────────────

          Application Layer (Business Capabilities)

───────────────────────────┼───────────────────────────

Marketplace

Booking

Investor

Portfolio

Payment

Notification

Compliance

Admin

───────────────────────────┼───────────────────────────

           Integration Layer

Partner Banks

Payment Gateway

Identity Verification

Email/SMS

Analytics

───────────────────────────┼───────────────────────────

              Shared Platform Services

Authentication

Authorization

Audit

Configuration

Logging

Monitoring

Caching

Storage
Layer 1 — Experience Layer
Purpose

Provide interfaces for different users and channels.

Channels
Customer Web Application
Customer Mobile Application (Future)
Internal Operations Portal
Admin Portal
Partner Portal (Future)
Responsibilities
Present information.
Collect user input.
Display workflow status.
Communicate with backend services.
Principles

No business rules.

No financial calculations.

No workflow ownership.

The frontend orchestrates user interaction but does not own business logic.

Layer 2 — Application Layer

This is the heart of the platform.

Each capability owns a business function.

Marketplace Service

Responsibilities:

Search Products
Filter Products
Compare Products
Product Details
Booking Service

Responsibilities:

Booking Workflow
State Machine
Validation
Booking Lifecycle
Investor Service

Responsibilities:

Profile
KYC Status
Eligibility
Personal Information
Payment Service

Responsibilities:

Payment Requests
Payment Status
Retry Logic
Reconciliation
Portfolio Service

Responsibilities:

Investment Holdings
Maturity
Portfolio Summary
Performance
Compliance Service

Responsibilities:

Consents
Regulatory Rules
Audit Trail
Declarations
Notification Service

Responsibilities:

Email
SMS
Push Notifications (Future)
In-App Notifications
Admin Service

Responsibilities:

Product Management
Partner Configuration
Monitoring
Operational Controls
Layer 3 — Integration Layer

The platform depends on external systems but keeps them isolated behind integration adapters.

Partner Bank Integration

Responsibilities:

Product Synchronization
Booking Submission
Booking Status
Maturity Updates
Payment Gateway

Responsibilities:

Payment Initiation
Status Callbacks
Refunds (Future)
Identity Verification

Responsibilities:

PAN Verification
Aadhaar Verification
Future CKYC Integration
Communication Providers

Responsibilities:

Email Delivery
SMS Delivery
Future WhatsApp Integration
Analytics

Responsibilities:

Product Analytics
User Behaviour
Funnel Metrics
Business Reporting
Layer 4 — Shared Platform Services

These services are reused across the platform.

Authentication

User identity.

Authorization

Permissions.

Roles.

Access Control.

Configuration

Feature Flags.

Partner Configuration.

Product Configuration.

Audit

Financial Event Logging.

Monitoring

Health.

Metrics.

Alerts.

Logging

Structured Logs.

Correlation IDs.

Tracing.

Storage

Documents.

Certificates.

Statements.

Caching

Improve performance.

Reduce repeated requests.

Capability Interaction
Marketplace

↓

Booking

↓

Investor

↓

Payment

↓

Partner Bank

↓

Portfolio

↓

Notification

Each capability communicates through well-defined contracts rather than direct data sharing.

Synchronous vs Asynchronous Communication
Synchronous

Use when the user is waiting for an immediate response.

Examples:

Login
Product Search
Investment Calculation
Eligibility Check
Bank Account Selection
Asynchronous

Use for long-running or external operations.

Examples:

Booking Confirmation
Notification Delivery
Portfolio Synchronization
Analytics Processing
Audit Recording
Event Flow Example
Payment Successful

↓

Booking Submitted

↓

Partner Bank Confirmed

↓

Portfolio Created

↓

Notification Sent

↓

Analytics Recorded

Each event is independent, allowing failures in one downstream process (for example, notification delivery) without affecting the successful booking.

Service Ownership Matrix
Service	Owns	Does Not Own
Marketplace	Product discovery	Bookings
Booking	Workflow	Payments
Investor	User profile	Portfolio
Payment	Transactions	Product data
Portfolio	Investments	Booking workflow
Compliance	Regulatory records	Payment processing
Notification	User communications	Business decisions
Cross-Cutting Concerns

These apply across every capability.

Authentication
Authorization
Logging
Monitoring
Error Handling
Auditing
Feature Flags
Configuration
Observability
Rate Limiting
Correlation IDs

These should be implemented consistently through shared platform infrastructure rather than duplicated within each capability.

Design Implications
Product Decisions
Organize the platform around business capabilities rather than technical layers.
Ensure each capability has clear ownership and responsibility.
Allow future investment products to reuse existing services.
UX Decisions
Keep user workflows independent of backend implementation.
Handle asynchronous operations transparently with clear progress indicators and notifications.
Engineering Decisions
Define explicit service contracts and avoid direct database sharing between services.
Use event-driven communication for long-running workflows.
Keep business logic within the owning capability.
Favor modular design so services can evolve independently.
DevOps Decisions
Deploy capabilities independently where appropriate.
Monitor service health individually.
Enable horizontal scaling based on workload characteristics.
Centralize logging and metrics collection.
Architectural Decision Records (ADR)
ADR-001 — Capability-Oriented Services

Decision: Organize backend services around business capabilities.

Why: Business capabilities change less frequently than UI structures, improving maintainability and reuse.

ADR-002 — Event-Driven Workflow

Decision: Use asynchronous events for booking confirmation, portfolio synchronization, notifications, and analytics.

Why: External systems introduce latency and uncertainty. Event-driven processing improves resilience and scalability.

ADR-003 — Shared Platform Services

Decision: Centralize authentication, authorization, logging, monitoring, and configuration.

Why: Consistent implementation of cross-cutting concerns reduces duplication and simplifies governance.

Document Outcome

The Logical System Architecture establishes the structural blueprint of the FD Investment Platform. It defines the major logical layers, capability boundaries, integration patterns, and shared services that together form a scalable and maintainable technology platform.

By separating responsibilities clearly and designing around business capabilities, the architecture supports independent evolution of modules while maintaining a consistent user experience and operational model.