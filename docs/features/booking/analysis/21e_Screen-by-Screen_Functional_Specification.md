Screen 4 — Bank Account
1. Screen Overview

Screen Name: Bank Account

Primary Capability: Payment & Settlement

Business Domain: Bank Account Management

Purpose

Enable the user to select or add the bank account used for funding the FD investment and receiving maturity proceeds (subject to partner bank policies).

The experience should minimize manual entry while ensuring the account is valid, verified, and compliant with partner bank requirements.

The screen should answer:

"Which bank account will be used for this investment?"

2. Business Objective

Provide a secure and frictionless bank account selection experience by:

Reusing previously verified accounts.
Supporting new account addition only when required.
Enforcing partner bank policies through configuration.
Clearly communicating how the selected account will be used.
3. Entry Conditions

User has:

Completed Investment Details.
Completed Nominee (if required).

System has:

Active booking session.
Partner bank configuration.
Saved bank accounts (if any).
4. Exit Conditions

User:

Selects a valid bank account or
Successfully adds and verifies a new account.

↓

Booking session updated.

↓

Proceed to Review & Confirm.

5. UI Components
A. Information Banner

Explain the purpose.

Example:

"Your selected account will be used to fund this investment and, where permitted, receive maturity proceeds."

If partner bank policies differ, display contextual guidance.

B. Saved Bank Accounts

Display verified accounts as cards.

Each card includes:

Bank Name
Account Holder Name
Masked Account Number (e.g., XXXX1234)
Account Type (Savings / Current)
Verification Status
Default Account Badge

Actions:

Select
View Details
Edit (if allowed)
C. Add New Bank Account

Primary action when no suitable account exists.

Fields may include:

Account Holder Name
Account Number
Confirm Account Number
IFSC Code
Bank Name (auto-populated from IFSC where supported)
Account Type

The exact fields are determined by the Partner Bank Configuration & Product Rules Engine.

D. Verification Status

Clearly indicate verification progress.

Examples:

🟢 Verified
🟡 Verification Pending
🔴 Verification Failed

Display guidance for next steps where applicable.

E. Primary CTA

Save & Continue

F. Secondary CTA

Back

6. Data Requirements

Required:

Saved accounts.
Partner bank account policies.
Supported verification methods.

Derived:

Verification status.
Default account.
Eligible funding account.
7. User Actions

Users can:

Select an existing account.
Add a new account.
Edit eligible account details.
Retry verification.
Continue.
Navigate back.
8. Business Rules
Rule 1 — Reuse Verified Accounts

Previously verified accounts should be presented first to reduce friction.

Rule 2 — Partner Bank Policies

Configuration determines:

Whether funding and maturity accounts must be the same.
Whether multiple accounts are supported.
Whether account verification is mandatory.
Whether third-party accounts are allowed.
Rule 3 — Verification

If verification is required, progression is blocked until verification succeeds or an approved alternative process is completed.

Rule 4 — Account Ownership

Only accounts belonging to the authenticated investor are permitted unless the partner bank explicitly supports other ownership models.

Rule 5 — Mask Sensitive Data

Account numbers must always be masked in the UI, except during controlled entry where necessary.

9. Intelligent Assistance
Smart Account Reuse

Example:

"You've previously used this verified account for another investment. We recommend reusing it for a faster checkout."

IFSC Intelligence

After entering an IFSC code:

Auto-fill bank name.
Validate branch.
Detect invalid or inactive IFSC codes.
Duplicate Detection

If the entered account already exists:

"This bank account is already saved. Would you like to use it instead?"

Verification Guidance

If verification fails:

"Please check the account number and IFSC code, or choose another verified account."

Avoid exposing technical error messages.

10. Validations

Real-Time:

Required fields.
Account number format.
Confirm account match.
IFSC format.
Supported account type.

Server Validation:

Account ownership (where supported).
Verification status.
Partner bank compliance.
Duplicate account detection.
11. API Interactions
On Load

Retrieve:

Saved bank accounts.
Partner bank policies.
Verification requirements.
Add Account

Create a new bank account record.

Verify Account

Invoke the configured verification service (for example, penny drop verification or another approved verification mechanism supported by the partner bank).

Continue

Associate the selected account with the booking session.

12. State Transitions
Loading
    │
    ▼
Ready
    │
    ├── Select Existing
    │
    ├── Add New
    │
    ├── Verify
    │
    ▼
Verified
    │
    ▼
Continue

Error:

Verification Failed
        │
        ▼
Retry
13. Loading States

Display skeletons for:

Saved account cards.
Verification status.
Information banner.

Disable the primary action until mandatory information has loaded.

14. Empty States

Scenario:

No saved accounts.

Display:

"You haven't added a bank account yet."

CTA:

Add Bank Account

15. Error States

Examples:

Invalid IFSC.
Verification timeout.
Verification failed.
Network error.
Session expired.

Recovery:

Retry.
Choose another account.
Save progress where appropriate.
Re-authenticate if required.
16. Accessibility Requirements

Support:

Keyboard navigation.
Screen reader labels for masked account information.
Accessible error messaging.
Proper focus management after validation failures.
Accessible autocomplete suggestions for IFSC lookups (where provided).
Minimum touch target size of 44 × 44 px.
17. Analytics Events

Track:

Bank Account Screen Viewed.
Existing Account Selected.
New Account Added.
Account Verification Started.
Account Verification Succeeded.
Account Verification Failed.
Continue Clicked.
Booking Abandoned.

Analytics should never include full account numbers or other sensitive financial information.

18. Performance Considerations
Prefetch saved accounts when the booking session starts.
Cache verified account metadata during the session.
Debounce IFSC lookups to avoid unnecessary requests.
Keep verification feedback responsive with clear progress indicators.
19. Security Considerations
Encrypt account information in transit and at rest.
Mask account numbers throughout the interface.
Prevent unauthorized access to saved accounts.
Validate account ownership and verification server-side.
Maintain an audit trail for account additions and updates.
20. Acceptance Criteria
Functional
User can select an existing verified account.
User can add and verify a new account.
Partner bank policies are enforced.
Booking session stores the selected account.
UX

Users understand:

Why the account is required.
How it will be used.
Whether verification is complete.
What to do if verification fails.
Technical
Verification workflow functions correctly.
Loading, empty, and error states are implemented.
Accessibility checks pass.
Security requirements are enforced.
Performance targets from the Quality Attribute Specification are achieved.
🌍 Global Product Enhancements
1. Bank Account Vault

Treat bank accounts as reusable profile assets rather than booking-specific entries.

Benefits:

Faster repeat investments.
Reduced typing.
Consistent verification status.
Better user experience across all products.
2. Smart Default Selection

If the user has a previously verified and frequently used account, pre-select it while allowing easy changes.

3. Explain Verification

Instead of a generic "Verifying...", explain the purpose:

"We're verifying your account to help ensure your investment is credited to the correct account."

This increases transparency and trust.

4. Future-Ready Verification Framework

Design the verification process so different partner banks can plug in different verification methods through the Partner Bank Configuration & Product Rules Engine without redesigning the UI.