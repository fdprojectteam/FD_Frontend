Phase 0.2 – Platform Architecture Overview

Document 01A – Platform Architecture Overview

Version: 1.0
Status: Foundation Document

1. Purpose

This document defines the logical structure of the FD Investment Platform.

It establishes how the platform is divided into major domains, how those domains interact, and where shared capabilities belong.

This architecture is independent of any specific technology or framework.

It serves as the blueprint for every future engineering decision.

2. Platform Philosophy

The FD Investment Platform is one integrated platform composed of multiple business domains.

It is not a collection of independent applications.

Every module should feel like part of the same ecosystem by sharing:

Navigation
Design System
Components
User Identity
Notifications
Search
Reporting
Security
Platform Settings

3. High-Level Platform Architecture

FD Investment Platform
│
├── Experience Layer
│
├── Platform Services Layer
│
├── Business Domain Layer
│
├── Data & Integration Layer
│
└── Infrastructure Layer

Each layer has a clear responsibility and communicates through well-defined interfaces.

4. Experience Layer

The Experience Layer contains all user-facing applications.

Experience Layer
│
├── Customer Experience
│
├── Customer Support Experience
│
└── Admin Experience

Each experience has different responsibilities but shares the same platform foundation.

4.1 Customer Experience

The primary investor-facing experience.

Modules include:

Dashboard

Marketplace

Product Details

Comparison

Booking

Portfolio

Maturity

Tax Center

Family Dashboard

Reports

Notifications

Profile

Settings

Goal:

Provide a seamless investment journey from discovery to portfolio management.

4.2 Customer Support Experience

Used by support teams to assist investors.

Capabilities include:

Support Dashboard

Customer Lookup

Ticket Management

Issue Resolution

Communication History

Knowledge Base

Notifications

Goal:

Resolve customer issues efficiently while maintaining complete interaction history.

4.3 Admin Experience

Used by internal platform administrators.

Capabilities include:

Admin Dashboard

Product Management

Bank Management

User Management

Support Oversight

Reports

Configuration

Audit Logs (Future)

Role Management (Future)

Goal:

Operate, monitor, and configure the platform securely.

5. Platform Services Layer

These services are shared across every experience.

Platform Services
│
├── Authentication
├── Authorization
├── Notifications
├── Search
├── File Management
├── Reporting
├── Settings
├── Analytics
└── Audit

These services should never be implemented separately within individual modules.

Example

Authentication belongs to the platform.

Marketplace consumes Authentication.

Portfolio consumes Authentication.

Admin consumes Authentication.

Support consumes Authentication.

There should only be one Authentication service.

6. Business Domain Layer

This layer contains the core business capabilities.

Business Domains
│
├── Marketplace
├── Comparison
├── Booking
├── Portfolio
├── Maturity
├── Tax
├── Family
├── Notifications
├── Support
└── Administration

Each domain encapsulates its own business rules while sharing common platform services.

7. Data & Integration Layer

Responsible for data management and communication with external systems.

Data Layer
│
├── APIs
├── Mock Services (POC)
├── Database
├── Bank Integrations (Future)
├── CKYC (Future)
├── Payment Gateway (Future)
├── AI Services (Future)
└── Analytics Pipeline

For the POC, most integrations will be mocked while maintaining production-like interfaces.

8. Infrastructure Layer

Provides the operational foundation.

Infrastructure
│
├── Hosting
├── CI/CD
├── Monitoring
├── Logging
├── Security
├── Backup
├── Performance
└── Deployment

This layer ensures the platform remains reliable, secure, and maintainable.

9. Platform Interaction Flow
Investor
     │
     ▼
Experience Layer
     │
     ▼
Platform Services
     │
     ▼
Business Domains
     │
     ▼
Data & Integration
     │
     ▼
Infrastructure

Each request moves through these layers in a predictable manner, helping maintain consistency and separation of concerns.

10. Shared Platform Capabilities

The following capabilities must be implemented once and reused everywhere:

Capability	         Used By
Authentication	  Customer, Support, Admin
Notifications	  All modules
Search	          Marketplace, Admin, Support
File Upload	      Support, Reports, Profile
Reporting	      Portfolio, Admin, Tax
Settings	      Entire platform
Analytics	      Entire platform
Theme	          Entire platform
Design Tokens	  Entire platform

11. Architectural Principles

Every new feature must adhere to these principles:

Separation of Concerns

Each layer has a single responsibility.

Reusability

Shared capabilities are implemented once and consumed across the platform.

Loose Coupling

Modules should interact through defined contracts rather than direct dependencies.

Scalability

New modules should integrate without requiring major architectural changes.

Consistency

Users should experience one cohesive product regardless of the module they are using.

12. Future Expansion

This architecture allows the platform to evolve by adding new business domains such as:

Mutual Funds
Bonds
Government Securities
Insurance Products
Wealth Advisory
AI Investment Assistant
Financial Goal Planning

These can be introduced as additional business domains while reusing the same platform services.

Deliverable Outcome

This document defines how the FD Investment Platform is organized as a platform, separating user experiences, shared services, business domains, data integrations, and infrastructure. It establishes a scalable structure that supports both the current POC and future production growth without fundamental architectural changes.