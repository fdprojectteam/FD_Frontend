Document 04 – Navigation Architecture

Project: FD Investment Platform
Document Version: 1.0
Status: Engineering Blueprint

1. Purpose

The Navigation Architecture defines how users move through the FD Investment Platform.

Its objectives are to:

Provide predictable navigation.
Reduce cognitive load.
Support role-based experiences.
Maintain consistency across all modules.
Scale as new products and capabilities are added.

Navigation should help users accomplish tasks, not merely display pages.

2. Navigation Principles

The platform follows these core principles.

Goal-Oriented

Navigation is organized around what users want to accomplish, not around the internal technical implementation.

Example:

✔ Marketplace

❌ Product Module

Consistency

Navigation placement, interaction, and terminology remain consistent throughout the platform.

Users should not relearn navigation between modules.

Progressive Disclosure

Only expose relevant navigation for the current role and context.

Avoid overwhelming users with unnecessary options.

Scalable

New modules should be introduced without requiring a redesign of the navigation.

Responsive

Navigation adapts naturally across:

Desktop
Tablet
Mobile

while maintaining the same information hierarchy.

3. Navigation Layers

The platform uses four navigation layers.

Global Navigation
        │
        ▼
Primary Navigation
        │
        ▼
Secondary Navigation
        │
        ▼
Contextual Navigation

Each layer serves a different purpose.

4. Global Navigation

Global Navigation contains platform-wide capabilities.

Visible from every screen.

Contents:

Platform Logo
Notifications
Search (where applicable)
User Profile
Settings
Help

Desktop example:

┌─────────────────────────────────────────────────────────────┐
│ Logo        Search        Notifications    Profile    Help  │
└─────────────────────────────────────────────────────────────┘
5. Primary Navigation

Primary Navigation contains the major business areas.

Investor Navigation:

Dashboard

Marketplace

Portfolio

Reports

Support

This represents the highest level of user tasks.

6. Secondary Navigation

Secondary Navigation appears only inside a primary module.

Example:

Marketplace

Marketplace

├── Browse Products
├── Product Categories (Future)
├── Saved Products (Future)
└── Recently Viewed

Portfolio

Portfolio

├── Investments
├── Maturity Calendar
├── Earnings
└── Statements

Secondary navigation keeps large modules organized without cluttering the primary sidebar.

7. Contextual Navigation

Contextual Navigation presents actions relevant to the current screen.

Example:

Product Details

Compare

Bookmark

Share

Download Details

Invest Now

These actions change depending on the current page.

8. Role-Based Navigation

Navigation adapts to the user's role while sharing the same platform shell.

Investor
Dashboard

Marketplace

Portfolio

Reports

Support
Support Executive
Dashboard

Customers

Tickets

Knowledge Base

Reports
Administrator
Dashboard

Products

Banks

Users

Bookings

Reports

Platform Settings

Users should only see options relevant to their responsibilities.

9. Navigation Shell

The application uses a shared shell for all experiences.

┌──────────────────────────────────────────────────────────┐
│ Header                                                   │
├──────────────┬───────────────────────────────────────────┤
│ Sidebar      │                                           │
│              │                                           │
│              │      Main Content Area                    │
│              │                                           │
│              │                                           │
├──────────────┴───────────────────────────────────────────┤
│ Footer (optional)                                        │
└──────────────────────────────────────────────────────────┘

The shell remains consistent across all modules.

10. Navigation Behaviour
Sidebar

Desktop:

Expanded by default
Collapsible
Persistent between pages

Tablet:

Collapsed by default
Expand on demand

Mobile:

Drawer navigation
Full-height overlay
Dismiss on selection
11. Breadcrumb Strategy

Breadcrumbs improve orientation within deeper workflows.

Example:

Marketplace

↓

Product Details

↓

Comparison

↓

Booking

Displayed as:

Marketplace
>

Product Details
>

Comparison

Breadcrumbs are not required for top-level pages.

12. Navigation State

The navigation system should preserve state where appropriate.

Examples:

Selected menu item
Expanded navigation groups
Active filters (where useful)
Scroll position when returning to lists

This creates a smoother user experience.

13. Deep Linking

Every meaningful screen should have its own URL.

Examples:

/marketplace

/marketplace/product/123

/comparison

/portfolio

/reports

Benefits:

Bookmarking
Browser history
Sharing links
Future SEO (if applicable)
14. Navigation Flow

A typical investor journey:

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
Processing
      │
Portfolio
      │
Reports
      │
Support

The flow should always feel continuous.

15. Future Navigation Expansion

The architecture should support additional financial products.

Future example:

Marketplace

├── Fixed Deposits

├── Mutual Funds

├── Bonds

├── Government Securities

└── Insurance

No redesign of the sidebar should be necessary.

16. Navigation Accessibility

Navigation must support:

Keyboard navigation
Visible focus indicators
Screen readers
Proper ARIA labels
Logical tab order
Minimum touch target sizes

Accessibility is a core navigation requirement.

17. Navigation Design Rules

The navigation system should follow these rules:

One primary navigation model across the platform.
Avoid duplicate menu items.
Maximum two navigation levels in the sidebar.
Context-specific actions belong within the content area, not the sidebar.
Keep menu labels concise and action-oriented.
Maintain consistent ordering across releases.
18. Success Criteria

The Navigation Architecture is successful when users can:

Understand where they are at all times.
Reach any major feature in two or three interactions.
Move naturally between related workflows.
Switch roles without relearning the interface.
Continue using the platform as new modules are added.

19. Deliverable Outcome

This document defines the navigation foundation of the FD Investment Platform.

It establishes:

Global navigation
Sidebar structure
Role-based navigation
Navigation behavior
Breadcrumbs
Deep linking
Responsive navigation
Accessibility standards
Future expansion strategy

This document becomes the reference for routing, layout implementation, and navigation components.