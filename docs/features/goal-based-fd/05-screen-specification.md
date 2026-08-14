# Goal-Based FD — Screen Specification

## 1. Purpose

Define the screens, fields, actions, states, and reusable
components required for the Goal-Based FD POC.

The specification must reuse the existing Marketplace,
Booking, domain models, and design system wherever possible.

---

# 2. Screen Architecture

Goal-Based FD
│
├── 1. Goal Landing
├── 2. Goal Selection
├── 3. Goal Details
├── 4. Customer Profile
├── 5. Recommendation Analysis
├── 6. Recommendation Result
├── 7. Plan Review
│
└── Existing Platform
    ├── Marketplace Product Details
    ├── Comparison
    └── Booking
        ├── Overview
        ├── Investment Details
        └── Nominee

---

# 3. Screen 1 — Goal-Based Landing

## Purpose

Introduce Goal-Based FD planning.

## Content

Headline:

"Plan your FD around your goal."

Supporting message:

"Tell us what you want to achieve and we'll help you find
suitable FD options."

## Primary Action

Start Planning

## Secondary Action

Explore FDs

## Rules

No recommendation is generated on this screen.

---

# 4. Screen 2 — Goal Selection

## Purpose

Identify the customer's primary goal.

## Goal Options

- Emergency Fund
- Children's Education
- Retirement
- Target Maturity

## Interaction

Customer selects one goal.

Selected goal is stored in the Goal Planning state.

## Validation

A goal must be selected before continuing.

---

# 5. Screen 3 — Goal Details

The fields depend on the selected goal.

## Emergency Fund

- Required amount
- Time horizon
- Liquidity requirement

## Children's Education

- Required amount
- Time horizon / target date

## Retirement

- Investment amount
- Time horizon

## Target Maturity

- Investment amount
- Target maturity amount
- Time horizon

## Validation

All required values must be valid before analysis.

---

# 6. Screen 4 — Customer Profile

## Fields

- Age / customer age group
- Senior citizen eligibility
- Investment amount where applicable
- Risk preference where applicable

## Principle

Only collect information required by the selected scenario.

Do not create unnecessary KYC or personal-data collection
for the POC.

---

# 7. Screen 5 — Recommendation Analysis

## Purpose

Show that the system is evaluating the customer's goal.

## Processing

Input
 ↓
Validate
 ↓
Identify eligible products
 ↓
Match goal
 ↓
Match tenure
 ↓
Evaluate applicable benefits
 ↓
Calculate maturity
 ↓
Apply recommendation rules
 ↓
Generate recommendation

## UI

Use a simple analysis/loading state.

The POC should not expose internal rule-engine implementation
details to the customer.

---

# 8. Screen 6 — Recommendation Result

## Purpose

Present the recommended FD clearly.

## Primary Recommendation Card

Display:

- Bank
- Product
- Investment amount
- Tenure
- Interest rate
- Expected maturity
- Goal
- Recommendation reason

## Example

Recommended for your 2-year goal

Investment:
₹5,00,000

Tenure:
2 Years

Rate:
7.25%

Expected maturity:
[calculated value]

Why this FD?

"Matches your investment horizon and applicable eligibility
conditions."

## Actions

Primary:

Proceed with this FD

Secondary:

Compare other options

Secondary:

Modify goal

---

# 9. Recommendation Explanation

The customer should be able to understand why the product
was selected.

## Explanation Sections

### Goal Match

Why the product matches the goal.

### Tenure Match

Why the tenure is suitable.

### Eligibility

Applicable customer/product eligibility.

### Expected Return

Expected maturity based on the existing FD calculation.

### Other Considerations

Liquidity, diversification or target considerations where
applicable.

---

# 10. Screen 7 — Plan Review

For multi-goal scenarios, show the complete plan.

## Example

Total Investment: ₹25,00,000

| Goal | Allocation | Tenure | Expected Maturity |
|---|---:|---:|---:|
| Emergency | ₹5,00,000 | Short-term | Calculated |
| Education | ₹10,00,000 | 3 Years | Calculated |
| Retirement | ₹10,00,000 | Long-term | Calculated |

## Actions

- Modify allocation
- Compare
- Accept Plan

