Document 02 – Technology Architecture

Project: FD Investment Platform
Document Version: 1.0
Status: Approved Architecture for Investor POC
Phase: Engineering Blueprint

1. Purpose

This document defines the technology architecture of the FD Investment Platform.

Its purpose is to establish a scalable engineering foundation that supports both the current Investor-Ready Product POC and future production development.

The architecture prioritizes:

Clean separation of concerns
Reusable engineering
Scalability
Maintainability
Type safety
Modern frontend architecture

Although the POC will not include a production backend, the frontend architecture will be designed so that backend integration can be introduced later without significant refactoring.

2. Engineering Philosophy

The technology architecture follows a Platform-First approach rather than a Feature-First approach.

Instead of tightly coupling screens to data, the application separates:

Presentation
Business Logic
Data Access

This ensures that changing the data source does not require changes to the user interface.

The architecture should always support future expansion into a production-grade fintech platform.

3. Architecture Principles

Every technical decision should satisfy the following principles.

Principle	Description
Scalability	Support future product growth without redesigning the architecture.
Maintainability	Keep the codebase simple, modular, and easy to extend.
Reusability	Build shared components and services instead of duplicating logic.
Separation of Concerns	Each layer has a single, well-defined responsibility.
Type Safety	Use TypeScript throughout the application.
Performance	Deliver a fast and responsive user experience.
Accessibility	Follow WCAG AA accessibility guidelines.
Consistency	Use one design system and one engineering standard across the platform.
4. High-Level Technology Architecture

The POC will use a layered frontend architecture.

┌──────────────────────────────────────────────┐
│             Presentation Layer               │
│      Pages • Layouts • Components            │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             Business Service Layer           │
│     ProductService • BookingService          │
│     PortfolioService • UserService           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             Mock Repository Layer            │
│ Products • Portfolio • Reports • Users       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│               Mock Data Layer                │
│ JSON / TypeScript Data Models                │
└──────────────────────────────────────────────┘

Each layer has a single responsibility and communicates only with the layer directly below it.

5. Frontend Technology Stack
Area	Technology
Framework	React 19
Language	TypeScript
Build Tool	Vite
Styling	Tailwind CSS
Routing	React Router
Icons	Lucide Icons
Data Fetching	TanStack Query
Forms	React Hook Form
Validation	Zod
Charts	Recharts (or equivalent)
Code Quality	ESLint + Prettier
6. Presentation Layer

The Presentation Layer is responsible only for rendering the user interface.

Responsibilities include:

Layout rendering
Navigation
User interaction
Form rendering
Responsive behavior
Accessibility

The Presentation Layer must never directly access mock data or business rules.

Instead, it communicates only with the Service Layer.

Example:

Marketplace Page

↓

ProductService

↓

Product Repository
7. Business Service Layer

The Service Layer contains all business operations.

Responsibilities include:

Product retrieval
Comparison calculations
Booking workflow
Portfolio calculations
Notification management
Report generation
User session handling

Example services:

ProductService

BookingService

PortfolioService

NotificationService

UserService

SupportService

ReportService

Each service returns Promise-based responses to simulate production APIs.

Example:

await ProductService.getProducts();

await BookingService.createBooking();

The rest of the application should not know whether data comes from mock repositories or real APIs.

8. Mock Repository Layer

The Repository Layer acts as the application's data source.

It is responsible for:

Reading mock data
Returning structured domain models
Simulating database responses

Each business domain has its own repository.

Example:

ProductRepository

PortfolioRepository

BookingRepository

UserRepository

NotificationRepository

ReportRepository

Repositories should contain no UI logic.

9. Mock Data Layer

The Mock Data Layer stores realistic business data used by the POC.

Example structure:

mocks/

products.ts

banks.ts

portfolio.ts

bookings.ts

notifications.ts

reports.ts

supportTickets.ts

users.ts

Mock data should reflect realistic financial information to provide a convincing investor demonstration.

10. Data Flow

Every feature follows the same architecture.

User Action

↓

React Component

↓

Service Layer

↓

Repository Layer

↓

Mock Data

↓

Repository Layer

↓

Service Layer

↓

React Component

↓

UI Update

This flow mirrors how production APIs will behave.

11. State Management Strategy

Different types of state should have clear ownership.

State Type	Technology
Server Data	TanStack Query
Global UI State	Zustand
Form State	React Hook Form
Local Component State	React Hooks
URL State	React Router

This separation keeps the application predictable and maintainable.

12. API Contract Strategy

