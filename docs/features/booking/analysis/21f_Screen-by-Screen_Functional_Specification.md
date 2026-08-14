Screen 5 — Review & Confirm
1. Screen Overview

Screen Name: Review & Confirm

Primary Capability: Booking

Business Domain: Investment Confirmation

Purpose

Provide the investor with a complete, transparent, and accurate summary of the investment before initiating payment.

This screen acts as the final checkpoint where users verify every important detail and explicitly confirm their intent to proceed.

Unlike a traditional confirmation page, this screen should build confidence by answering the user's remaining questions and eliminating uncertainty.

2. Business Objective

Enable users to make an informed and confident investment decision by presenting all relevant information in a structured, easy-to-review format.

The platform should:

Consolidate all booking information.
Highlight any important declarations.
Explain what happens after confirmation.
Prevent accidental or uninformed submissions.
Allow quick corrections without restarting the booking.
3. Entry Conditions

User has successfully completed:

Investment Details
Nominee (if applicable)
Bank Account

System has:

Active booking session.
Latest product information.
Current interest calculation.
Partner bank validation status.
4. Exit Conditions

User:

Reviews all information.
Accepts required declarations.
Clicks Confirm & Proceed to Payment.

↓

Booking session is locked for payment.

↓

Navigate to Payment.

5. UI Components
A. Investment Summary

Displays:

Partner Bank
Product Name
Investment Amount
Interest Rate
Tenure
Interest Payout Option
Estimated Interest
Estimated Maturity Amount
Maturity Date

Actions:

Edit Investment
B. Nominee Summary

Displays:

Nominee Name
Relationship
Guardian (if applicable)

Actions:

Edit Nominee
C. Bank Account Summary

Displays:

Funding Account
Masked Account Number
Bank Name
Verification Status

Actions:

Change Account
D. Important Information

Clearly present information that may affect the investment.

Examples:

Premature withdrawal conditions.
Interest payment schedule.
Tax implications (summary).
Deposit insurance information (where applicable).
Partner bank-specific notices.

Use expandable sections to avoid overwhelming the user.

E. What Happens Next?

Provide a simple timeline.

Review Completed
        ↓
Payment
        ↓
Partner Bank Confirmation
        ↓
FD Created
        ↓
Certificate Issued
        ↓
Portfolio Updated

This reduces uncertainty about the next steps.

F. Consent & Declarations

Examples:

☐ I confirm that the information provided is accurate.

☐ I have read and agree to the Terms & Conditions.

☐ I understand the product information and associated policies.

Only declarations required by regulation or partner banks should be mandatory.

G. Primary CTA

Confirm & Proceed to Payment

H. Secondary CTA

Back

6. Data Requirements

Required:

Booking session.
Investment details.
Nominee details.
Bank account.
Partner bank notices.
Current calculations.

Derived:

Final maturity value.
Booking completeness.
Outstanding validation status.
7. User Actions

Users can:

Review all information.
Expand important information.
Edit investment.
Edit nominee.
Change bank account.
Accept declarations.
Continue.
Navigate back.
8. Business Rules
Rule 1 — Final Validation

Before allowing payment:

Product availability.
Interest rate.
Investment amount.
Bank policies.
Account verification.
Nominee requirements.

must all be revalidated.

Rule 2 — Data Freshness

If product information changes while the user is reviewing:

Example:

"The interest rate for this FD has changed from 6.90% to 6.80%. Please review the updated investment summary before proceeding."

Require explicit acknowledgement before continuing.

Rule 3 — Mandatory Declarations

Users cannot proceed until all required declarations are accepted.

Rule 4 — Editable Sections

Users should be able to return to earlier steps without losing previously entered information.

9. Intelligent Assistance
Completeness Indicator

Display:

🟢 Booking Ready

or

🟡 1 item requires your attention

This provides immediate clarity.

Change Summary

If users modified their investment after starting the booking, summarize the differences.

Example:

Your investment amount increased from ₹2,00,000 to ₹3,00,000.

Your estimated maturity amount increased by ₹74,300.

