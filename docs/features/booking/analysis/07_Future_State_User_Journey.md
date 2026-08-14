07 — Future State User Journey (To-Be Experience)
Purpose of this Document

The Future State User Journey defines the ideal booking experience for the FD Investment Platform. It translates the product vision into a user-centric workflow that enables investors to complete a Fixed Deposit investment with confidence, clarity, and minimal effort.

Unlike the current industry approach, which primarily focuses on collecting user information, this journey is designed to guide users through the investment process by providing proactive assistance, contextual explanations, transparent decision-making, and continuous reassurance.

The objective is not simply to complete a transaction but to create an experience that users trust and are willing to return to for future investments.

Design Principles

Every stage of the journey must satisfy these principles.

✅ Reduce Cognitive Load

Users should focus on making investment decisions, not understanding the interface.

✅ Build Trust Continuously

Every interaction should reinforce confidence.

✅ Progressive Disclosure

Show only the information required at the current stage.

✅ Context Preservation

Users should never lose sight of the investment they are making.

✅ Intelligent Assistance

The platform should guide users instead of waiting for errors.

✅ Recoverability

Users should always know how to recover from interruptions or mistakes.

Future Booking Journey
Marketplace
      │
      ▼
Product Details
      │
      ▼
Click "Invest Now"
      │
      ▼
Booking Introduction
      │
      ▼
Investment Review
      │
      ▼
Investor Verification
      │
      ▼
Investment Configuration
      │
      ▼
Nominee
      │
      ▼
Bank Account
      │
      ▼
Review & Confirmation
      │
      ▼
Consent & Declaration
      │
      ▼
Payment
      │
      ▼
Processing
      │
      ▼
Booking Success
      │
      ▼
Portfolio

Unlike traditional flows, every stage has a specific purpose.

Journey Breakdown
Stage 1 — Investment Context
User Goal

Confirm the selected FD.

Platform Goal

Reassure the user before collecting information.

Show
Bank
FD Name
Interest Rate
Deposit Amount
Estimated Returns
Maturity Value
Maturity Date
DICGC Protection
Key Benefits
User Question

Is this the investment I want?

The interface should answer "Yes."

Stage 2 — Booking Introduction

Instead of immediately opening forms...

The platform welcomes the user.

Example

You're investing ₹5,00,000 with ABC Bank.

Estimated maturity:

₹5,74,120

This process usually takes around 3–5 minutes.

We'll guide you through each step.

Why?

Users immediately understand:

where they are
what happens next
expected duration

This significantly reduces anxiety.

Stage 3 — Investor Verification

Instead of asking everything...

Determine what already exists.

Example

✓ KYC Verified

✓ PAN Available

✓ Aadhaar Verified

✓ Bank Linked

Only request missing information.

This is where technology saves effort.

Stage 4 — Investment Configuration

Only configurable items appear.

Examples

Amount
Tenure (if editable)
Interest Payout
Auto Renewal
Maturity Instructions

Everything else remains visible in the summary panel.

Stage 5 — Nominee

Instead of

Add Nominee

Explain

Nominees help ensure your investment can be transferred smoothly if needed.

Would you like to add one?

If yes

Show nominee flow.

If no

Explain implications.

Stage 6 — Bank Account

If bank already exists

HDFC Bank

••••••9821

Verified

User taps Continue.

No unnecessary re-selection.

Stage 7 — Review

This becomes one of the most important screens.

Everything should be grouped.

Investment

↓

Investor

↓

Nominee

↓

Bank

↓

Returns

↓

Declarations

Every section editable.

Users should feel

"I've reviewed everything."

Stage 8 — Consent

Instead of

Checkbox
Checkbox
Checkbox

Explain

You're confirming that:

• Investment details are correct

• You've read key terms

• You authorize this investment

Simple.

Human.

Understandable.

Stage 9 — Payment

Users should always know

Payment Pending

↓

Payment Processing

↓

Payment Successful

Never

Spinner...

Spinner...

Spinner...

Stage 10 — Processing

Don't leave users wondering.

Show

Investment Received

↓

Verifying with Partner Bank

↓

Generating Certificate

↓

Almost Done

Progress builds confidence.

Stage 11 — Success

Not

Success!

Instead

Congratulations!

Your Fixed Deposit has been successfully booked.

Investment Summary

↓

Reference Number

↓

Certificate Timeline

↓

Portfolio Availability

↓

Next Steps

↓

Download Receipt

↓

Go to Portfolio

The investment journey ends with reassurance, not celebration.

This is finance.

Users seek confidence, not excitement.

Cross-Journey Experience

Regardless of the stage, users should always have access to:

Current investment summary

Progress indicator

Save & resume (where applicable)

Support

Help

Exit confirmation

Consistent navigation

Intelligent Assistance Throughout

The platform should continuously assist users.

Examples

Investment below minimum?

→ Explain why.

Missing nominee?

→ Explain implications.

Interest payout changes?

→ Show return difference instantly.

Information incomplete?

→ Highlight only affected fields.

Payment delayed?

→ Explain the current status and expected resolution.

The platform should behave like an investment assistant, not a form processor.

Journey Principles
Principle	Implementation
Context Awareness	Investment summary always accessible
Progressive Disclosure	Show information step by step
Trust	Clear status updates and transparent communication
Convenience	Reuse verified information and reduce manual input
Transparency	Explain calculations, validations, and next steps
Performance	Fast feedback with uninterrupted user flow
Recoverability	Preserve progress and support recovery from interruptions
Design Implications
Product Decisions
Introduce a Booking Introduction screen to set expectations.
Keep the investment summary visible throughout the journey.
Display only relevant inputs based on the user's current state.
Include a comprehensive Review & Confirmation stage.
Provide a multi-stage processing experience rather than a static loading indicator.
End with a confirmation experience that reinforces trust and explains what happens next.
UX Decisions
Replace long forms with a guided, step-by-step flow.
Use contextual explanations instead of separate help content.
Keep financial information visible without overwhelming the user.
Design every transition to reassure rather than surprise.
Engineering Decisions
Implement the journey as independent, reusable workflow capabilities.
Persist booking progress to support interruption recovery.
Separate workflow state from UI state for flexibility.
Support dynamic steps based on verification status and product rules.
Enable real-time updates during payment and booking processing.
Success Indicators

The Future State Journey is successful when users can:

Complete their investment confidently on the first attempt.
Understand every significant decision before confirming.
Experience minimal friction and minimal manual effort.
Trust the platform throughout the entire booking process.
Transition seamlessly from booking to portfolio ownership.
Document Outcome

This document defines the ideal end-to-end Booking experience for the FD Investment Platform. It transforms the product vision into a practical journey that balances user confidence, business objectives, regulatory requirements, and engineering scalability.

Unlike traditional banking workflows, this journey is intentionally designed as a guided investment experience—one that reduces cognitive load, explains decisions, builds trust continuously, and leverages technology to simplify rather than complicate the investment process.