---

# 11. Target Maturity Result

For target-based scenarios:

Display:

Target:
₹27,00,000

Expected:
₹27,XX,XXX

Status:

Target Achievable

OR

Target Gap:
₹X,XX,XXX

## If Target Is Not Achievable

Show possible adjustments:

- Increase investment
- Extend tenure
- Modify allocation

Do not claim the target is achievable without calculation.

---

# 12. Senior Citizen Result

Where applicable:

Show:

"Senior Citizen Benefit"

and explain the applicable benefit using actual product data.

Never hard-code a benefit that does not exist in the FD product
data.

---

# 13. Alternative Products

The recommendation screen may show alternative eligible
products.

Each alternative should display:

- Bank
- Tenure
- Rate
- Expected maturity
- Key reason

The recommended product should remain visually primary.

---

# 14. Comparison

If the customer selects Compare:

Reuse the existing Marketplace comparison experience.

Do NOT create a second comparison implementation.

Goal-based context should be preserved when returning to the
recommendation.

---

# 15. Product Selection

When the customer selects an FD:

Goal Recommendation
        ↓
Selected Product
        ↓
Existing Product Details
        ↓
Existing Booking

The Goal-Based module ends at product selection.

---

# 16. Booking Integration

Reuse existing Booking screens:

1. Booking Overview
2. Investment Details
3. Nominee
4. Future booking steps

The selected product must enter Booking with its existing
product/rate configuration.

No duplicate booking implementation.

---

# 17. Empty State

If no eligible FD is found:

Headline:

"We couldn't find an FD that matches your requirements."

Show:

- What requirement could not be matched
- Possible adjustment
- Explore Marketplace

Actions:

- Modify Goal
- Explore FDs

---

# 18. Validation State

Invalid input should be identified before recommendation.

Examples:

- Amount missing
- Invalid amount
- Invalid target
- Invalid time horizon
- Missing required goal information

The customer should receive clear corrective guidance.

---

# 19. Loading State

During rule evaluation:

Show a short progress state.

Example:

"Analyzing your goal..."

The POC should avoid suggesting that AI is being used.

---

# 20. Error State

If recommendation processing fails:

"We couldn't generate your recommendation right now."

Actions:

- Try Again
- Explore FDs

The existing Marketplace remains available.

---

# 21. Rule Explanation Contract

Every recommendation must have structured reasons.

Example:

{
  "goalMatch": "...",
  "tenureMatch": "...",
  "eligibility": "...",
  "returnReason": "...",
  "otherConsiderations": "..."
}

The UI renders these reasons.

The rule engine owns the reason generation.

The UI must not recreate business rules.

---

# 22. Component Reuse

Reuse existing components wherever possible.

Expected reuse:

- Button
- Input
- Select
- Card
- Badge
- RadioCardGroup
- Slider
- InvestmentSummary
- Comparison components
- Booking components
- Stepper
- Design tokens

New components should only be created when no existing
component provides the required behaviour.

---

# 23. State Separation

Goal Planning State

Stores:

- Goal
- Goal details
- Customer inputs
- Planning preferences

FD Domain State

Stores:

- Product
- Tenure
- Rate
- Payout
- Maturity information

Booking State

Stores:

- Investment configuration
- Nominee
- Booking progress

Goal planning must not duplicate FD domain truth.

---

# 24. POC Screen Boundary

### New

Goal Landing
Goal Selection
Goal Details
Customer Profile
Analysis
Recommendation
Plan Review

### Existing

Marketplace
Product Details
Comparison
Booking

---

# 25. Design Principle

The experience should feel like:

Customer Goal
      ↓
Personalized Plan
      ↓
Recommended FD
      ↓
Explain Why
      ↓
Review
      ↓
Book

Not:

Customer
      ↓
Large FD Catalogue
      ↓
Search
      ↓
Compare Everything
      ↓
Make Decision Alone

---

# 26. POC Constraints

The UI must not:

- Invent FD rates
- Invent products
- Calculate contractual rates independently
- Duplicate Marketplace
- Duplicate Booking
- Implement AI
- Introduce a second FD domain model
- Introduce unnecessary platform architecture changes