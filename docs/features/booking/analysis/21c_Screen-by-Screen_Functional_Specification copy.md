Screen 3 — Nominee
1. Screen Overview

Screen Name: Nominee

Primary Capability: Investor

Business Domain: Beneficiary Management

Purpose

Allow the investor to nominate one or more beneficiaries who will receive the Fixed Deposit proceeds in the event of the investor's death, as required by applicable bank policies and regulations.

The objective is not simply to collect nominee information, but to ensure the investment remains protected and legally actionable.

This screen should answer one question:

"Who should receive this investment if something happens to me?"

2. Business Objective

Provide a simple, trustworthy, and legally compliant nominee selection experience.

The platform should:

Encourage nomination without forcing unnecessary complexity.
Minimize repeated data entry.
Reuse previously saved nominee information.
Clearly explain why nominee information is requested.
Support bank-specific nominee requirements.
3. Entry Conditions

User has:

Completed Investment Details.
Active booking session exists.

System has:

User profile.
Previously saved nominees (if any).
Partner bank nominee rules.
4. Exit Conditions

User:

Selects an existing nominee or
Creates a new nominee.

↓

Nominee validation succeeds.

↓

Continue

↓

Bank Account Screen.

5. UI Components
A. Why Nominee?

A compact informational section.

Example:

"Adding a nominee ensures your investment can be transferred smoothly to your chosen beneficiary according to applicable regulations."

Include a Learn More link for users who want additional details.

B. Saved Nominees

If available:

Display as cards.

Each card contains:

Full Name
Relationship
Age (optional)
Default Nominee Badge
Edit
Select

Example:

👤 Arun Kumar
Brother

✓ Default Nominee
C. Add New Nominee

Primary CTA.

Opens nominee form.

D. Nominee Form

Fields:

Personal Information
Full Name
Date of Birth
Gender (if required by partner bank)
Relationship
Contact Information

Optional depending on regulations:

Mobile Number
Email
Address

If required.

Otherwise inherit investor address where regulations allow.

Guardian Information

Shown only when:

Nominee is minor.

Fields:

Guardian Name
Relationship
Contact

Dynamic display only when applicable.

E. Nomination Percentage

Future-ready.

Example:

Arun

100%

When multiple nominees become supported:

Arun

60%

Lakshmi

40%

System validates total equals 100%.

F. Primary CTA

Save & Continue

G. Secondary CTA

Back

6. Data Requirements

Required

Nominee Rules
Existing Nominees
Supported Relationships

Derived

Minor Status
Guardian Requirement
Percentage Validation
7. User Actions

User can:

Select Saved Nominee
Add New Nominee
Edit Nominee
Delete Draft Nominee
Continue
Back
8. Business Rules
Rule 1

Every investment must satisfy the partner bank's nominee policy.

If nomination is optional, users may choose to skip.

If mandatory, continuation is blocked until requirements are met.

Rule 2

Minor nominee requires guardian information.

Rule 3

Relationship must be from supported values.

Rule 4

Duplicate nominee records should be detected and users prompted to reuse an existing nominee instead of creating another.

Rule 5

Previously verified nominee information should be reused where possible to reduce friction.

9. Intelligent Assistance

Move beyond simple forms.

Smart Suggestions

Example:

"You've previously nominated Arun Kumar for another investment. Would you like to use the same nominee?"

Duplicate Detection

Instead of allowing duplicate entries:

"A nominee with similar details already exists. Review before creating a new one."

Missing Guardian

If nominee is under the required age:

Automatically reveal guardian fields with an explanation.

Nominee Reminder

If nomination is optional:

Show a gentle reminder:

"Adding a nominee helps ensure a smoother claim process for your family."

10. Validations

Real-Time

Required fields.
Valid name.
Supported relationship.
Valid date of birth.
Guardian required when applicable.
Nomination percentage totals 100% (future).

Server Validation

Before Continue:

Partner bank rules.
Duplicate nominee verification.
Regulatory compliance.
11. API Interactions
On Load

Retrieve:

Saved nominees.
Relationship list.
Partner bank nominee policy.
Save Nominee

Create or update nominee.

Continue

Associate selected nominee with the booking session.

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
    ├── Edit
    │
    ▼
Validation
    │
    ▼
Saved
    │
    ▼
Continue
13. Loading States

Skeleton:

Nominee cards.
Form fields.
Relationship dropdown.

Buttons remain disabled while critical data loads.

14. Empty States

Scenario:

No saved nominees.

Display:

"You haven't added any nominees yet."

CTA:

Add Nominee

15. Error States

Examples:

Failed to save nominee.
Validation failed.
Relationship unavailable.
Session expired.

Recovery:

Retry.
Save draft locally (where appropriate).
Resume after re-authentication.
16. Accessibility

Support:

Full keyboard navigation.
Screen reader labels for all form fields.
Error messages announced automatically.
Proper field grouping.
Focus management after validation errors.
Accessible date picker.
Minimum touch targets on mobile.
17. Analytics

Track:

Nominee Screen Viewed
Existing Nominee Selected
New Nominee Added
Nominee Edited
Nominee Reused
Guardian Information Added
Continue Clicked
Booking Abandoned

Do not log personally identifiable information (PII) such as names, contact details, or dates of birth.

18. Performance
Prefetch saved nominees when the booking session starts.
Lazy-load non-critical informational content.
Optimize form validation to avoid unnecessary re-renders.
Cache relationship lists during the session.
19. Security

Sensitive nominee information must:

Be encrypted in transit.
Be encrypted at rest.
Be masked where appropriate.
Be editable only by the authenticated investor.

Server validates:

Booking ownership.
Nominee ownership.
Authorization before updates.
20. Acceptance Criteria
Functional

✅ User can select an existing nominee.

✅ User can create a new nominee.

✅ Minor nominee automatically requires guardian details.

✅ Partner bank rules are enforced.

✅ Selected nominee is linked to the booking.

UX

The user understands:

Why nominee information is important.
Whether a nominee is mandatory.
That existing nominee information can be reused.
How to correct validation issues without frustration.
Technical
Real-time validation works consistently.
Loading, empty, and error states are implemented.
Accessibility requirements pass testing.
Analytics events are emitted correctly.
Performance targets from the Quality Attribute Specification are achieved.
🌍 Global Product Enhancements

To make this a world-class technology product rather than just another banking form, I recommend these enhancements.

1. Smart Nominee Vault

Instead of asking users to repeatedly enter nominee details across investments, maintain a secure Nominee Vault within their profile.

Benefits:

One-time setup.
Reusable across all future investments.
Consistent information.
Reduced booking time.
2. Relationship Guidance

When a user selects a relationship, provide contextual information where relevant.

Example:

"Some partner banks may require additional verification for non-family nominees."

This sets expectations without blocking the user.

3. Nominee Completeness Indicator

Display a simple status:

🟢 Ready for Investment

or

🟡 Additional Information Required

This gives users confidence before continuing.

4. Future-Ready Multiple Nominees

Even if the initial release supports only one nominee, design the UI and data model so multiple nominees can be enabled later without redesigning the flow.