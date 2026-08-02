Document 09 – State Management Strategy

Project: FD Investment Platform

Version: 1.0

Status: Engineering Blueprint

1. Purpose

The State Management Strategy defines how application data is created, shared, updated, and synchronized across the FD Investment Platform.

The objective is to ensure that every module manages state consistently while avoiding unnecessary complexity, duplicated data, and tightly coupled components.

The platform follows the principle:

Keep state as close as possible to where it is used, and elevate it only when necessary.

2. State Management Philosophy

The platform follows five principles.

Single Source of Truth

Each piece of data has one owner.

Avoid multiple copies of the same state.

Local Before Global

If state is used only within a single page or component, it should remain local.

Global state is reserved for data shared across multiple modules.

Server Data ≠ UI State

Server data and UI state have different responsibilities and should not be managed together.

Examples:

Server Data

FD Products
Bank List
Portfolio
Reports

UI State

Selected Tab
Sidebar Open
Modal Visibility
Filters
Current Theme
Predictable Data Flow

State flows in one direction.

API
    ↓
Store / Query
    ↓
Feature
    ↓
Component

Components never mutate shared state directly.

Minimal Global State

Only data required across multiple features belongs in the global store.

Everything else stays local.

3. Types of State

The platform recognizes four categories of state.

Local State

Owned by a single component.

Examples

Input values
Accordion expansion
Modal visibility
Selected card
Pagination page

Recommended Tool

React useState
Feature State

Shared within a single business module.

Examples

Marketplace

Selected Filters
Compare List
Search Query

Portfolio

Selected Investment
Active Chart

Booking

Booking Step

Feature state should remain inside its module.

Global Application State

Shared across multiple modules.

Examples

Authenticated User
Theme
Language
Notifications
Navigation
Permissions

Recommended Tool

Zustand
Remote Server State

Data originating from backend APIs.

Examples

FD Products
Interest Rates
Banks
Portfolio Data
Tax Records

Recommended Tool

TanStack Query (React Query)

Server state should not be duplicated in Zustand.

4. Recommended Technology
State Type	Technology
Local State	React useState
Derived State	useMemo
Shared Feature State	Custom Hooks / Context (only if needed)
Global State	Zustand
Server State	TanStack Query
Forms	React Hook Form
Validation	Zod

Each tool has a single responsibility.

5. Global Store Responsibilities

The global store should contain only application-wide data.

Example:

Global Store

Auth

Theme

Navigation

User Preferences

Notifications

Permissions

Do not store marketplace products or portfolio data here.

6. Feature State Ownership

Every module owns its own temporary state.

Example

Marketplace

Search Query

Selected Filters

Compare Products

Sort Order

Current View

Portfolio

Selected Investment

Chart Range

Export Options

Booking

Current Step

Entered Details

Confirmation Status

No feature should directly modify another feature's internal state.

7. Server State Strategy

Server data should always be fetched through a centralized query layer.

Examples

Marketplace

Product List
Product Details
Bank Information

Portfolio

Investments
Returns
Transactions

Reports

Statements
Analytics

Benefits

Automatic caching
Background refresh
Retry handling
Loading state
Error state
8. UI State Strategy

UI state should remain close to the UI.

Examples

Sidebar Open

Selected Menu

Current Tab

Modal Open

Toast Visible

Drawer Expanded

Avoid putting temporary UI state into the global store unless multiple parts of the application depend on it.

9. Form State Strategy

Forms should use React Hook Form.

Benefits

Minimal re-renders
Validation support
Better performance
Easy integration with Zod

Examples

Login
Registration
Bank Account
Booking
Profile
Support Request
10. Derived State

Avoid storing data that can be calculated.

Example

Instead of storing

Maturity Amount

Store

Deposit Amount

Interest Rate

Tenure

Then calculate maturity value when needed.

This reduces duplication and keeps data consistent.

11. Data Flow Architecture

The platform follows a one-way data flow.

API
      ↓
React Query
      ↓
Module Service
      ↓
Business Component
      ↓
UI Component

User interactions travel in the reverse direction.

12. State Boundaries

State should not cross architectural boundaries unnecessarily.

Allowed

Global Store
        ↓
Module
        ↓
Component

Avoid

Marketplace Component

↓

Admin Component

↓

Portfolio Component

Modules communicate through services or APIs, not by directly accessing each other's state.

13. Persistence Strategy

Only essential data should persist across sessions.

Persist

Theme
User Preferences
Authentication Token (or secure session identifier, depending on the authentication approach)
Language

Do Not Persist

Search Results
Modal State
Loading State
Temporary Filters
API Responses
14. Mock Data Strategy (POC)

During the POC phase:

Server state is simulated using Mock Service Worker (MSW) or static JSON served through a service layer.
Components interact with services exactly as they would in production.
Swapping mock services for real APIs should not require component changes.

This keeps the UI independent from the backend implementation.

15. Error State Strategy

Every asynchronous operation must support:

Loading
Success
Empty
Error
Retry

These states should be consistent across all modules.

16. Performance Strategy

To minimize unnecessary re-renders:

Keep state localized.
Memoize derived values only when beneficial.
Split large stores into smaller slices.
Subscribe only to the state a component needs.
Avoid passing deeply nested props when composition or context is more appropriate.
17. Testing Strategy

State management should be validated through:

Unit tests for stores and hooks.
Integration tests for feature workflows.
Mock API testing.
Error state testing.
Persistence verification where applicable.
18. Future Scalability

The strategy supports future modules such as:

Mutual Funds
Bonds
Insurance
Gold Investments
AI Investment Advisor

Each module manages its own feature state while sharing the same global and server-state architecture.

19. Success Criteria

The State Management Strategy is successful when:

Each piece of data has a clear owner.
Local, global, and server state are clearly separated.
Components remain reusable and predictable.
New modules integrate without restructuring existing state.
Backend APIs can replace mocks with minimal code changes.
20. Deliverable Outcome

This document establishes the data management foundation of the FD Investment Platform.

It defines:

State ownership
State categories
Global state strategy
Feature state strategy
Server state strategy
Form management
Data flow
Persistence rules
Error handling
Performance considerations
Scalability approach

It ensures the platform maintains a predictable, scalable, and maintainable state architecture from the POC through future production phases.

Engineering Review

One refinement based on our technology decisions:

For this project, I recommend the following stack as the standard:

Responsibility	Technology
Local UI State	React useState
Feature Logic	Custom Hooks
Global App State	Zustand
Server State & Caching	TanStack Query
Forms	React Hook Form
Validation	Zod
Mock Backend	MSW + JSON data
Future Backend	NestJS + PostgreSQL APIs

This combination is lightweight, scalable, and widely adopted in modern React/Next.js applications. It aligns well with our goal of building an investor-ready platform where the POC can evolve into a production-grade system without major architectural changes.