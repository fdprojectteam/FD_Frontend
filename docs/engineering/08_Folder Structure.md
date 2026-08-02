Document 08 – Folder Structure

Project: FD Investment Platform

Version: 1.0

Status: Engineering Blueprint

1. Purpose

The Folder Structure defines how the FD Investment Platform source code is organized to support scalability, maintainability, collaboration, and long-term product evolution.

The architecture is designed around platform-first engineering, where every module shares a common foundation while remaining independently maintainable.

The structure aligns with:

Product Architecture
Information Architecture
Navigation Architecture
Layout Architecture
Design System Architecture
Component Architecture
2. Folder Organization Principles

The platform follows these principles.

Feature First

Business modules own their pages, business logic, hooks, and services.

Example:

Marketplace
Portfolio
Reports
Admin
Support
Shared Foundation

Anything reusable belongs in shared folders rather than individual features.

Examples:

Button
Modal
Table
Layout
Theme
Utilities
Separation of Concerns

Business logic, presentation, API, and state should never be mixed together.

Platform Consistency

Every feature follows the same internal folder structure.

Scalability

Adding a new module should require minimal structural changes.

3. High-Level Project Structure
src/
│
├── app/
├── modules/
├── components/
├── layouts/
├── design-system/
├── hooks/
├── services/
├── store/
├── lib/
├── utils/
├── types/
├── constants/
├── config/
├── assets/
├── styles/
└── mocks/

Each folder has a single responsibility.

4. App Directory

The app directory is responsible for routing.

Example:

app/

layout.tsx

page.tsx

marketplace/

product/

compare/

portfolio/

reports/

admin/

support/

Responsibilities:

Route definitions
Layout assignment
Page composition
Metadata

No business logic.

5. Modules Directory

The modules folder contains business domains.

modules/

marketplace/

booking/

portfolio/

notifications/

reports/

family/

tax/

support/

admin/

authentication/

bank-account/

Each module is self-contained.

Example:

modules/

marketplace/

components/

hooks/

services/

types/

constants/

utils/

pages/

The same structure repeats for every feature.

6. Components Directory

Contains platform-wide reusable UI components.

components/

ui/

business/

feedback/

forms/

navigation/

charts/

tables/

Example

components/

ui/

Button/

Input/

Card/

Modal/

Badge/

Table/

Pagination/

These components never belong to one module.

7. Design System Directory

Contains the design foundation.

design-system/

tokens/

themes/

typography/

icons/

spacing/

shadows/

motion/

Purpose:

Maintain one source of truth for the visual language.

8. Layouts Directory

Shared layouts across the application.

layouts/

AppShell/

DashboardLayout/

AdminLayout/

AuthLayout/

MarketplaceLayout/

Layouts define page structure—not page content.

9. Hooks Directory

Shared reusable hooks.

hooks/

useDebounce

usePagination

useSearch

useMediaQuery

useLocalStorage

useDisclosure

Feature-specific hooks remain inside their module.

Example:

modules/

marketplace/

hooks/

useMarketplaceProducts

useCompareProducts

useFilters
10. Services Directory

Contains shared platform services.

services/

api/

storage/

logger/

analytics/

auth/

notifications/

Business-specific services remain inside modules.

11. Store Directory

Contains global application state.

store/

auth/

theme/

navigation/

user/

app/

Feature state stays inside the feature when possible.

12. Lib Directory

Contains external library integrations.

Example:

lib/

axios

react-query

dayjs

zod

chart

Purpose:

Centralize third-party configuration.

13. Types Directory

Shared TypeScript definitions.

types/

api.ts

common.ts

user.ts

theme.ts

pagination.ts

Feature types remain inside the feature.

14. Constants Directory

Contains application constants.

constants/

routes.ts

permissions.ts

roles.ts

storage.ts

messages.ts

Avoid hardcoded values throughout the application.

15. Config Directory

Application configuration.

config/

env.ts

theme.ts

api.ts

featureFlags.ts
16. Assets Directory
assets/

images/

icons/

illustrations/

logos/

fonts/

Static resources only.

17. Styles Directory

Global styling.

styles/

globals.css

tailwind.css

animations.css

Most styling remains inside components using Tailwind.

18. Mock Directory

For the POC phase.

mocks/

products/

banks/

portfolio/

notifications/

reports/

users/

Later replaced by backend APIs without changing the UI layer.

19. Internal Feature Structure

Every module follows the same pattern.

Example:

modules/

marketplace/

components/

hooks/

services/

types/

constants/

utils/

pages/

Responsibilities:

components

Business components

hooks

Feature hooks

services

Business services

types

TypeScript models

constants

Feature constants

utils

Feature helper functions

pages

Feature page composition

20. Dependency Rules

Allowed flow:

Page
        ↓
Business Components
        ↓
Shared Components
        ↓
Hooks
        ↓
Services
        ↓
API

Avoid:

Components importing pages
Shared components importing feature modules
Circular dependencies
Feature-to-feature direct coupling

Communication between features should happen through shared services or APIs.

21. Folder Evolution Strategy

As the platform grows:

Current

Marketplace
Booking
Portfolio

Future

Marketplace
Mutual Funds
Insurance
Gold
Bonds
Loans

No restructuring should be required.

The architecture must accommodate future financial products naturally.

22. Folder Ownership
Folder	Owner
app	Routing & Composition
modules	Business Features
components	Shared UI
design-system	Visual Foundation
layouts	Shared Layouts
hooks	Shared Logic
services	Platform Services
store	Global State
lib	Third-Party Integrations
config	Application Configuration
mocks	POC Data
assets	Static Resources
styles	Global Styling
constants	Shared Constants
types	Shared Models
utils	Shared Utilities
23. Recommended Directory Structure
src/
├── app/
│   ├── (public)/
│   ├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
│
├── modules/
│   ├── marketplace/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── pages/
│   ├── booking/
│   ├── portfolio/
│   ├── reports/
│   ├── notifications/
│   ├── family/
│   ├── tax/
│   ├── support/
│   ├── admin/
│   ├── authentication/
│   └── bank-account/
│
├── components/
│   ├── ui/
│   ├── business/
│   ├── forms/
│   ├── feedback/
│   ├── navigation/
│   ├── tables/
│   └── charts/
│
├── design-system/
│   ├── tokens/
│   ├── themes/
│   ├── typography/
│   ├── icons/
│   ├── spacing/
│   ├── shadows/
│   └── motion/
│
├── layouts/
├── hooks/
├── services/
├── store/
├── lib/
├── config/
├── constants/
├── types/
├── utils/
├── styles/
├── assets/
└── mocks/
24. Success Criteria

The Folder Structure is successful when:

Every module follows the same organization.
Shared resources are not duplicated.
New developers can navigate the codebase easily.
New financial products can be added without restructuring.
Business logic remains isolated from presentation.
The structure scales from the current POC to a production-grade platform.
25. Deliverable Outcome

This document establishes the organizational blueprint of the FD Investment Platform codebase.

It defines:

Platform-wide directory structure
Feature-first module organization
Shared resource management
Dependency rules
Folder ownership
Scalability strategy
Future evolution path

The result is a codebase that remains clean, consistent, and maintainable as the platform expands from the approved Marketplace POC into a comprehensive financial ecosystem.