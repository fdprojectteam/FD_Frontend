21 — Screen-by-Screen Functional Specification
Screen 9 — Failure / Pending
1. Screen Overview

Screen Name: Failure / Pending

Primary Capability: Booking Recovery

Business Domain: Transaction Recovery & Exception Management

Purpose

Handle all unsuccessful, delayed, or uncertain booking outcomes by clearly explaining the current status, preventing duplicate payments, and guiding users toward the appropriate recovery path.

This screen should never leave users guessing.

It should answer:

"What happened to my investment, and what should I do next?"

2. Business Objective

Provide a transparent and reassuring recovery experience that:

Explains the current transaction state.
Prevents duplicate payments.
Offers clear next steps.
Reduces support calls.
Preserves user trust.
3. Entry Conditions

User reaches this screen when:

Payment failed.
Payment was cancelled.
Payment status is pending.
Booking submission failed.
Partner bank processing is delayed.
System error occurred.
Network interruption prevented completion.
Payment verification is inconclusive.
4. Exit Conditions

Depending on the outcome:

Retry

↓

Return to Payment

Resume Booking

↓

Continue from last valid step

Pending Verification

↓

System continues monitoring

↓

Automatically redirect to Success once completed

Support Required

↓

Support Case Created

↓

User exits safely

5. Outcome Types

The screen dynamically adapts based on the booking state.

A. Payment Failed

Example:

Payment was not completed.

Reason (when available):

Insufficient funds
Bank declined transaction
Payment timed out
User cancelled authorization

Actions:

Retry Payment
Choose Another Payment Method
Contact Support
B. Payment Pending

Example:

We're confirming your payment.

Explanation:

We have received your payment request, but confirmation from the payment provider is still pending.

Important guidance:

Please do not make another payment. We'll update your booking automatically once confirmation is received.

Actions:

Refresh Status
View Booking Status
Notify Me
C. Booking Failed After Successful Payment

This is a critical scenario.

Example:

Your payment was successful, but we couldn't complete the Fixed Deposit booking.

Guidance:

Your payment is safe. We're working to complete your booking or process a refund according to our policies.

Actions:

Track Resolution
Contact Support
View Transaction Details
D. Partner Bank Delayed

Example:

The partner bank is taking longer than usual to confirm your investment.

Guidance:

No action is required from you.

Actions:

Track Progress
Notify Me
View FAQs
E. System Error

Example:

Something went wrong while processing your request.

Actions:

Retry
Resume Booking
Contact Support
6. UI Components
A. Dynamic Status Header

Examples:

🟢 Success (redirected automatically)

🟡 Pending

🔴 Failed

⚪ Cancelled

B. Status Explanation

Always explain:

What happened
Why it happened (if known)
Whether money was deducted
Whether the booking exists
Whether any action is required
C. Transaction Summary

Display:

Booking Reference
Transaction Reference
Partner Bank
Investment Amount
Payment Status
Booking Status
Last Updated
D. Recovery Actions

Dynamic CTAs based on state.

Examples:

Retry Payment
Refresh Status
Resume Booking
Contact Support
Return to Dashboard
Download Transaction Receipt
E. Help Section

Provide contextual assistance.

Examples:

Frequently Asked Questions
Support Contact
Expected Resolution Time
7. Data Requirements

Required:

Booking status
Payment status
Partner bank status
Transaction reference
Booking reference
Error classification
Recovery options

Derived:

Recovery path
User guidance
Expected resolution time
8. User Actions

Users can:

Retry payment.
Refresh status.
Resume booking.
Download transaction receipt.
Contact support.
Return to dashboard.
Enable notifications.
Copy booking reference.
9. Business Rules
Rule 1 — Never Guess Payment Status

If payment status is unknown:

Never instruct the user to pay again.

Display:

"We're still verifying your transaction."

Rule 2 — Prevent Duplicate Payment

If payment may have succeeded:

Disable Retry.

Wait until verification completes.

Rule 3 — Preserve Booking Progress

Users should never lose previously entered booking information.

Rule 4 — Auto Recovery

If backend processing eventually succeeds:

Automatically:

Update booking.
Notify user.
Redirect to Success when appropriate.
Rule 5 — Transparent Errors

Show user-friendly explanations.

Avoid:

Stack traces
Internal error codes
Technical exception messages
10. Intelligent Assistance
Smart Recovery Guidance

Instead of:

"Payment Failed"

Explain:

Your bank did not authorize this payment. No money has been deducted. You can safely try again.

Pending Intelligence

Example:

Banks sometimes take a few minutes to confirm transactions. We'll keep checking automatically.

Estimated Resolution

Display:

Expected resolution:

Usually within 5 minutes
Sometimes up to 30 minutes
Notification Option

Offer:

We'll notify you as soon as your booking status changes.

11. Validations

Verify:

