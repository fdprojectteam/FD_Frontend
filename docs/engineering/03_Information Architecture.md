Document 03 – Information Architecture

Project: FD Investment Platform
Document Version: 1.0
Status: Engineering Blueprint

1. Purpose

Information Architecture (IA) defines how information, features, and navigation are organized across the platform.

Its purpose is to ensure that users can:

Find information quickly
Understand where they are
Know what to do next
Complete investment journeys with minimal effort

A well-designed IA reduces cognitive load and creates a predictable experience across the entire platform.

2. Information Architecture Principles

The platform follows these principles:

User-Centered Organization

Content is organized around investor goals, not internal business departments.

Progressive Disclosure

Show only the information users need at each step.

Advanced details appear only when relevant.

Consistency

Navigation, terminology, and page structures remain consistent across all modules.

Discoverability

Users should be able to locate any primary feature within two or three navigation steps.

Scalability

The structure should support future products such as:

Mutual Funds
Bonds
Insurance
Wealth Management

without restructuring the navigation.

3. Primary User Groups

The platform contains three primary experiences:

FD Investment Platform

├── Investor Experience
├── Support Experience
└── Admin Experience

Each experience has its own navigation while sharing common platform services.

4. Investor Information Architecture

The investor journey is organized around the investment lifecycle.

Investor

│
├── Dashboard
│
├── Marketplace
│     ├── Browse Products
│     ├── Search
│     ├── Filters
│     └── Product Details
│
├── Comparison
│
├── Booking
│
├── Portfolio
│
├── Maturity
│
├── Tax Center
│
├── Family Dashboard
│
├── Reports & Statements
│
├── Notifications
│
├── Support
│
└── Profile & Settings

This reflects the natural flow of an investor's tasks.

5. Customer Journey Mapping

The platform supports a continuous investment journey.

Dashboard
     │
Marketplace
     │
Product Details
     │
Comparison
     │
Booking
     │
Mock Processing
     │
Portfolio
     │
Maturity
     │
Reports
     │
Support

Users should never feel they are switching between different applications.

6. Support Information Architecture

Support Portal

│
├── Dashboard
├── Customer Lookup
├── Support Tickets
├── Ticket Details
├── Communication History
├── Knowledge Base
├── Notifications
└── Settings

The Support Portal is optimized for resolving customer issues efficiently.

7. Admin Information Architecture
Admin Portal

│
├── Dashboard
├── Products
├── Banks
├── Users
├── Bookings
├── Reports
├── Support Management
├── Platform Configuration
└── Settings

The Admin Portal focuses on operational management rather than investment activities.

8. Shared Platform Navigation

These features are available across all experiences:

Notifications
Profile
Settings
Help
Search (where applicable)

Providing consistent access reduces user effort and supports familiarity.

9. Content Hierarchy

Information should be prioritized according to importance.

Level 1 — Primary Actions

Examples:

Invest Now
Compare
View Portfolio

These actions receive the strongest visual emphasis.

Level 2 — Supporting Information

Examples:

Interest Rate
Tenure
Bank Rating
Deposit Amount

These help users make informed decisions.

Level 3 — Secondary Information

Examples:

FAQs
Terms & Conditions
Support Articles

These remain accessible but should not distract from the primary task.

10. Navigation Principles

Navigation should be:

Consistent across the platform
Predictable
Minimal
Role-aware
Responsive for desktop, tablet, and mobile

Users should always understand:

Where they are
What they can do next
How to return to previous sections
11. Search Strategy

Search is treated as a shared platform capability.

Applicable areas include:

Marketplace
Products
Reports
Support Articles
Customers (Support/Admin)

Search behavior should remain consistent regardless of module.

12. Future Expansion

The IA is designed to accommodate new business domains.

Example:

Marketplace

├── Fixed Deposits
├── Mutual Funds
├── Bonds
├── Government Securities
└── Insurance

The top-level navigation remains stable while new product categories are added.

13. Information Architecture Validation

The IA is considered successful if users can:

Discover investment products quickly.
Compare options without confusion.
Complete bookings with minimal steps.
Access portfolio information easily.
Navigate between modules without losing context.

14. Deliverable Outcome

This document establishes the information structure of the FD Investment Platform.

It defines:

User experiences
Navigation hierarchy
Investment journey
Content organization
Search strategy
Future expansion model

This IA becomes the foundation for routing, layouts, menus, breadcrumbs, and page organization.