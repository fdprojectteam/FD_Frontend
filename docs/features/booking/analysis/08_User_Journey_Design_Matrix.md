08 — User Journey Decision Matrix
Purpose of this Document

The Future State User Journey defines the ideal booking experience from the user's perspective. However, every user journey contains multiple decision points that determine how the system should respond based on the user's status, investment details, regulatory requirements, and system state.

The purpose of the User Journey Decision Matrix is to define every decision, condition, alternative path, and expected system behavior throughout the Booking journey.

This document serves as the functional blueprint for Product, UX, Frontend Engineering, Backend Engineering, and QA, ensuring that every scenario is handled consistently and predictably.

Rather than describing only the happy path, it defines the complete decision logic required to deliver a reliable, scalable, and user-centric booking experience.

Objectives

The Decision Matrix should answer:

What decisions occur during booking?
Who makes the decision—the user or the system?
What conditions influence the next step?
What happens if a condition is not satisfied?
Can the user recover?
What information should be preserved?
What should the UI communicate?
Decision Flow Overview
Invest Now
      │
      ▼
Authentication
      │
      ▼
Investor Eligibility
      │
      ▼
Investment Configuration
      │
      ▼
Nominee Decision
      │
      ▼
Bank Account Decision
      │
      ▼
Review Decision
      │
      ▼
Consent Decision
      │
      ▼
Payment Decision
      │
      ▼
Booking Processing
      │
      ▼
Success / Failure
Decision 1 — Investment Availability
Trigger

User clicks Invest Now.

Decision

Is the selected FD still available?

System Validation
Product active?
Interest rate valid?
Booking window open?
Investment amount supported?
Outcomes

Yes

Continue to Booking.

No

Explain the reason.

Offer:

Refresh product
View similar alternatives
Return to Marketplace
Product Decision Record

Decision

Always validate product availability before starting Booking.

Why

Prevent users from completing a journey for an unavailable product.

Decision 2 — Authentication
Decision

Is the user authenticated?

Outcomes

Authenticated

Continue.

Not Authenticated

Request sign-in.

After successful authentication:

Return to the exact booking state.

Never send users back to Marketplace.

Product Decision Record

Users should never lose booking context after authentication.

Decision 3 — Investor Profile
Decision

Does the user already have a verified investor profile?

System Checks
Profile Complete
PAN Verified
Aadhaar Verified (where applicable)
Required regulatory information available
Outcomes

Verified

Skip unnecessary steps.

Incomplete

Collect only missing information.

Never request information already available.

Decision 4 — Investment Rules
Decision

Does the investment satisfy product rules?

Examples:

Minimum investment
Maximum investment
Tenure eligibility
Customer category
Product availability
Outcomes

Valid

Continue.

Invalid

Explain the rule.

Provide guidance to correct the issue.

Never display technical validation errors.

Decision 5 — Nominee
Decision

Has the user already added a nominee?

Outcomes

Existing Nominee

Display existing nominee.

Allow:

Continue
Edit
Replace

No Nominee

Explain benefits.

Allow:

Add nominee
Continue if regulations permit
Decision 6 — Bank Account
Decision

Does the user have an eligible linked bank account?

Outcomes

Yes

Display verified account.

Allow selection if multiple accounts exist.

No

Guide the user through adding a supported bank account.

Decision 7 — Review
Decision

Has the user reviewed all critical investment information?

Review Sections
Investment
Investor
Nominee
Bank Account
Returns
Maturity
Declarations
Outcomes

Users may edit any section before continuing.

Product Principle

Review should increase confidence rather than simply confirm data.

Decision 8 — Consent
Decision

Has the user accepted all required declarations?

Outcomes

Accepted

Proceed.

Declined

Booking cannot continue.

Clearly explain why consent is required.

Decision 9 — Payment
Decision

Payment Result?

Outcomes

Success

Proceed to Booking Processing.

Pending

Display live status.

Allow safe waiting.

Failed

Explain reason.

Allow retry.

Preserve all booking information.

Users should never re-enter data because of a payment failure.

Decision 10 — Booking Confirmation
Decision

Did the partner bank successfully create the FD?

Outcomes

Success

Generate:

Booking Reference
Investment Summary
Portfolio Entry
Confirmation Timeline

Pending

Show:

Investment submitted.

Awaiting confirmation from partner bank.

Provide expected processing time.

Failed

Explain clearly.

Provide recovery actions.

Support retry where appropriate.

Decision Matrix Summary
Stage	Decision Owner	System Action
Investment Availability	System	Validate product status
Authentication	User/System	Authenticate and restore context
Investor Profile	System	Reuse verified information
Investment Rules	System	Validate against business rules
Nominee	User	Add, edit, or continue
Bank Account	User/System	Select or add verified account
Review	User	Verify and edit information
Consent	User	Accept required declarations
Payment	System/User	Process, retry, or recover
Booking Confirmation	System	Confirm investment or provide recovery
Cross-Cutting Rules

These rules apply to every stage of the journey:

Preserve progress automatically.
Keep investment summary accessible.
Provide contextual guidance instead of generic help.
Use clear, human-readable language.
Prevent data loss during interruptions.
Surface only actionable error messages.
Maintain consistent interaction patterns.
Ensure accessibility across devices and assistive technologies.
Design Implications
Product Decisions
The booking flow is dynamic, adapting to the user's current state rather than forcing a fixed sequence.
Users should never repeat work the platform can avoid.
Every interruption must have a clear recovery path.
UX Decisions
Use progressive disclosure to reduce complexity.
Clearly distinguish between user decisions and system processing.
Make status, progress, and next steps visible at all times.
Engineering Decisions
Model the booking process as a state machine or workflow engine rather than a series of loosely connected pages.
Separate workflow state (where the user is in the journey) from form state (the data they have entered).
Persist workflow state to support interruption recovery across devices or sessions.
Design each step as an independent, reusable capability.
QA Decisions

Every decision branch becomes a test scenario:

Product unavailable
Session expires during booking
Missing investor information
Invalid investment amount
No nominee
Payment pending
Payment failure
Bank confirmation delayed
Booking success

This ensures comprehensive functional coverage.

Document Outcome

The User Journey Decision Matrix transforms the booking experience from a simple screen flow into a deterministic product workflow. It defines how the platform behaves under every major decision point, ensuring consistency across Product, UX, Engineering, and QA.

This document becomes the operational blueprint for implementing a resilient, scalable, and user-centric Booking module.