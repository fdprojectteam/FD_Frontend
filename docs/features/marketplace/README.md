# FD Marketplace Module

Status: Approved — Implementation Target (Phase 2)
Priority: High (Core Module)
Primary User: Retail Investor
Last Updated: 2026-07-30

The FD Marketplace is the core module of the platform and the entry point of the investment journey. It enables customers to discover, compare, and evaluate Fixed Deposits from multiple RBI-regulated partner banks in one place. It is also the **reference implementation** of the platform's design system: every future module inherits its visual language, components, and interaction patterns.

---

## Approved Scope

Three screens, approved by the client. Implement exactly as designed — no redesigns, no visual improvisation.

| Screen | Desktop | Mobile |
|---|---|---|
| Marketplace Home | `ui/FD Marketplace_home_desktop_01.png` | `ui/FD Marketplace_home_mobile_01.png` |
| Product Details | `ui/FD Marketplace_product_desktop_01.png` | `ui/FD Marketplace_product_mobile_01.png` |
| Comparison | `ui/FD Marketplace_comparision_desktop_01.png` | `ui/FD Marketplace_comparision_mobile_01.png` |

These images are the final design source of truth.

## Layout Rule

The Marketplace is a **public product**. It uses the approved **top-navigation layout** (Top Nav → Hero → Content → Footer). It does **not** use the application sidebar. The sidebar shell is reserved for authenticated modules (Portfolio, Dashboard, Support, Admin).

Top navigation: FD Marketplace logo · Marketplace · Portfolio · Support · Notifications · Profile.

## Screen Inventory

### Marketplace Home
- Hero: headline, subtext, primary CTA (Explore Fixed Deposits), secondary CTA (How it works), highest-rate spotlight card, trust indicators (RBI regulated · ₹5L DICGC insured · 50+ partner banks)
- Search bar: bank/product query, amount, tenure
- Recommended-for-you category cards (Highest Interest Rate, Senior Citizen Special, Tax Saving, Short-Term, High Returns)
- Filter chips (Bank, Tenure, Interest Rate, Amount) and sort (Highest rate)
- Product grid (6 per page) with pagination; each card: bank badge, rate, tenure, min investment, estimated returns, benefit chips, View details, Compare
- Featured banks strip
- Trust strip (RBI regulated, Secure and encrypted, No hidden charges, Support)
- Footer

### Product Details
- Back to Marketplace
- Product header: bank badge, product name, rate per annum
- Trust badges: RBI Regulated, ₹5L DICGC Insured, AAA Rating
- Key information: Tenure, Interest Type, Minimum Investment, Interest Payout
- Investment calculator: amount + tenure → Principal → Interest Earned → Maturity Value
- Benefits chips, Eligibility
- Accordions: Interest breakdown, FAQs, Terms and conditions
- Sticky actions: Add to Compare, Continue to Booking (booking implemented in a later phase; this is the entry point only)

### Comparison
- Back to Marketplace, "Comparing N of 4 Products", Add another FD
- Column per product (removable), rows: Interest Rate, Tenure, Minimum Investment, Interest Earned, Maturity Value, Benefits, Eligibility
- Best value per row highlighted
- Select per column; Back to Marketplace / Proceed to Booking

**Mobile is a different presentation, not a reflow** (recorded T2.7.0). The approved mobile screen shows **one product card at a time**, with ‹ › arrows and dot indicators, the whole row highlighted rather than the cell, Benefits and Eligibility stacked label-above-value, and three shortened labels: "Comparing N of 4", "Add", "Back".

**Best value is not simply "highlight the winner".** Interest Rate, Interest Earned, and Maturity Value take the highest; Minimum Investment takes the **lowest**; **Tenure has no winner at all**, because neither direction is universally better; Benefits and Eligibility have none. A **tie goes to the leftmost column** — the approved screen shows HDFC and IDFC both at ₹10,000 with only HDFC marked.

## Data Contract

Served through the platform's single mock strategy (see `docs/development/roadmap.md` §1.3): UI → Service → Repository Interface → API Repository → Axios → MSW → Mock Data.

Primary endpoints (Document 10 conventions):

- `GET /api/v1/products` — pagination (`page`, `limit`), search, filters (`bank`, `minInterestRate`, `maxTenure`, `category`), sort (`sort`, `order`)
- `GET /api/v1/products?ids=a,b,c` — the comparison batch (up to 4). **Returns detail-level payloads and no pagination `meta`**, because the approved comparison screen has an Eligibility row and `eligibility` exists only on the details shape (T2.7.1a). Unknown ids are dropped rather than returned as holes
- `GET /api/v1/products/{id}`
- `GET /api/v1/banks`

Note for the real API (Phase 3 handover): `/products` therefore serves two response shapes from one URL — summaries with `meta`, or details without. The repository hides this, so nothing above the transport depends on it, but a production backend would more naturally expose a dedicated batch route.

Responses use the standard envelope (`success`, `message`, `data`, `meta`). Mock data is generated with factories (realistic Indian FD data: banks, rate slabs, tenures, senior-citizen bonus, payout types). Comparison and calculator values are **derived, never stored** (computed from principal, rate, tenure).

## Component Contributions to the Design System

Built here, owned by the design system, reused platform-wide:

- Base: Button (primary/secondary/outline), Search Input, Filter Chip, Badge, Accordion, Pagination, Card
- Business: FD Product Card, Compare Card/Table, Interest Rate Display, Deposit Calculator, Bank Badge, Trust Indicator, Benefit Chip

No screen-specific components (e.g., no `MarketplaceButton`). Variants only.

## Supporting Documents

- Product discovery and UX: `analysis/` (module summary, business context, personas, user goals, journey, pain points, research, experience strategy, IA, user flow, screen inventory)
- Engineering blueprint: `docs/engineering/` (Documents 01–16)
- Phase plan and decisions: `docs/development/roadmap.md`

## Definition of Done

Matches approved UI · Responsive (desktop/tablet/mobile) · Accessible (WCAG 2.2 AA) · Reusable components and design tokens only · No TypeScript or ESLint errors · Production quality.
