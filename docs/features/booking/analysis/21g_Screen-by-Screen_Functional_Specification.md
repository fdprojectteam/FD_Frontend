Screen 6 — Payment
1. Screen Overview

Screen Name: Payment

Primary Capability: Payment Processing

Business Domain: Transaction Management

Purpose

Facilitate the secure transfer of funds from the investor to the partner bank (or designated settlement account) to complete the Fixed Deposit booking.

The platform should provide a seamless, transparent, and reliable payment experience while minimizing user anxiety and maximizing payment success.

This screen should answer one question:

"Can I safely complete my investment now?"

2. Business Objective

Enable users to successfully fund their investment while providing complete visibility into the transaction process.

The payment experience should:

Be secure.
Be transparent.
Minimize failed payments.
Prevent duplicate transactions.
Support multiple payment methods (based on partner bank capabilities).
Clearly communicate payment status.
3. Entry Conditions

User has:

Completed Review & Confirm.
Booking session has been locked.
Passed final validation.

System has:

Payment Order.
Booking Reference.
Partner Bank Configuration.
Payment Configuration.
4. Exit Conditions

Successful Payment

↓

Booking Submitted

↓

Processing Screen

Failed Payment

↓

Failure / Retry Screen

Cancelled Payment

↓

Return to Payment

Expired Session

↓

Booking Expired

5. UI Components
A. Payment Summary

Always visible.

Displays:

Partner Bank
Product Name
Investment Amount
Processing Fee (if applicable)
Total Payable
Booking Reference

Purpose:

Allows users to verify the payment before authorizing it.

B. Payment Methods

Display only methods supported by the selected partner bank.

Examples:

UPI
Net Banking
Debit Card (if supported)
Bank Transfer (if supported)

Unavailable methods should not appear.

C. Secure Payment Indicator

Display trust signals such as:

Encrypted Transaction
Secure Payment
RBI-compliant payment partner (where applicable)
PCI DSS-compliant payment processor (if applicable)

These should be factual and reflect the actual payment infrastructure.

D. Payment Status Area

Displays real-time transaction state.

Examples:

Initializing Payment
Redirecting to Bank
Awaiting Authorization
Payment Successful
Payment Failed
Payment Cancelled
E. Help & Support

Provide contextual guidance:

"Do not close this window while your payment is being processed."

Include:

Contact Support
FAQ
Transaction Help
F. Primary CTA

Pay ₹X,XX,XXX

G. Secondary CTA

Cancel Payment

If cancellation is allowed by business rules.

6. Data Requirements

Required:

Booking Reference
Payment Order
Payment Amount
Partner Bank Rules
Supported Payment Methods

Derived:

Total Payable
Payment Status
Transaction Reference
Estimated Processing Time
7. User Actions

Users can:

Select Payment Method
Initiate Payment
Retry (where appropriate)
Cancel (if permitted)
Contact Support
8. Business Rules
Rule 1 — Payment Amount

Must exactly match the confirmed booking amount.

No client-side modification is permitted.

Rule 2 — Payment Method

Display only supported methods based on:

Partner Bank Configuration
Payment Gateway Configuration
Regulatory restrictions
Rule 3 — Duplicate Protection

Prevent duplicate payment attempts using an idempotency key.

Repeated clicks on the payment button must not create multiple transactions.

Rule 4 — Payment Session Timeout

If the payment session expires:

Notify the user.
Allow regeneration of a payment session if permitted.
Preserve booking data where possible.
Rule 5 — Payment Confirmation

A booking is considered funded only after successful confirmation from the payment processor and any required downstream verification.

9. Intelligent Assistance
Payment Readiness

Display:

🟢 Ready to Pay

or

🟡 Action Required

Examples:

Payment session expired.
Selected method unavailable.
Network issue detected.
Contextual Guidance

If using UPI:

"Keep your UPI application ready. You'll be redirected for authorization."

If using Net Banking:

"You'll be redirected to your bank's secure login page."

Timeout Warning

