09 — Information Architecture
Purpose of this Document

The Information Architecture (IA) defines how information is organized, prioritized, and presented throughout the FD Booking experience.

The objective is to ensure users always have access to the information they need to make confident investment decisions without being overwhelmed by unnecessary details.

Rather than organizing the booking experience around forms or backend entities, the platform organizes information around user decisions.

This document establishes the information hierarchy, content ownership, progressive disclosure strategy, and structural principles that guide the Booking module.

Information Architecture Principles

The Booking module follows these core principles.

1. Decision-Driven Information

Information should appear when it supports a decision.

Not before.

Not after.

Example

Don't show nominee rules on the first screen.

Show them only when users reach the nominee step.

2. Context Preservation

Users should never lose context about what they are investing in.

The investment remains the primary focus throughout the journey.

Essential investment information should always be available without forcing users to navigate backward.

3. Progressive Disclosure

Complex financial information should be revealed gradually.

Users should never encounter large blocks of information that are unrelated to their current task.

4. Information Hierarchy

Every screen should communicate:

Primary Information

↓

Supporting Information

↓

Additional Details

↓

Legal Information

The interface should naturally guide users toward the most important content.

5. Transparency

Every important value should answer:

What is this?
Why does it matter?
How was it calculated?
Can it change?
Information Domains

Instead of thinking in terms of pages, we define information domains.

These domains become reusable across the platform.

Domain 1 — Investment Information

Purpose:

Help users understand what they are investing in.

Contains:

Bank
FD Product
Interest Rate
Deposit Amount
Tenure
Interest Payout
Estimated Returns
Maturity Amount
Maturity Date
Product Benefits

Visibility:

Throughout the booking journey.

Never hidden.

Domain 2 — Investor Information

Purpose:

Identify the investor.

Contains:

Full Name
PAN
Aadhaar Status
Contact Information
Residential Status
Investor Category

Visibility:

Only when required.

Reuse verified information whenever possible.

Domain 3 — Nominee Information

Purpose:

Manage beneficiary information.

Contains:

Nominee Details
Relationship
Allocation (future support)
Guardian Details (if applicable)

Visibility:

Only during nominee configuration and review.

Domain 4 — Banking Information

Purpose:

Manage funding and maturity instructions.

Contains:

Linked Bank Account
IFSC
Account Holder
Payment Method
Maturity Credit Account

Visibility:

During bank selection and final review.

Domain 5 — Investment Outcome

Purpose:

Explain expected financial results.

Contains:

Principal
Interest Earned
Total Returns
Maturity Amount
Maturity Date
Tax Information (future capability)

Visibility:

Visible throughout the booking process and emphasized during review.

Domain 6 — Compliance Information

Purpose:

Meet regulatory requirements.

Contains:

Terms & Conditions
Declarations
Consents
Regulatory Notices
Risk Statements

Visibility:

Progressively introduced and summarized before confirmation.

Avoid overwhelming users with legal text.

Domain 7 — System Status

Purpose:

Communicate platform activity.

Contains:

Current Step
Validation Status
Payment Status
Booking Status
Partner Bank Status
Processing Timeline

Visibility:

Dynamic throughout the journey.

Information Hierarchy by Stage
Booking Stage	Primary Information	Supporting Information	Hidden Until Needed
Investment Review	Investment Summary	Returns	Legal Terms
Investor Verification	Missing Profile Details	Why Information is Needed	Nominee
Investment Configuration	Amount, Payout	Updated Returns	Bank Details
Nominee	Nominee Details	Benefits	Consent
Bank Account	Linked Account	Payment Information	Legal Documents
Review	Complete Investment Summary	Editable Sections	Processing Status
Payment	Payment Progress	Security Information	Confirmation
Success	Booking Confirmation	Next Steps	Historical Information
Information Priority Model

Every piece of information belongs to one of four priority levels.

Level 1 — Critical

Users must see immediately.

Examples:

Investment Amount
Interest Rate
Maturity Value
Current Step
Level 2 — Important

Supports decision-making.

Examples:

Bank Information
Nominee Summary
Payment Account
Estimated Returns
Level 3 — Supporting

Helpful but not essential.

Examples:

Product Benefits
FAQs
Help Content
Eligibility Notes
Level 4 — Reference

Available on demand.

Examples:

Full Terms
Legal Documents
Regulatory Information
Historical Logs
Information Relationships
Investment
        │
        ├────────────┐
        │            │
        ▼            ▼
Investor      Investment Outcome
        │            │
        ▼            ▼
Nominee      Banking
        │            │
        └──────┬─────┘
               ▼
Review
               ▼
Confirmation
               ▼
Portfolio

This relationship model ensures that data flows logically and minimizes duplication.

Progressive Disclosure Strategy

The platform should reveal information only when it becomes relevant.

Stage 1

Show:

Investment

Do not show:

Compliance

Stage 2

Show:

Investor Information

Hide:

Nominee

Stage 3

Show:

Nominee

Hide:

Payment Processing

Stage 4

Show:

Review

Reveal:

Declarations

Stage 5

Show:

Processing

Hide:

Portfolio Details until booking is confirmed.

Design Implications
Product Decisions
Organize information around user decisions rather than backend entities.
Keep investment context visible throughout the booking process.
Introduce legal and compliance content progressively to avoid overwhelming users.
UX Decisions
Prioritize information based on user intent at each stage.
Maintain a clear visual hierarchy so users immediately recognize what requires attention.
Use expandable sections for reference content while keeping critical information prominent.
Engineering Decisions
Model information as reusable domains that can be shared across Booking, Portfolio, Maturity, and future investment products.
Avoid duplicating data across components; use a single source of truth for each information domain.
Design APIs to return structured domain objects instead of page-specific payloads, making the frontend more modular and easier to evolve.
Accessibility Decisions
Ensure screen readers announce content in logical order.
Preserve semantic heading hierarchy.
Keep critical information accessible without excessive navigation.
Avoid relying solely on color or icons to communicate status.
Success Indicators

The Information Architecture is successful when users:

Can always identify what they are investing in.
Understand what information is required at each step.
Never feel overwhelmed by unnecessary details.
Can locate important information within seconds.
Complete the booking journey with minimal cognitive effort.
Document Outcome

The Information Architecture establishes the structural foundation of the Booking module. It defines what information exists, how it is organized, when it should be presented, and how it supports user decisions.

By treating information as reusable domains rather than page-specific content, the platform gains a scalable foundation that can support future modules such as Portfolio, Maturity Management, Corporate Deposits, Bonds, and other investment products without rethinking the underlying information model.