Although the POC does not use a backend, every service should expose interfaces that resemble production REST APIs.

Example:

ProductService.getProducts();

ProductService.getProductById(id);

BookingService.createBooking(data);

PortfolioService.getInvestments();

When production APIs become available, only the implementation inside the Service Layer changes.

The Presentation Layer remains unchanged.

13. Authentication Strategy
POC

Authentication is simulated.

Features include:

Mock login
Mock logout
Mock session
Role simulation
Protected routes

Supported roles:

Investor
Support Executive
Administrator
Future Production

The architecture supports future integration with:

OAuth 2.0
OpenID Connect
JWT
Multi-Factor Authentication

No UI redesign should be required.

14. File Management Strategy
POC

Use local mock assets and static files.

Future Production

Support integration with cloud object storage for:

Profile images
Investment statements
Tax documents
Support attachments
15. Notification Strategy

Notifications are treated as a shared platform capability.

POC
In-app notifications
Future
Email
SMS
Push notifications
WhatsApp (if required)

Notification delivery should be event-driven.

16. Error Handling Strategy

Every service should return consistent responses.

Example:

Success

Loading

Validation Error

Business Error

Unexpected Error

The UI should display friendly, actionable error messages.

17. Performance Strategy

The platform should prioritize responsiveness.

Techniques include:

Code splitting
Lazy loading
Route-based loading
Component memoization
Image optimization
Efficient state updates

Performance considerations should be built into the architecture from the beginning.

18. Accessibility Strategy

The platform will comply with WCAG AA standards.

Requirements include:

Keyboard navigation
Focus management
Screen reader compatibility
Accessible forms
Color contrast compliance
Semantic HTML

Accessibility is a platform requirement, not a feature.

19. Security Strategy

Although the POC uses mock data, security practices should reflect production standards.

Key principles:

Input validation
Output encoding
Protected routes
Role-based access control
Secure configuration management
Sensitive data isolation
Future audit logging support
20. Deployment Strategy

The POC is deployed as a single frontend application.

Area	Technology
Frontend Hosting	Vercel
Mock Data	Bundled with Application
Environment Variables	Vite Environment Configuration

Future backend deployment can be introduced without changing the frontend architecture.

21. Development Environment

Separate configuration should exist for:

Local Development
Development
Staging
Production

Environment variables should manage:

API base URLs
Feature flags
Environment-specific settings
22. Scalability Roadmap
POC
Presentation Layer

↓

Service Layer

↓

Mock Repository

↓

Mock Data
Future Production
Presentation Layer

↓

Service Layer

↓

REST API

↓

Business Services

↓

Database

The Service Layer remains unchanged.

Only the implementation behind it evolves.

23. Technology          Decision Matrix

Category	            Selected Technology
Frontend Framework	    React 19
Programming Language	TypeScript
Build Tool	            Vite
Styling	                Tailwind CSS
Routing	                React Router
Icons	                Lucide Icons
Data Fetching	        TanStack Query
Forms	                React Hook Form
Validation	            Zod
Charts	                Recharts (or equivalent)
Global State	        Zustand
Business Layer	        Service Layer
Data Source	            Mock Repository
Mock Storage	        TypeScript Data Models
Deployment	            Vercel
Code Quality	        ESLint + Prettier

24. POC Engineering Strategy

The Investor POC focuses on demonstrating product quality rather than production infrastructure.

Instead of building backend services, the application simulates real-world behavior through a dedicated Service Layer backed by Mock Repositories.

This approach provides several advantages:

Faster development
Cleaner frontend architecture
Realistic loading and error states
Easy transition to production APIs
Reduced implementation complexity
Better focus on user experience and platform quality

When the project enters production, backend services can replace the Mock Repository Layer without requiring changes to the Presentation Layer.

25. Document Outcome

This document establishes the technology foundation for the FD Investment Platform.

It defines:

Engineering philosophy
Technology stack
Layered architecture
State management
Data flow
Service architecture
Security
Performance
Accessibility
Deployment strategy
Scalability roadmap

Every engineering decision during implementation should align with this document to ensure the platform remains consistent, maintainable, scalable, and ready for future production evolution.

✅ Review Notes

I would make one architectural enhancement compared to many typical frontend projects: don't let the Service Layer read mock files directly.

Instead, introduce a Repository Interface from day one:

Presentation Layer
        │
        ▼
Service Layer
        │
        ▼
Repository Interface
        │
        ├──────────────► Mock Repository (POC)
        │
        └──────────────► API Repository (Future)