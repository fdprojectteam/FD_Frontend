Screen 7 — Processing
1. Screen Overview

Screen Name: Processing

Primary Capability: Booking Orchestration

Business Domain: Transaction Processing

Purpose

Provide real-time visibility into the post-payment journey while the platform verifies the payment, submits the booking to the partner bank, and awaits confirmation.

This screen should reassure users that their investment is actively being processed and clearly communicate what happens next.

The screen should answer:

"What is happening to my investment right now?"

2. Business Objective

Reduce uncertainty after payment by:

Displaying meaningful progress.
Preventing duplicate payments.
Providing clear expectations.
Automatically transitioning when processing completes.
Handling delays gracefully.
3. Entry Conditions

User has:

Successfully completed payment.

System has:

Payment confirmation (or pending confirmation where supported).
Active booking.
Booking orchestration workflow initiated.
4. Exit Conditions
Successful Processing

↓

Investment Created

↓

Success Screen

Processing Failed

↓

Failure Screen

Processing Delayed

↓

Pending Screen

5. UI Components
A. Processing Header

Display a reassuring message.

Example:

"We're setting up your Fixed Deposit."

Supporting text:

"This usually takes less than a minute. Please keep this page open while we complete your booking."

B. Progress Timeline

Instead of an indefinite spinner, present a transparent workflow.

Example:

✓ Payment Received

✓ Payment Verified

⏳ Submitting to Partner Bank

○ Creating Fixed Deposit

○ Generating Certificate

○ Updating Portfolio

Each completed step should update in real time.

C. Current Status Card

Displays:

Booking Reference
Partner Bank
Transaction Reference
Current Step
Estimated Completion Time
D. Important Guidance

Examples:

Do not refresh the page unless instructed.
You will receive a notification once processing is complete.
If processing takes longer than expected, your investment is not necessarily at risk.
E. Support Panel

Provide:

Contact Support
Frequently Asked Questions
Booking Reference (copyable)
6. Data Requirements

Required:

Booking reference.
Transaction reference.
Payment status.
Processing workflow status.
Partner bank response.
Estimated completion time.

Derived:

Current processing stage.
Completion percentage.
User-facing status message.
7. User Actions

Users can:

View progress.
Copy booking reference.
Contact support.
Leave the page (if background processing is supported).
View FAQs.

No user action is required to continue.

8. Business Rules
Rule 1 — Automatic Progress

Progress updates should reflect actual backend events whenever possible, not arbitrary timers.

Rule 2 — Prevent Duplicate Submission

Booking submission must be idempotent.

Refreshing or reopening the page must not create another booking.

Rule 3 — Background Continuation

If the user closes the application:

Processing continues.
Progress can be resumed when they return.
Notifications are sent when available.
Rule 4 — Timeout Handling

If processing exceeds the expected duration:

Transition to the Pending state with an explanation rather than leaving the user on an endless loading screen.

9. Intelligent Assistance
Dynamic Status Messages

Instead of generic messages like "Loading...", provide meaningful updates.

Examples:

"We're confirming your payment."
"Your booking has been sent to the partner bank."
"The partner bank is creating your Fixed Deposit."
"We're generating your FD certificate."
Estimated Time

Display:

Estimated completion: Less than 1 minute

If processing exceeds expectations:

"This is taking longer than usual. We're still working on it."

Proactive Notifications

Offer:

"We'll notify you when your investment is ready."

Where platform notifications are supported.

10. Validations

Backend checks include:

Payment confirmation.
Booking ownership.
Duplicate prevention.
Partner bank acknowledgment.
Booking state integrity.

No manual validation is required from the user.

11. API Interactions
On Load

Retrieve:

Current booking status.
Processing stage.
Estimated completion.
Status Updates

Receive updates through:

WebSockets (preferred), or
Server-Sent Events (SSE), or
Intelligent polling with exponential backoff.
Completion

Automatically navigate to:

Success.
Pending.
Failure.

based on the final processing outcome.

12. State Transitions
Payment Complete
        │
        ▼
Processing Started
        │
        ├── Payment Verified
        │
        ├── Booking Submitted
        │
        ├── FD Created
        │
        ├── Certificate Generated
        │
        ▼
Success

Alternate paths:

Processing
     │
     ├── Delayed ───▶ Pending
     │
     └── Failed ────▶ Failure
13. Loading States

Avoid generic spinners.

Instead, show:

Active timeline.
Skeletons for pending information.
Animated progress indicators tied to real processing states.
14. Empty States

Generally not applicable.

If processing information cannot be retrieved:

Display:

"We're unable to retrieve the latest status. We're attempting to reconnect."

15. Error States

Examples:

Lost connection.
Status unavailable.
Backend timeout.
Partner bank temporarily unavailable.

Recovery:

Automatic retry.
Background continuation.
Transition to Pending if the final state cannot yet be determined.
16. Accessibility

Support:

Screen reader announcements for progress updates.
Keyboard-accessible support actions.
High-contrast status indicators.
Progress conveyed through text as well as visuals.
Reduced-motion alternatives for animated indicators.
17. Analytics

Track:

Processing Screen Viewed.
Processing Started.
Stage Changed.
Processing Completed.
Processing Delayed.
Processing Failed.
User Left During Processing.
Support Accessed.

Do not include sensitive payment information in analytics events.

18. Performance Considerations
Prefer WebSockets or SSE over frequent polling for live updates.
Cache workflow state to support page refresh recovery.
Minimize network usage through event-driven updates.
Ensure smooth UI transitions without unnecessary re-renders.
19. Security Considerations
Validate booking ownership before exposing status.
Authenticate all status update channels.
Prevent unauthorized access to booking progress.
Maintain an immutable audit trail of workflow events.
20. Acceptance Criteria
Functional
Processing reflects real backend workflow.
Progress updates automatically.
Duplicate booking submission is prevented.
Users are redirected to the correct final state.
UX

Users always understand:

What stage the booking is in.
Approximately how long it will take.
What happens next.
What to do if processing is delayed.
Technical
Event-driven status updates are supported.
Recovery from page refresh is implemented.
Accessibility requirements pass.
Performance targets are met.
Processing remains reliable under retry scenarios.
🌍 Global Product Enhancements
1. Real Workflow Visualization

Instead of showing a percentage (which can be misleading), visualize the actual workflow:

✓ Payment Confirmed

✓ Booking Submitted

⏳ Bank Verification

○ FD Creation

○ Certificate Generation

○ Portfolio Sync

This is more transparent and trustworthy.

2. Resume Anywhere

If the user leaves the application and returns later, they should be brought back to the current processing stage rather than restarting the journey.

3. Cross-Device Continuity

If a user begins on one device and later opens the platform on another while processing is ongoing, they should see the same real-time booking status.

4. Intelligent Delay Handling

If the partner bank is slower than expected, don't simply display "Processing...".

Instead, explain:

"Your payment has been confirmed. We're waiting for the partner bank to complete the FD creation. No further action is required from you."

This reassures users and significantly reduces duplicate payments and support contacts.