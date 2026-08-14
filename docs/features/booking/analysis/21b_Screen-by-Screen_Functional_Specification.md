Screen 2 — Investment Details
1. Screen Overview

Screen Name: Investment Details

Primary Capability: Booking

Business Domain: Investment Configuration

Purpose

Allow users to configure and verify the investment details before proceeding to personal information.

This is the only screen where users make investment-related decisions.

The screen should immediately answer:

"Am I investing the right amount, for the right tenure, with the right payout option?"

2. Business Objective

Help users confidently finalize their investment configuration by providing:

Transparent calculations
Real-time feedback
Intelligent guidance
Validation before continuing

The platform should guide, not merely collect inputs.

3. Entry Conditions

User has:

Selected an FD Product
Started Booking

System has:

Current Product Information
Interest Rate
Available Tenure Options
Investment Constraints
4. Exit Conditions

User successfully configures:

Investment Amount
Tenure
Interest Payout Option

↓

Continue

↓

Nominee Screen

5. UI Components
A. Product Summary (Sticky)

Always visible.

Displays:

Bank Logo
Bank Name
Product Name
Interest Rate
Rating
DICGC Protection
Investment Type

Purpose:

Keeps investment context visible.

B. Investment Amount

Primary input.

Features:

Currency Formatting
Numeric Keyboard (Mobile)
Quick Amount Chips

Examples

₹50K

₹1L

₹2L

₹5L

₹10L

Users may also enter custom values.

C. Tenure Selection

Depending on the product:

Dropdown
Cards
Radio Buttons

Displays

Days
Months
Years

Example

1 Year

2 Years

3 Years

5 Years
D. Interest Payout Option

Display available options.

Examples

Cumulative
Monthly
Quarterly
Half-Yearly
Annual

Unavailable options should not be displayed.

E. Live Return Calculator

One of the most important components.

Shows:

Investment Amount

↓

Interest Earned

↓

Tax Information (if applicable)

↓

Maturity Amount

↓

Maturity Date

Updates instantly after any investment change.

F. Investment Insights

Instead of only calculations, provide useful guidance.

Examples:

✅ Higher returns than a 1-year FD.

✅ Monthly payout available.

✅ Locking funds for one additional year increases returns by ₹8,200.

✅ This tenure offers the highest interest rate.

This transforms the platform from a marketplace into an investment assistant.

G. Important Information

Examples

Premature withdrawal rules
Interest payout explanation
TDS information
Senior citizen benefits (if applicable)

Collapsed by default.

H. CTA

Primary

Continue

Secondary

Back

6. Data Requirements

Required

Product
Investment Constraints
Available Tenures
Interest Rate
Payout Options

Derived

Estimated Interest
Maturity Amount
Maturity Date
Effective Annual Yield
7. User Actions

Users can:

Change Investment Amount
Select Tenure
Change Interest Payout
Expand Calculator
Expand Important Information
Continue
Go Back
8. Business Rules
Investment Amount

Must satisfy:

Minimum Investment

Maximum Investment

Increment Rules (if applicable)

Tenure

Must belong to product-supported tenures.

Interest Option

Must exist for selected product.

Calculator

Every modification should immediately refresh:

Interest
Maturity
Investment Summary

No page refresh.

9. Intelligent Assistance

This is where we differentiate from competitors.

Instead of passive validation, the platform proactively assists users.

Examples:

Suggest Better Tenure

Current

₹5,00,000

1 Year

Suggestion

Investing for 2 years increases your estimated return by ₹18,400.

Minimum Investment

Current

₹8,000

Minimum

₹10,000

Instead of

❌ Invalid Amount

Show

Increase your investment by ₹2,000 to qualify for this FD.

Near Better Rate

Example

2 Years

6.85%
3 Years

7.10%

Suggestion

Investing for one more year unlocks a higher interest rate.

Large Investment

If

₹25 Lakhs

Show

Consider diversifying across multiple banks to maximize deposit insurance coverage.

(Informational only, never financial advice.)

10. Validations

Real-Time

Investment Amount

Required

Minimum

Maximum

Increment

Supported Tenure

Supported Interest Option

Server Validation

Before Continue

Reconfirm

Interest Rate
Product Availability
Product Status
11. API Interactions

On Load

Retrieve

Product Configuration
Available Tenures
Interest Options

On Every Change

Retrieve or calculate:

Estimated Interest
Maturity Amount

Continue

Update Booking Session

12. State Transitions
Loading

↓

Ready

↓

Editing

↓

Recalculating

↓

Ready

↓

Continue

↓

Nominee

Error

↓

Retry

13. Loading States

Skeleton

Investment Card

Calculator

Tenure Options

Buttons remain disabled until calculations complete.

14. Empty States

Possible

No available tenure.

No payout option.

Product discontinued.

Recovery

Return Marketplace.

15. Error States

Examples

Network Failure

↓

Retry

Calculation Failed

↓

Retry

Product Updated

↓

Refresh Configuration

Interest Changed

↓

Notify User

↓

Require Confirmation

16. Accessibility

Support

Keyboard Navigation

Logical Tab Order

ARIA Labels

Screen Reader Updates

Accessible Error Messages

Focus Restoration

High Contrast

Reduced Motion

17. Analytics

Track

Investment Amount Changed

Tenure Selected

Interest Option Changed

Calculator Viewed

Investment Insight Viewed

Continue Clicked

Validation Failed

Booking Abandoned

Only behavioral events should be tracked. Sensitive financial information should be minimized or anonymized according to your analytics policy.

18. Performance

Investment recalculation

Target

<100ms perceived update

Avoid:

Multiple API calls for every keystroke.

Prefer:

Debounced requests where server calculations are required, or client-side calculation for non-authoritative previews with server validation before proceeding.

19. Security

Never trust

Client calculations.

Server always recalculates before confirmation.

Validate

Product

Interest

Investment

Tenure

Server-side.

Prevent manipulation of hidden values.

20. Acceptance Criteria
Functional

✅ Investment amount can be edited.

✅ Tenure updates calculations.

✅ Interest option updates maturity information.

✅ Intelligent suggestions appear only when relevant.

✅ Continue updates the booking session.

UX

Users immediately understand:

Expected returns
Maturity amount
Investment duration
Effect of changing investment parameters

The platform should reduce uncertainty rather than simply presenting numbers.

Technical
Live calculations remain responsive.
State updates do not trigger unnecessary re-renders.
API failures are recoverable.
Accessibility checks pass.
Performance targets from the Quality Attribute Specification are met.
💡 Product Enhancement Recommendations

Since we're building a global technology product, I recommend enriching this screen with features that make it feel like an investment assistant rather than a form.

1. Investment Health Indicator

Provide a simple visual summary such as:

🟢 Strong Choice
🟡 Good Choice
🔵 Consider Alternatives

The indicator should explain why, using transparent rules rather than opaque scoring.

2. "What Changed?" Panel

When users modify the amount or tenure, briefly summarize the impact:

Interest earned increased by ₹8,200.
Maturity date moved from 12 Aug 2027 to 12 Aug 2028.
Monthly payout is no longer available for this tenure.

This makes changes easier to understand than comparing multiple values manually.

3. Scenario Comparison

Allow users to compare two configurations without leaving the booking flow, for example:

Current	Alternative
₹5,00,000 • 1 Year	₹5,00,000 • 2 Years
₹35,000 interest	₹53,400 interest

This supports informed decision-making while keeping the experience simple.