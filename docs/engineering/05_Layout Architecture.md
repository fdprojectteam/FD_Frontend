Document 05 – Layout Architecture

Project: FD Investment Platform
Document Version: 1.0
Status: Engineering Blueprint

1. Purpose

The Layout Architecture defines the structural framework used throughout the FD Investment Platform.

Its purpose is to provide a consistent application shell that every module shares, ensuring users experience one unified platform regardless of whether they are using the Marketplace, Portfolio, Support, or Admin modules.

The layout system separates page structure from page content, allowing new features to be introduced without redesigning the application's foundation.

2. Layout Principles

Every layout should follow these principles.

Consistency

Every screen follows the same structural foundation.

Users should instantly recognize where navigation, actions, and content are located.

Reusability

Layouts are shared across the platform.

Features should plug into layouts instead of creating their own page structures.

Responsiveness

Layouts adapt naturally to:

Desktop
Tablet
Mobile

without changing user workflows.

Scalability

Future modules should fit into the existing layout system without structural changes.

Accessibility

Layouts should maintain logical reading order, keyboard navigation, and semantic landmarks.

3. Platform Layout Hierarchy

The platform is built using nested layouts.

Application Shell
        │
        ▼
Role Layout
        │
        ▼
Module Layout
        │
        ▼
Page Layout
        │
        ▼
Content Components

Each level has a clearly defined responsibility.

4. Application Shell

The Application Shell is the permanent structure of the platform.

It includes:

Header
Sidebar
Main Content Area
Global Notifications
Toast Container
Modal Portal
Loading Overlay

These elements persist while page content changes.

Desktop Shell
+-----------------------------------------------------------+
| Header                                                    |
+-------------+---------------------------------------------+
| Sidebar     |                                             |
|             |                                             |
|             |              Main Content                   |
|             |                                             |
|             |                                             |
+-------------+---------------------------------------------+
Tablet Shell
+---------------------------------------------------+
| Header                                            |
+---------------------------------------------------+
| Collapsible Sidebar                               |
+---------------------------------------------------+
|                                                   |
|             Main Content                          |
|                                                   |
+---------------------------------------------------+
Mobile Shell
+---------------------------------------+
| Header                                |
+---------------------------------------+
|                                       |
|           Main Content                |
|                                       |
+---------------------------------------+

Navigation Drawer (Overlay)
5. Layout Regions

The platform is divided into logical regions.

Region	Purpose
Header	Global actions and identity
Sidebar	Primary navigation
Content	Module content
Page Header	Page title and actions
Content Body	Primary business content
Footer	Optional information

Each region has a fixed responsibility.

6. Header Architecture

The Header remains consistent across the platform.

Contains:

Logo
Breadcrumbs
Search (when applicable)
Notifications
User Profile
Settings

The Header should never contain module-specific actions.

7. Sidebar Architecture

The Sidebar provides primary navigation.

Characteristics:

Fixed position
Collapsible
Role-aware
Persistent state
Icon + Label
Supports grouped navigation

The Sidebar should remain visually stable while page content changes.

8. Main Content Area

The Content Area is where each module renders its pages.

Responsibilities:

Display business content
Maintain consistent spacing
Handle scrolling
Display loading and empty states

Only this region changes during navigation.

9. Page Layout Structure

Every page follows the same internal structure.

Page
│
├── Page Header
│
├── Summary Section (Optional)
│
├── Filters / Search (Optional)
│
├── Main Content
│
├── Supporting Content
│
└── Footer Actions (Optional)

This consistency reduces cognitive load and improves maintainability.

10. Page Header

Every page begins with a Page Header.

It contains:

Title
Description
Primary Action
Secondary Actions
Status (when applicable)

Example:

Marketplace

Explore Fixed Deposit opportunities.

[Compare]    [Filter]
11. Content Containers

Content should be organized into reusable containers.

Examples:

Summary Cards
Data Tables
Charts
Forms
Lists
Detail Cards
Empty States

Containers should never manage global layout concerns.

12. Responsive Breakpoints
Device	Width
Mobile	< 768px
Tablet	768px – 1023px
Desktop	≥ 1024px

The layout adapts while preserving the same information hierarchy.

13. Layout Behavior

Desktop:

Fixed Sidebar
Sticky Header
Scrollable Content

Tablet:

Collapsible Sidebar
Sticky Header
Responsive Content

Mobile:

Drawer Navigation
Simplified Header
Full-width Content
14. Scroll Strategy

Only the Content Area should scroll.

The Header and Sidebar remain fixed.

Benefits:

Stable navigation
Better orientation
Improved usability
15. Modal Layer

Global overlays include:

Modal
Drawer
Confirmation Dialog
Bottom Sheet (Mobile)
Toast Notifications

These render above all page content through a centralized overlay system.

16. Empty States

Every module should define meaningful empty states.

Examples:

Marketplace

"No investment products match your search."

Portfolio

"You don't have any active investments yet."

Support

"No support requests available."

Empty states should guide users toward the next action.

17. Loading States

Loading indicators should remain consistent.

Examples:

Skeleton Screens
Progress Indicators
Inline Loaders
Button Loading States

Avoid layout shifts during loading.

18. Error States

Error layouts should include:

Clear message
Recovery action
Retry option
Contact Support (where appropriate)

Errors should explain what happened without exposing technical details.

19. Layout Accessibility

The layout should support:

Semantic landmarks (header, nav, main, footer)
Keyboard navigation
Skip-to-content links
Logical focus order
Screen reader compatibility

Accessibility must be part of the layout architecture, not an afterthought.

20. Future Expansion

The layout architecture should support future modules without structural redesign.

Examples:

AI Assistant Panel
Financial Insights Dashboard
Wealth Management
Mutual Funds
Insurance

New modules should occupy the existing content region and reuse the same shell.

21. Success Criteria

The layout architecture is successful when:

Every page feels part of the same product.
Navigation remains stable across modules.
New pages require minimal layout work.
Responsive behavior is consistent.
Users can focus on content rather than interface changes.
22. Deliverable Outcome

This document defines the structural framework of the FD Investment Platform.

It establishes:

Application Shell
Layout hierarchy
Responsive behavior
Content regions
Page templates
Header and Sidebar responsibilities
Scroll behavior
Overlay system
Accessibility requirements

It serves as the blueprint for implementing reusable layouts across all current and future modules.