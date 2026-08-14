Purpose of this Document

The Screen Inventory & Navigation Map defines every user-facing screen, modal, and navigation path involved in the FD Booking journey.

Rather than focusing on UI design, this document establishes the complete interaction map for the Booking module. It ensures that every user action, navigation path, entry point, exit point, and recovery flow is identified before implementation begins.

The objective is to guarantee that no user scenario is overlooked and that every screen has a clearly defined purpose within the investment journey.

Objectives

This document answers:

What screens are part of the Booking journey?
How does a user enter the Booking flow?
What are the mandatory and optional steps?
Which screens are reusable?
What happens when users leave and return?
Where can errors occur?
How are success and failure handled?
How does navigation behave across devices?
Design Principles
1. One Screen, One Responsibility

Each screen should solve one primary user task.

Avoid combining unrelated actions into a single screen.

2. Progressive Disclosure

Show only the information required for the current decision.

Avoid overwhelming users with unnecessary details.

3. Recoverable Navigation

Users should be able to:

Go back without losing progress.
Resume interrupted bookings.
Recover gracefully from errors.
4. Trust Through Context

Every screen should clearly communicate:

What the user is doing.
Why the information is needed.
What happens next.
Booking Journey Overview
Marketplace
      │
      ▼
Product Details
      │
      ▼
Start Booking
      │
      ▼
Booking Overview
      │
      ▼
Investment Details
      │
      ▼
Nominee
      │
      ▼
Bank Account
      │
      ▼
Review & Confirm
      │
      ▼
Payment
      │
      ▼
Processing
      │
      ▼
 ┌───────────────┬────────────────┐
 ▼               ▼
Success         Failure
 │               │
 ▼               ▼
Portfolio      Retry / Support
Entry Points

A booking may begin from multiple locations.

Entry Point	Description
Marketplace Product Card	User starts directly from product listing
Product Details	Primary booking entry
Comparison Screen	User selects one of the compared products
Resume Booking	Continue an incomplete booking
Promotional Campaign (Future)	Deep link to a pre-selected product
Screen Inventory
Screen 1 — Booking Overview
Purpose

Summarize the selected FD product before collecting any additional information.

Displays
Selected bank
Interest rate
Tenure
Investment amount
Estimated maturity amount
Key benefits
Important notes
Primary Action

Continue

Screen 2 — Investment Details
Purpose

Allow the user to review or adjust investment-specific options.

Displays
Investment amount
Tenure (if selectable)
Interest payout option
Live return calculation
Primary Action

Continue

Screen 3 — Nominee
Purpose

Capture or select nominee information.

Supports
Existing nominee
Add new nominee
Edit nominee
Primary Action

Save & Continue

Screen 4 — Bank Account
Purpose

Select the funding and maturity payout account.

Supports
Choose saved account
Add new account
Verify account (if required)
Primary Action

Continue

Screen 5 — Review & Confirm
Purpose

Provide a final review before payment.

Displays
Product summary
Investment summary
Nominee
Bank account
Consents
Terms & declarations
Primary Action

Proceed to Payment

Screen 6 — Payment
Purpose

Initiate the investment payment.

Displays
Payment amount
Selected payment method
Security messaging
Primary Action

Pay Now

Screen 7 — Processing
Purpose

Inform the user that payment and booking confirmation are in progress.

Displays
Progress indicator
Current processing step
Estimated completion time (if available)
User Action

No manual input required.

Screen 8 — Success
Purpose

Confirm that the booking has been completed successfully.

Displays
Booking reference
Investment summary
Next steps
Certificate availability (if immediate)
Portfolio shortcut
Primary Actions
View Portfolio
Download Receipt (if available)
Screen 9 — Failure / Pending
Purpose

Clearly explain what happened if the booking could not be completed immediately.

Scenarios
Payment failed
Booking rejected
Bank response pending
Technical issue
Primary Actions
Retry (where appropriate)
Contact Support
Return to Dashboard
Supporting Modals

These are reusable interactions rather than standalone screens.

Modal	Purpose
Exit Confirmation	Prevent accidental loss of progress
Unsaved Changes	Confirm navigation away
Delete Nominee	Confirm removal
Add Bank Account	Quick account creation
Session Timeout	Inform the user and provide recovery options
Navigation Rules
Forward Navigation

Only available after mandatory validations pass.

Back Navigation

Should preserve previously entered information.

Exit Behaviour

If progress exists:

Prompt before exiting.
Offer to save and resume later (if supported).
Refresh Behaviour

If the page reloads unexpectedly:

Restore the booking state where possible.
If recovery is not possible, explain the reason and guide the user.
Recovery Paths
Situation	Recovery
User closes browser	Resume booking
Payment interrupted	Recheck payment status
Network lost	Retry after reconnecting
Session expires	Re-authenticate and continue if possible
Bank response delayed	Show pending status and notify later
Responsive Navigation
Desktop
Horizontal progress indicator
Side-by-side summary panels where appropriate
Mobile
Vertical flow
Sticky primary action
Collapsible summaries to reduce scrolling
Screen Ownership Matrix
Screen	Primary Capability
Booking Overview	Booking
Investment Details	Booking
Nominee	Investor
Bank Account	Investor
Review & Confirm	Booking
Payment	Payment
Processing	Booking
Success	Portfolio
Failure	Booking
Design Implications
Product Decisions
Keep the booking journey linear and predictable.
Minimize unnecessary navigation.
Support interruption and recovery.
UX Decisions
Present only the information needed for each step.
Preserve user progress.
Provide clear confirmation at every transition.
Engineering Decisions
Implement each screen as an independent feature route or step.
Maintain booking state consistently across navigation.
Support resumable workflows and graceful error recovery.
QA Decisions
Verify all navigation paths.
Test interruption scenarios.
Validate recovery from failures and session expiration.
Ensure responsive behavior across supported devices.
Architecture Decision Records (ADR)
ADR-001 — Linear Guided Flow

Decision: The primary booking experience follows a guided, sequential flow.

Why: Reduces cognitive load and minimizes user errors during a financial transaction.

ADR-002 — Resumable Journey

Decision: Incomplete bookings should be recoverable wherever technically feasible.

Why: Users may interrupt the process due to network issues, payment delays, or personal reasons. Supporting resumption improves completion rates and user trust.

ADR-003 — Screen Responsibility

Decision: Each screen has a single, clearly defined responsibility.

Why: Simplifies implementation, improves usability, and makes testing and maintenance more predictable.

Document Outcome

The Screen Inventory & Navigation Map establishes the complete interaction blueprint for the FD Booking module. It identifies every screen, entry point, navigation rule, recovery path, and supporting interaction required to deliver a guided, trustworthy, and resilient booking experience before UI design and implementation begin.