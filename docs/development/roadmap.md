# Development Roadmap

Project: FD Investment Platform
Status: Approved — Source of Truth
Last Updated: 2026-07-30

This document records the final architecture decisions and the approved development order. It supersedes any conflicting statement in earlier documents.

---

## 1. Authoritative Decisions

### 1.1 Technology Stack (Final)

| Area | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Component Foundation | shadcn/ui (fully re-themed with our design tokens) |
| Server State | TanStack Query |
| Global State | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| HTTP Client | Axios |
| Mock Layer | MSW (Mock Service Worker) |
| Motion | Framer Motion |
| Icons | Lucide React |

The earlier React + Vite + React Router architecture (Document 02, sections 5 and 23) is **obsolete**. Any reference to Vite or React Router is superseded. All implementation uses Next.js App Router.

### 1.2 Navigation Architecture

- **Marketplace is a public product.** It uses the approved top-navigation layout: Top Nav, Hero, Product Cards, Product Details, Comparison. It does **not** use the application sidebar.
- **The Sidebar Layout belongs only to authenticated modules:** Portfolio, Dashboard, Support, Admin.
- The approved UI images in `docs/features/marketplace/ui/` are the final design reference. No redesigns, no visual improvisation.

### 1.3 Mock Strategy (Single Approved Model)

MSW is the **only** mock layer. The data flow is:

```
UI → Service → Repository Interface → API Repository → Axios → MSW → Mock Data
```

Rules:

- No component consumes mock JSON directly.
- No component knows whether data comes from MSW or a production API.
- MSW handlers implement the production API contract from Document 10 (endpoints, envelope, pagination, filtering, sorting, validation, errors, auth).
- Migrating to production means disabling MSW; the repository, services, and UI remain unchanged.

### 1.4 Design Tokens

- No design values are guessed.
- Tokens (colors, spacing, typography, border radius, shadows, icon sizes, button sizes, component variants) are extracted from the approved Design System image (`docs/engineering/FD-design-sys-01.png`) and the approved UI screens.
- The token system is created **before** any UI is built.
- shadcn/ui components are always restyled with these tokens; the default shadcn appearance is never shipped.

---

## 2. Phase Plan

Phases are implemented strictly in order. No phase is skipped.

### Phase 0 — Platform Foundation *(current)*

Goal: a running, empty, production-grade application skeleton.

- Next.js 15 App Router project with TypeScript (strict)
- Tailwind CSS v4 configured
- shadcn/ui initialized (base only, no default-styled UI shipped)
- Approved folder structure (Document 08, adapted to App Router)
- Theme scaffolding wired to CSS variables (populated fully in Phase 1)
- Code quality tooling: ESLint, Prettier, Husky, lint-staged
- Environment configuration structure

Out of scope: any Marketplace screen, any business component.

### Phase 1 — Design System, Shared Components, Application Shell *(in progress)*

Goal: the reusable foundation every module consumes.

**Status (2026-07-30):**

- ✅ **Component Library — Complete** (T1.1–T1.12): Button, Input, Card, Badge, Chip, Select, Accordion, Dialog, Toast, Pagination, Skeleton. Documented in `docs/engineering/component-library.md`; audited in `docs/development/component-library-audit.md`; reviewable at `/gallery`.
- ✅ **T1.13 — Public Layout Shell — Complete**: Top Navigation, mobile inline nav panel, mobile bottom tab bar, Footer, PublicLayout (owns the document `<main>`, skip link, tab-bar spacing), typed navigation configuration with pathname-driven active state. Approved 2026-07-30.
  - **Shell accessibility convention (approved):** exactly one `aria-current="page"` **per navigation landmark** — the desktop Main nav and the mobile Primary tab bar are independent landmarks, each marking its own current item.
- ⬜ **T1.14 — Data Layer Foundation**: Axios client, API response envelope integration, repository interfaces, MSW bootstrap, TanStack Query provider seat.

Phase 1 is **not** complete until T1.13 and T1.14 are delivered.

**Motion inventory (project record).** Exactly five animation primitives exist: `ds-expand-down`, `ds-collapse-up`, `ds-fade-in`, `ds-fade-out`, `ds-pulse`. No additional animation primitives may be introduced during Phase 1 without explicit approval.

**Temporary Engineering Defaults pending visual validation:** elevation tokens · motion timing tokens · `--ds-duration-pulse` · focus tokens · z-index and opacity scales. These are finalized during the gallery review.

- Design tokens extracted from the approved Design System image
- Foundation: typography, color system, spacing, radius, elevation, motion
- Base components (shadcn-derived, fully re-themed): Button, Input, Select, Card, Badge, Chip, Accordion, Tabs, Modal, Toast, Skeleton, Pagination
- Public layout shell: top navigation, footer (per approved Marketplace UI)
- Sidebar application shell: deferred until the first authenticated module
- Data layer foundation: Axios API client, response envelope types, Repository Interface, MSW bootstrap
- Accessibility baked in per Document 14 (WCAG 2.2 AA)

### Phase 2 — Marketplace Module *(current implementation target)*

Goal: the approved Marketplace, matching the approved UI exactly.

- **Marketplace Home**: hero with highest-rate card, search (bank/amount/tenure), recommended products, filter chips, sort, product grid, pagination, featured banks, trust strip
- **Product Details**: product header with trust badges, key information, investment calculator, benefits, eligibility, interest breakdown / FAQs / T&C accordions, Add to Compare, Continue to Booking (entry point only)
- **Comparison**: up to 4 products, best-value highlighting, add/remove products, proceed to booking (entry point only)
- MSW handlers + mock data factories for products and banks (realistic Indian FD data, pagination/filter/sort server-side in handlers)
- Responsive: desktop, tablet, mobile per approved UI

### Phase 3+ — Later Modules

Implemented after Phase 2, in a sequence to be confirmed per module:

- Booking (and mock FD processing)
- Portfolio
- Authentication
- Support
- Admin

Each future module reuses the design system and platform services. The Marketplace is the reference implementation.

---

## 3. Working Agreement (Iterative Delivery)

The application is never built in one go. For **every** phase:

1. Before code: explain what will be built, why it is needed, and show the folder structure.
2. Wait for explicit approval.
3. Implement only that phase.
4. At the end of the phase: summarize what was completed, explain architectural decisions, and suggest the next phase.

Phases are never skipped.

### Definition of Done (every phase)

- Matches approved UI
- Responsive
- Accessible (WCAG 2.2 AA)
- Uses reusable components and design tokens only
- No TypeScript errors, no ESLint errors
- Production quality