Policy Highlights

Instead of showing long legal text, present concise summaries.

Example:

Early withdrawal may reduce your applicable interest.

Allow users to expand for full details.

Next Step Guidance

Example:

After payment, we'll securely submit your booking to the partner bank. You'll receive confirmation once the bank processes your investment.

10. Validations

Real-Time:

Mandatory declarations accepted.
Booking completeness.
Required information present.

Server Validation:

Immediately before payment:

Product still available.
Interest rate unchanged (or updated and acknowledged).
Booking session active.
Account verified.
Nominee valid.
Partner bank rules satisfied.
11. API Interactions
On Load

Retrieve:

Latest booking summary.
Current product details.
Updated calculations.
Partner bank notices.
On Confirm
Lock booking session.
Perform final validation.
Generate payment request.
Transition booking to Payment Pending state.
12. State Transitions
Loading
    │
    ▼
Ready
    │
    ├── Edit Section
    │
    ├── Accept Declarations
    │
    ▼
Validation
    │
    ▼
Booking Locked
    │
    ▼
Payment
13. Loading States

Skeleton placeholders for:

Investment summary.
Nominee.
Bank account.
Important information.

Disable the primary CTA until validation completes.

14. Empty States

Possible:

Booking session expired.
Product unavailable.
Required section missing.

Recovery:

Resume booking.
Return to previous step.
Restart booking if necessary.
15. Error States

Examples:

Validation failed.
Product updated.
Interest changed.
Booking expired.
Network interruption.

Recovery:

Retry validation.
Refresh booking summary.
Guide the user back to the affected section when correction is needed.
16. Accessibility Requirements

Support:

Logical heading hierarchy.
Keyboard navigation.
Screen reader announcements for updated investment values.
Focus on validation or policy changes.
Accessible expandable sections.
High-contrast support.
Minimum touch target size of 44 × 44 px.
17. Analytics Events

Track:

Review Screen Viewed.
Investment Edited.
Nominee Edited.
Bank Account Changed.
Policy Expanded.
Declaration Accepted.
Confirm Clicked.
Validation Failed.
Booking Abandoned.

No personally identifiable information (PII) or sensitive financial details should be included in analytics payloads.

18. Performance Considerations
Prefetch the payment configuration while the user reviews the summary.
Perform a single consolidated validation request before payment rather than multiple sequential calls.
Cache booking summary data for the current session while ensuring critical values (such as interest rate and product availability) are refreshed before confirmation.
19. Security Considerations
Revalidate all critical booking information server-side.
Protect against duplicate confirmation requests (idempotency).
Ensure booking ownership is verified.
Record an audit trail for the final confirmation action.
Never rely solely on client-side calculations or validation.
20. Acceptance Criteria
Functional
User can review every section of the booking.
Users can edit previous sections without losing progress.
Required declarations are enforced.
Final validation succeeds before payment.
Booking transitions correctly to the payment stage.
UX

Users clearly understand:

What they are investing in.
How much they are investing.
Expected returns.
What happens after payment.
The key terms they are accepting.
Technical
Final validation is performed server-side.
Loading, error, and empty states are implemented.
Accessibility requirements pass verification.
Performance targets are achieved.
Duplicate confirmation requests are prevented.
🌍 Global Product Enhancements
1. Investment Confidence Score

Instead of showing only a summary, display a contextual status such as:

🟢 Ready to Invest
🟡 Review Required

Accompany it with specific reasons (for example, "Interest rate updated" or "Nominee information incomplete") rather than a generic score.

2. Timeline Transparency

Always show users exactly what happens after confirmation:

Payment
    ↓
Partner Bank Processing
    ↓
FD Created
    ↓
Certificate Issued
    ↓
Portfolio Updated

This reduces uncertainty and support requests.

3. Smart Change Detection

If any investment detail has changed during the booking journey, visually highlight only those fields so users don't need to re-read the entire summary.

4. Plain-Language Policy Summaries

Replace lengthy legal text with concise explanations and provide access to the full terms only when users choose to read them.