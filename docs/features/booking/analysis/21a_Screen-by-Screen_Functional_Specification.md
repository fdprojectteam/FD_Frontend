Purpose of this Document

The Screen-by-Screen Functional Specification defines the functional behavior, business interactions, validations, UI components, data requirements, state transitions, accessibility considerations, and API interactions for every screen within the FD Booking journey.

Rather than describing visual design, this document specifies how each screen behaves, ensuring a consistent implementation across engineering, QA, and future enhancements.

The objective is to remove ambiguity from implementation while maintaining the platform's core principles of simplicity, transparency, trust, and performance.

Objectives

This document answers:

What is the purpose of each screen?
Which business capability owns the screen?
What information is displayed?
What user actions are supported?
Which validations are required?
Which APIs are called?
What loading, success, and error states exist?
What accessibility behaviors must be supported?
What analytics events should be captured?
Screen Specification Template

Every Booking screen will follow the same structure:

Screen Overview
Business Objective
Entry Conditions
Exit Conditions
UI Components
Data Requirements
User Actions
Business Rules
Validations
API Interactions
State Transitions
Loading States
Empty States
Error States
Accessibility Requirements
Analytics Events
Performance Considerations
Security Considerations
Acceptance Criteria
Screen 1 — Booking Overview
1. Screen Overview

Screen Name: Booking Overview

Primary Capability: Booking

Purpose:

Provide users with a clear summary of the selected Fixed Deposit before they begin the investment process.

This screen reinforces confidence by allowing users to verify that they selected the intended product.

2. Business Objective

Allow the user to answer one question:

"Is this the FD I want to invest in?"

No data collection should occur on this screen.

3. Entry Conditions

The user arrives from:

Marketplace
Product Details
Comparison
Resume Booking

A valid product must already be selected.

4. Exit Conditions

User selects:

Continue

↓

Booking session begins.

5. UI Components
Product Summary Card

Displays:

Bank Logo
Bank Name
Product Name
Interest Rate
Tenure
Interest Payout Type
Investment Summary

Displays:

Investment Amount
Estimated Interest
Estimated Maturity Amount
Maturity Date
Trust Indicators

Examples:

DICGC Insured (where applicable)
RBI Regulated Bank
Secure Investment Process
Important Information

Highlights:

Minimum investment
Premature withdrawal policy
Tax information (summary)
Primary CTA

Continue

Secondary CTA

Back to Product

6. Data Requirements

Required:

Product
Selected Tenure
Investment Amount
Interest Rate
Return Calculation

Derived:

Maturity Amount
Estimated Interest
Investment Duration
7. User Actions

Supported:

Continue
Back
Expand Product Details
View Interest Calculation

No editing occurs on this screen.

8. Business Rules

The screen must:

Display the latest confirmed product information.
Recalculate values if product data changes before booking starts.
Prevent continuation if the selected product is unavailable.
9. Validations

System Validation:

Product exists.
Product is active.
Interest rate is valid.
Investment amount satisfies product constraints.

Validation failures should block progression with a clear explanation.

10. API Interactions
On Screen Load

Retrieve:

Product Details
Current Interest Rate
Investment Calculation
On Continue

Create or resume a Booking Session.

No payment or investment submission occurs at this stage.

11. State Transitions
Loading
    │
    ▼
Ready
    │
    ├── Continue → Investment Details
    │
    ├── Back → Product Details
    │
    └── Product Unavailable → Error
12. Loading States

Display skeleton placeholders for:

Product card
Investment summary
Trust indicators

The primary action remains disabled until all required data is loaded.

13. Empty States

Possible scenarios:

Product removed
Product temporarily unavailable

Display:

Clear explanation
Return to Marketplace button
14. Error States

Examples:

Network failure
Calculation unavailable
Product no longer offered
Service temporarily unavailable

Recovery:

Retry
Back to Marketplace
15. Accessibility Requirements
Full keyboard navigation.
Logical heading hierarchy.
Screen reader announcements for dynamic calculation updates.
Focus moves to error messages when validation fails.
Buttons include descriptive accessible labels.
Minimum touch target size of 44 × 44 px for mobile.
16. Analytics Events

Capture:

Booking Started
Product Viewed
Continue Clicked
Calculation Expanded
Product Unavailable
Booking Abandoned (from this screen)

No personally identifiable information (PII) should be included in analytics payloads.

17. Performance Considerations
Product details should be prefetched from the previous screen where possible.
Derived calculations should be computed efficiently to avoid unnecessary re-renders.
Skeleton loading should appear within 100 ms on slow networks to maintain perceived responsiveness.
18. Security Considerations
Never trust client-side calculations for financial decisions.
Refresh product data from the server before creating the booking session.
Do not expose internal product identifiers beyond what is required by the frontend.
19. Acceptance Criteria
Functional
Product details display correctly.
Investment summary matches the selected configuration.
Continue creates or resumes a booking session.
Navigation works from all supported entry points.
UX
Users understand what they are investing in before proceeding.
Trust indicators are clearly visible.
Important information is easy to discover without overwhelming the screen.
Technical
Loading, error, and empty states are implemented.
Accessibility requirements pass automated and manual verification.
Analytics events are emitted correctly.
Performance targets from the Quality Attribute Specification are met.
Design Principles Reinforced

This screen should make the user feel:

Confident — "I selected the right investment."
Informed — "I understand what I'm investing in."
Secure — "The platform is trustworthy."
Ready — "I'm comfortable moving to the next step."

The screen should never pressure the user into continuing. Its role is to provide clarity and confirmation before entering the booking workflow.