Latest payment status.
Booking status.
Transaction ownership.
Duplicate payment prevention.
Recovery eligibility.
12. API Interactions
On Load

Retrieve:

Latest booking state
Payment state
Partner bank state
Recovery options
Refresh

Request latest transaction status.

Retry

Generate a new payment session when permitted.

Resume

Restore previous booking session.

13. State Transitions
Payment Failed
        │
        ├── Retry
        │      │
        │      ▼
        │   Payment
        │
        ▼
Cancelled

Pending flow

Pending
     │
     ├── Confirmed
     │       │
     │       ▼
     │    Success
     │
     └── Failed
             │
             ▼
         Recovery
14. Loading States

Display:

Status refresh
Transaction verification
Booking verification

Use informative messages instead of generic loaders.

15. Empty States

Example:

Unable to retrieve booking.

Display:

We couldn't retrieve your latest booking information.

Actions:

Retry
Contact Support
16. Error States

Examples:

Network unavailable
Backend unavailable
Payment gateway unavailable
Unknown transaction
Session expired

Recovery:

Retry
Resume
Support
17. Accessibility

Support:

Screen reader announcements for status changes.
Keyboard navigation.
Accessible error messaging.
High-contrast status indicators.
Focus management after refreshes.
WCAG-compliant color usage.
18. Analytics

Track:

Failure Screen Viewed.
Pending Screen Viewed.
Retry Initiated.
Resume Booking.
Refresh Status.
Support Contacted.
Notification Enabled.
Recovery Completed.

Exclude sensitive financial information from analytics payloads.

19. Performance Considerations
Refresh only the transaction status rather than reloading the entire page.
Use WebSockets or Server-Sent Events for pending transactions where supported.
Cache booking information while ensuring transaction status remains current.
Keep status updates lightweight to reduce network usage.
20. Security Considerations
Verify booking ownership before displaying transaction details.
Prevent unauthorized access to transaction status.
Ensure retry operations are protected against replay attacks.
Log all recovery actions for audit purposes.
Protect transaction identifiers during transmission and storage.
21. Acceptance Criteria
Functional
Correct recovery path displayed for each outcome.
Retry available only when appropriate.
Pending transactions continue monitoring.
Booking progress is preserved.
Support options are always available.
UX

Users clearly understand:

What happened.
Whether their money was deducted.
Whether the booking exists.
Whether they need to take any action.
What happens next.
Technical
Status updates are accurate.
Duplicate payment prevention works correctly.
Accessibility requirements pass.
Performance targets are achieved.
Security requirements are enforced.
🌍 Global Product Enhancements
1. Intelligent Recovery Engine

Instead of presenting the same error screen for every failure, classify failures into:

Payment Failure
Payment Pending
Booking Failure
Partner Bank Delay
Technical Failure

Each classification provides tailored guidance and recovery actions.

2. Real-Time Auto Recovery

If the system detects that a pending transaction has completed successfully while the user is viewing the screen, automatically transition to the Success screen with a brief notification instead of requiring manual refresh.

3. Persistent Booking Recovery

If the user closes the browser or mobile app during a pending state, reopening the platform should resume the booking from its latest known status rather than starting over.

4. Transparent Resolution Timeline

Display expected resolution milestones when a transaction is pending.

Payment Received ✓
        │
Waiting for Payment Confirmation ⏳
        │
Booking Submission ○
        │
FD Creation ○
        │
Investment Active ○

This provides visibility into the recovery process instead of leaving users with a generic loading state.

5. Proactive Notification Framework

When resolution is delayed, offer to notify the user through configured channels (such as in-app notifications, email, or SMS) once the booking reaches a final state, allowing them to safely leave the application.

Document Completion
Document 21 — Screen-by-Screen Functional Specification

✅ Screen 1 — Booking Overview
✅ Screen 2 — Investment Details
✅ Screen 3 — Nominee
✅ Screen 4 — Bank Account
✅ Screen 5 — Review & Confirm
✅ Screen 6 — Payment
✅ Screen 7 — Processing
✅ Screen 8 — Success
✅ Screen 9 — Failure / Pending

🎉 Document 21 — COMPLETE
📊 FD Booking Module Status

With Document 21 complete, the FD Booking module product analysis and functional specification are now complete. The module now includes:

✅ Product Strategy & Vision
✅ User Research & Personas
✅ User & Business Goals
✅ Current & Future State Journeys
✅ Information Architecture
✅ User Flows
✅ Business Rules
✅ Edge Cases
✅ State Machine
✅ Functional Requirements
✅ Quality Attribute Specification
✅ Screen Inventory & Navigation
✅ Partner Bank Configuration & Rules Engine
✅ Complete Screen-by-Screen Functional Specification (9 Screens)

This forms an enterprise-grade blueprint that is ready to move into engineering design. The next logical document is Document 23 — Component Inventory & Design Specification, where we'll define the reusable components that implement these screens consistently across the platform.