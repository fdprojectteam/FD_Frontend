14 — Functional Requirements Specification (FRS)
Purpose of this Document

The Functional Requirements Specification (FRS) defines the functional behaviour of the FD Booking module in a precise, implementation-ready format.

It translates product strategy, user journeys, business rules, capability architecture, and state transitions into verifiable requirements that can be implemented consistently across frontend applications, backend services, APIs, and partner integrations.

Each requirement is uniquely identified, traceable, testable, and independent of any specific technology or user interface.

The objective is to ensure every team builds the same product behaviour while maintaining long-term scalability and consistency.

Requirement Structure

Every functional requirement follows the same template.

Field	Description
Requirement ID	Unique identifier
Capability	Related business capability
Domain	Business domain
Priority	Critical / High / Medium / Low
Description	Functional requirement
Preconditions	Required conditions
Trigger	Event that starts the behaviour
Main Flow	Expected system behaviour
Alternative Flows	Exceptional or optional behaviour
Business Rules	Linked business rules
State Impact	Related workflow states
Acceptance Criteria	Testable outcome
Dependencies	Related services/capabilities
Capability 1 — Investment Summary
Requirement ID

FR-INV-001

Capability

Investment Summary

Priority

Critical

Description

The system shall display a persistent investment summary throughout the Booking journey.

Summary includes
Bank Name
Product Name
Deposit Amount
Interest Rate
Tenure
Interest Payout
Estimated Interest
Maturity Amount
Maturity Date
Acceptance Criteria
Investment information remains visible across all booking stages.
Updates immediately when investment configuration changes.
Displays consistent values on every screen.
Linked Rules
BR-SYS-002
BR-INV-004
Requirement ID

FR-INV-002

Description

The system shall recalculate estimated returns immediately whenever investment inputs change.

Updates include:

Interest Earned
Maturity Value
Maturity Date
Acceptance Criteria

Calculations are refreshed without requiring page reloads.

Capability 2 — Investor Profile
Requirement ID

FR-USER-001

Description

The system shall reuse previously verified investor information wherever possible.

Acceptance Criteria

Previously verified fields are displayed as read-only unless re-verification is required.

Linked Rules

BR-INVESTOR-002

Requirement ID

FR-USER-002

Description

The system shall request only information that is missing or required for the selected investment product.

Acceptance Criteria

Users are never asked to re-enter existing verified information.

Capability 3 — Investment Configuration
Requirement ID

FR-CONF-001

Description

The system shall validate investment configuration before allowing the user to continue.

Validation
Minimum Amount
Maximum Amount
Supported Increment
Product Availability
Acceptance Criteria

Validation occurs immediately after changes.

Linked Rules

BR-INV-001

BR-INV-002

BR-PROD-001

Requirement ID

FR-CONF-002

Description

The system shall preserve user-entered investment configuration during navigation, refreshes (where feasible), and recoverable interruptions.

Capability 4 — Nominee Management
Requirement ID

FR-NOM-001

Description

The system shall allow users to:

Add Nominee
Edit Nominee
Replace Nominee
Reuse Existing Nominee
Acceptance Criteria

Nominee information is reusable across future bookings.

Requirement ID

FR-NOM-002

Description

If nominee information is mandatory, users shall not proceed without completing nominee details.

Linked Rules

BR-NOM-001

Capability 5 — Bank Account Management
Requirement ID

FR-BANK-001

Description

The system shall display all verified eligible bank accounts available for funding.

Acceptance Criteria

Users can select one account for the current booking.

Requirement ID

FR-BANK-002

Description

The system shall prevent the selection of unverified bank accounts.

Capability 6 — Review Engine
Requirement ID

FR-REV-001

Description

The system shall generate a consolidated review of the investment before payment.

Includes

Investment

↓

Investor

↓

Nominee

↓

Bank Account

↓

Returns

↓

Declarations

Acceptance Criteria

Every section can be edited before payment.

Capability 7 — Consent Management
Requirement ID

FR-CONSENT-001

Description

Users shall explicitly accept required declarations before payment.

Acceptance Criteria

Payment controls remain disabled until mandatory consent is accepted.

Linked Rules

BR-COMP-001

Capability 8 — Payment Orchestration
Requirement ID

FR-PAY-001

Description

The system shall initiate payment only after successful validation of all booking requirements.

Requirement ID

FR-PAY-002

Description

The system shall support payment retry without requiring users to repeat completed booking steps.

Requirement ID

FR-PAY-003

Description

The system shall display real-time payment status whenever supported by the payment provider.

Requirement ID

FR-PAY-004

Description

The system shall prevent duplicate payment attempts for the same booking request.

Capability 9 — Booking Processing
Requirement ID

FR-BOOK-001

Description

Following successful payment, the system shall submit the booking request to the selected partner bank.

Requirement ID

FR-BOOK-002

Description

The system shall display the booking status while awaiting partner confirmation.

States
Processing
Pending Confirmation
Confirmed
Failed
Capability 10 — Booking Confirmation
Requirement ID

FR-CONFIRM-001

Description

The system shall generate a booking confirmation upon successful partner confirmation.

Includes
Booking Reference
Investment Summary
Confirmation Timestamp
Next Steps
Capability 11 — Portfolio Synchronization
Requirement ID

FR-PORT-001

Description

The system shall create a portfolio holding only after successful booking confirmation.

Acceptance Criteria

Failed or pending bookings do not appear as active investments.

Cross-Cutting Functional Requirements
FR-SYS-001 — Session Recovery

The platform shall restore interrupted booking sessions whenever possible.

FR-SYS-002 — Auto Save

The platform shall automatically preserve booking progress without requiring manual save actions.

FR-SYS-003 — Responsive Experience

The Booking module shall provide an equivalent functional experience across desktop, tablet, and mobile devices.

FR-SYS-004 — Accessibility

The Booking workflow shall support keyboard navigation, assistive technologies, semantic structure, and sufficient visual contrast in accordance with WCAG standards.

FR-SYS-005 — Performance

Critical booking interactions should provide immediate visual feedback, with long-running operations communicating progress clearly to maintain user confidence.

Traceability Matrix
Requirement	Capability	Domain	Business Rule	State
FR-INV-001	Investment Summary	Investment Product	BR-SYS-002	All
FR-CONF-001	Investment Configuration	Booking	BR-INV-001	Configuration
FR-NOM-002	Nominee Management	Nominee	BR-NOM-001	Nominee
FR-PAY-001	Payment Orchestration	Payment	BR-PAY-001	Payment Initiated
FR-BOOK-001	Booking Processing	Booking	BR-BOOK-002	Processing
FR-PORT-001	Portfolio Synchronization	Portfolio	BR-BOOK-003	Confirmed

This traceability ensures every implemented feature can be linked back to its originating business requirement.

Functional Requirement Decision Records
Decision 01 — Capability-Based Requirements

Decision: Organize requirements around business capabilities instead of screens.

Why: Capabilities are reusable across multiple journeys, reducing duplication and improving maintainability.

Decision 02 — Full Traceability

Decision: Every functional requirement must map to business rules, domains, capabilities, and workflow states.

Why: This provides end-to-end traceability from product vision to implementation and testing, making change management significantly easier.

Decision 03 — UI Independence

Decision: Functional requirements define behaviour, not presentation.

Why: The same requirements should apply across web, mobile, APIs, and future channels without modification.

Document Outcome

The Functional Requirements Specification translates the Booking module into an implementation-ready specification. By defining requirements around reusable capabilities and linking them to domains, business rules, and workflow states, the document provides a single, authoritative source for implementation, testing, and future evolution.