If the payment window is close to expiring:

"Your payment session expires in 2 minutes. Complete the payment to avoid restarting the process."

Recovery Guidance

If payment status is uncertain:

"Please wait while we verify the transaction. Do not make another payment unless instructed."

10. Validations

Before Payment:

Booking locked.
Amount verified.
Product availability confirmed.
Payment session active.

Server Validation:

Booking ownership.
Payment order validity.
Partner bank eligibility.
Session integrity.
11. API Interactions
On Load

Retrieve:

Payment order.
Supported payment methods.
Session expiry.
Gateway configuration.
Initiate Payment

Create or initialize the payment session with the configured payment service.

Payment Callback

Receive asynchronous payment status updates.

Payment Verification

Verify transaction status before proceeding.

12. State Transitions
Loading
    │
    ▼
Ready
    │
    ▼
Payment Initiated
    │
    ▼
Redirected
    │
    ▼
Awaiting Confirmation
    │
    ├── Success ─────▶ Processing
    │
    ├── Failed ──────▶ Failure
    │
    └── Cancelled ───▶ Payment
13. Loading States

Show progress for:

Payment initialization.
Gateway loading.
Payment verification.
Transaction confirmation.

Disable repeated payment attempts while processing.

14. Empty States

Possible:

No supported payment methods.
Payment service unavailable.
Payment session missing.

Recovery:

Retry initialization.
Contact support.
Return to previous step.
15. Error States

Examples:

Gateway unavailable.
Payment timeout.
User cancelled payment.
Transaction declined.
Unknown payment status.

Recovery:

Retry when appropriate.
Continue verification for pending transactions.
Never advise users to immediately make another payment if the transaction status is uncertain.
16. Accessibility

Support:

Full keyboard navigation.
Screen reader announcements for payment status updates.
Accessible loading indicators.
Focus management during redirects.
Clear, non-color-dependent status indicators.
17. Analytics

Track:

Payment Screen Viewed.
Payment Method Selected.
Payment Started.
Payment Completed.
Payment Failed.
Payment Cancelled.
Payment Timed Out.
Payment Retried.

Do not record payment credentials or other sensitive financial information.

18. Performance
Payment screen loads in under 2 seconds on a standard connection.
Payment configuration is prefetched after Review & Confirm.
Gateway initialization is optimized to reduce waiting time.
Status polling or event handling should avoid excessive network traffic.
19. Security
Use TLS for all communication.
Validate all payment requests server-side.
Protect against replay and duplicate requests.
Never expose payment secrets or tokens to the client.
Maintain comprehensive audit logs.
Ensure payment callbacks are authenticated and verified.
20. Acceptance Criteria
Functional
User can select a supported payment method.
Payment order is generated correctly.
Payment status is accurately reflected.
Successful payments proceed to Processing.
Failed or cancelled payments follow the correct recovery path.
UX

Users always understand:

What they are paying.
Which payment methods are available.
Whether the payment is still processing.
What to do if something goes wrong.
Technical
Duplicate payment prevention is implemented.
Payment verification is reliable.
Accessibility requirements pass.
Performance targets are met.
Security controls comply with platform standards.
🌍 Global Product Enhancements
1. Live Payment Timeline

Replace generic spinners with meaningful progress:

Booking Locked        ✓

Payment Started       ✓

Waiting for Bank      ⏳

Payment Verified      ○

FD Submission         ○

This gives users confidence that progress is being made.

2. Smart Pending Detection

If payment confirmation is delayed:

"We've received your payment request and are verifying it with our payment partner. Please don't make another payment. We'll update this screen automatically."

This helps prevent duplicate payments and reduces support requests.

3. Transaction Reference Visibility

Always display a booking reference and payment reference (when available) so users have identifiers to share with support if needed.

4. Dynamic Payment Methods

The available payment methods should be driven entirely by the Partner Bank Configuration & Product Rules Engine, allowing different banks or payment partners to enable or disable methods without requiring frontend changes.