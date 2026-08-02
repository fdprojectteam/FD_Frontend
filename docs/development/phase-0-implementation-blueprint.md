# Phase 0 — Implementation Blueprint

Project: FD Investment Platform
Role: Principal Frontend Architect
Status: Awaiting Approval — no code until approved
Last Updated: 2026-07-30

This blueprint translates the Engineering Blueprint (Documents 01–16), the approved architecture decisions (`roadmap.md`), and the approved Design System (`docs/engineering/FD-design-sys-01.png`) into a concrete, task-level implementation plan for Phase 0. It contains no application code.

---

## 1. Phase 0 Objectives

### What will be built

A running, empty, production-grade Next.js 15 application skeleton: strict TypeScript, Tailwind CSS v4 with the full design-token scaffold (CSS variables carrying values extracted from the approved Design System), shadcn/ui initialized but unshipped, the complete platform folder structure with enforced dependency boundaries, code-quality gates (ESLint, Prettier, Husky, lint-staged), and validated environment configuration.

### Why it is required

Every later phase plugs into this skeleton. Establishing structure, boundaries, tokens, and quality gates before any UI exists means Phase 1 components are born in the right place, styled from tokens, and held to the Definition of Done automatically — instead of retrofitting discipline onto existing code. For a platform intended to grow from three screens to a full fintech ecosystem, the foundation is the highest-leverage phase.

### Expected deliverables

A repository that boots (`dev` and `build`) with zero TypeScript and zero ESLint errors; the folder hierarchy of Section 2 in place; all Phase 0/1/2 packages installed and version-pinned; token CSS variables defined and consumed by Tailwind; pre-commit hooks blocking unformatted or unlinted commits; `.env.example` documenting all environment variables with runtime validation; a placeholder landing page proving the shell renders. Explicitly out of scope: Marketplace screens, styled components, MSW handlers, any business logic.

---

## 2. Final Next.js Project Structure

```
fd-investment-platform/
├── docs/                          # existing documentation (unchanged)
├── public/
│   └── assets/                    # static files served as-is (bank logos later)
├── src/
│   ├── app/                       # ROUTING ONLY — no business logic
│   │   ├── (public)/              # public experience: marketplace (top-nav layout)
│   │   │   ├── layout.tsx         # PublicLayout wrapper (Phase 1)
│   │   │   └── page.tsx           # landing → Marketplace Home (Phase 2)
│   │   ├── (app)/                 # future authenticated experience (sidebar shell)
│   │   ├── (admin)/               # future admin experience
│   │   ├── layout.tsx             # root layout: fonts, providers, metadata
│   │   ├── providers.tsx          # client provider composition (Query, etc.)
│   │   └── globals.css            # Tailwind v4 entry + token CSS variables
│   ├── modules/                   # business domains, self-contained
│   │   └── marketplace/
│   │       ├── components/        # business components used only by this module
│   │       ├── hooks/             # useMarketplaceProducts, useCompare…
│   │       ├── services/          # ProductService, ComparisonService
│   │       ├── repositories/      # ProductRepository (interface + API impl)
│   │       ├── types/             # Product, Bank, filters
│   │       ├── constants/
│   │       └── utils/             # maturity calculation, formatters
│   ├── components/                # platform-wide shared UI (design-system owned)
│   │   ├── ui/                    # shadcn-derived base: Button, Input, Card…
│   │   ├── business/              # cross-module fintech components
│   │   ├── forms/                 # form field wrappers (RHF integration)
│   │   ├── feedback/              # EmptyState, ErrorState, Skeletons, Toast
│   │   └── navigation/            # TopNav, Footer, Breadcrumbs, Sidebar (later)
│   ├── design-system/
│   │   └── tokens/                # token definitions (see Section 9)
│   ├── layouts/                   # PublicLayout, AppShell, AdminLayout, AuthLayout
│   ├── hooks/                     # shared hooks: useDebounce, useMediaQuery…
│   ├── services/
│   │   └── api/                   # Axios instance, interceptors, envelope handling
│   ├── store/                     # Zustand slices: ui, (auth later)
│   ├── lib/                       # third-party config: query-client, cn utility
│   ├── config/                    # env.ts (Zod-validated), featureFlags.ts
│   ├── constants/                 # routes.ts, app.ts (names, page sizes)
│   ├── types/                     # shared models: ApiResponse, Pagination, ApiError
│   ├── utils/                     # shared pure helpers (currency, date)
│   ├── styles/                    # additional global css if ever required
│   └── mocks/
│       ├── data/                  # factories + datasets (Phase 2)
│       ├── handlers/              # MSW handlers per domain (Phase 2)
│       └── browser.ts             # MSW worker bootstrap (Phase 1)
├── .env.example                   # documented environment variables
├── .husky/                        # git hooks (pre-commit)
├── components.json                # shadcn/ui configuration
├── eslint.config.mjs              # flat config + boundary rules
├── next.config.ts
├── postcss.config.mjs             # Tailwind v4 PostCSS plugin
├── prettier.config.mjs
├── tsconfig.json                  # strict, @/* alias
└── package.json
```

### Folder responsibilities

| Folder | Responsibility | Never contains |
|---|---|---|
| `src/app` | Route definitions, layout assignment, metadata, page composition | Business logic, data fetching logic, styled markup beyond composition |
| `src/modules` | Business domains; each owns its components, hooks, services, repositories, types | Imports from another module; page routing |
| `src/components` | Reusable, domain-agnostic (ui/composite) and cross-module business UI | Module-specific logic; data fetching |
| `src/design-system` | Token source of truth consumed by Tailwind and components | Components; business logic |
| `src/layouts` | Page structure (shells); compose navigation + content regions | Page content |
| `src/hooks` | Shared reusable logic | UI rendering |
| `src/services/api` | The single Axios client, interceptors, error normalization | Feature endpoints (those live in module services) |
| `src/store` | Global app state only (UI chrome, auth later) | Server data (owned by TanStack Query) |
| `src/lib` | Third-party library configuration | Application logic |
| `src/config` | Environment + feature flags, validated at startup | Secrets in source |
| `src/mocks` | MSW worker, handlers, factories | Anything imported by components |
| `src/types` / `constants` / `utils` | Shared contracts, values, pure helpers | Feature-specific items (live in module) |

Dependency rule (enforced by ESLint boundaries): `app → modules → components → hooks → services → api`. Shared folders never import from `modules`; modules never import from each other; `mocks` is imported only by the MSW bootstrap.

---

## 3. Package Installation Plan

### Runtime dependencies

| Package | Why | First used |
|---|---|---|
| `next` (15.x) | Framework: App Router, server components, image/font optimization | Phase 0 |
| `react`, `react-dom` (19.x) | UI library | Phase 0 |
| `tailwindcss` (v4) + `@tailwindcss/postcss` | Utility styling driven by token CSS variables | Phase 0 |
| `class-variance-authority` | Variant system for base components (Button variants/sizes) | Phase 0 (installed) / Phase 1 (used) |
| `clsx` + `tailwind-merge` | `cn` class utility required by shadcn pattern | Phase 0 |
| `lucide-react` | Icon set — matches approved "clean line icon" style | Phase 1 |
| `@tanstack/react-query` | Server state: caching, retries, loading/error states | Phase 1 (provider) / Phase 2 (queries) |
| `zustand` | Global app state (UI chrome; auth later) | Phase 1 |
| `react-hook-form` + `@hookform/resolvers` | Forms with minimal re-renders; Zod bridge | Phase 2 (calculator/search) |
| `zod` | Validation: env vars (Phase 0), forms, API payload guards | Phase 0 |
| `axios` | Single HTTP client behind the repository layer | Phase 1 |
| `framer-motion` | Approved motion library for micro-interactions | Phase 2 |
| Radix primitives (via shadcn per-component) | Accessible headless behavior (dialog, select, accordion…) | Phase 1 |

### Dev dependencies

| Package | Why | First used |
|---|---|---|
| `typescript`, `@types/react`, `@types/node` | Strict typing | Phase 0 |
| `eslint` + `eslint-config-next` | Lint gate | Phase 0 |
| `eslint-plugin-boundaries` (or `import-x` rules) | Mechanically enforce Document 08 dependency rules | Phase 0 |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting + deterministic class ordering | Phase 0 |
| `husky` + `lint-staged` | Pre-commit enforcement of lint/format | Phase 0 |
| `msw` (2.x) | Mock layer implementing the Document 10 API contract | Phase 1 (bootstrap) / Phase 2 (handlers) |
| `@tanstack/react-query-devtools` | Query inspection during development | Phase 1 |

Everything is installed in Phase 0 with pinned versions so later phases never change the dependency baseline mid-flight. `@faker-js/faker` (mock factories) is deferred to Phase 2 — it is a data decision, not a foundation one.

---

## 4. Configuration Files

No code here — this defines what each file must establish.

**package.json.** Pinned versions (no `^` drift for framework-critical packages). Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck` (tsc --noEmit), `prepare` (husky). `lint-staged` block: Prettier + ESLint on staged `ts/tsx`, Prettier on `md/css/json`.

**tsconfig.json.** `strict: true` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `forceConsistentCasingInFileNames`. Path alias `@/* → src/*`. Bundler module resolution as generated by Next 15. No `any` escape hatches; `skipLibCheck` allowed for third-party types only.

**next.config.ts.** Minimal by design: typed routes on, React strict mode on, `images.remotePatterns` empty for now (bank logos are local assets in POC). No experimental flags — the foundation stays boring.

**eslint.config.mjs.** Flat config: `next/core-web-vitals` + TypeScript rules; import ordering (external → shared internal → module → relative, per Document 12 §13); boundary rules encoding Section 2's dependency matrix (e.g., `components/**` may not import `modules/**`; `modules/marketplace/**` may not import `modules/*` siblings). `no-restricted-imports` blocks direct `axios` imports outside `services/api` and direct `mocks/**` imports outside the MSW bootstrap.

**prettier.config.mjs.** House style (single quotes, trailing commas, 100-col print width) + `prettier-plugin-tailwindcss` so class order never causes diff noise.

**Tailwind v4 (postcss.config.mjs + globals.css).** Tailwind v4 is CSS-first: there is no `tailwind.config.ts` by default. `globals.css` imports Tailwind and defines the design tokens as CSS variables under `:root`, then maps them into Tailwind's `@theme` so utilities like `bg-primary-600`, `rounded-card`, `text-h1` are generated from our tokens. Semantic aliases (`--color-background`, `--color-surface`, `--color-border`) sit above raw palette values so a future dark theme changes aliases, not components.

**components.json (shadcn).** Style "new-york", RSC on, `tsx` on, base color mapped to our CSS variables (not shadcn defaults), aliases pointing at `@/components/ui` and `@/lib`. Rule of use: shadcn is a scaffolding source; every generated component is immediately restyled with our tokens and variant API before first use. Default shadcn appearance never ships.

**Environment variables.** `.env.example` documents: `NEXT_PUBLIC_API_URL` (default `/api/v1`), `NEXT_PUBLIC_ENABLE_MOCKS` (`true` in dev), `NEXT_PUBLIC_APP_ENV` (`local|development|staging|production`). `src/config/env.ts` parses `process.env` through a Zod schema at startup — a missing or malformed variable fails the build loudly instead of failing a request quietly. No secrets exist in the POC; the pattern is what matters.

---

## 5. Design System Foundation

All values below are **extracted from the approved Design System image** (`docs/engineering/FD-design-sys-01.png`) and approved UI screens. Nothing is invented.

### Theme architecture

Three layers: raw palette tokens (`--color-purple-600`) → semantic aliases (`--color-primary`, `--color-surface`, `--color-text-muted`) → Tailwind `@theme` mapping that generates utilities. Components only ever use semantic utilities. This gives central re-theming (Document 06) and future dark-mode capability without component changes.

### Color system (extracted)

| Token | Value | Usage |
|---|---|---|
| `purple-600` (Primary) | `#5B3FD0` | Primary actions, highlights, interest rates, key elements |
| `success` | `#16A34A` | Positive states, trust badges (RBI, DICGC) |
| `warning` | `#F59E0B` | Warnings, "Limited Time" tags |
| `error` | `#EF4444` | Errors, destructive actions |
| `info` | `#3882F6` | Informational accents, bank badges |
| `white` | `#FFFFFF` | Surfaces, cards |
| `gray-50` | `#F9FAFB` | Page background |
| `gray-100` | `#F3F4F6` | Subtle fills, hover states |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-600` | `#4B5563` | Secondary text |
| `gray-900` | `#111827` | Primary text, headings |

Derived tints observed in the approved UI (light purple fills for hero card, highlighted comparison cells, calculator result) will be defined as `purple-50/100/700` steps sampled from the approved screens during implementation — recorded in the token file with their source noted. Contrast of every text/background pair is validated against WCAG 2.2 AA (4.5:1 normal, 3:1 large) before Phase 1 components use it.

### Typography (extracted)

Font family: **Inter** (approved decision, 2026-07-30 — overrides the "Poppins" label in the Design System image), loaded via `next/font` with fallback stack.

| Token | Weight / Size / Line-height | Usage |
|---|---|---|
| `h1` | Bold 32 / 40 | Page hero headings |
| `h2` | SemiBold 24 / 32 | Sub headings |
| `h3` | SemiBold 18 / 28 | Section titles |
| `body-lg` | Regular 16 / 24 | Lead copy |
| `body` | Regular 14 / 20 | Default text |
| `caption` | Regular 12 / 16 | Labels, meta |
| `numeric` | Bold 20+ | Rates and key values (₹, %) |

✅ **Resolved:** Document 14 §8 (Inter) vs Design System image (Poppins) — client confirmed **Inter** as the official font (2026-07-30).

### Spacing (extracted)

8px grid: scale `4, 8, 16, 24, 32, 48, 64` mapped to token steps. Component padding, gaps, and section rhythm use only these steps; arbitrary values require justification per Document 12 §12.

### Border radius (extracted)

Cards: `20px` ("rounded corners 20px for softness"). Buttons/inputs: medium radius (~10–12px, sampled from approved screens and recorded). Chips/badges: pill. Tokens: `radius-sm`, `radius-md`, `radius-card`, `radius-full`.

### Shadows (extracted)

"Soft shadow for elevation" on white cards with minimal borders: two elevation tokens — `shadow-card` (resting) and `shadow-card-hover` (raised on hover per Document 06 interaction standards) — sampled from the approved screens; low-opacity, large-blur values consistent with the premium aesthetic.

### Icons, grid, breakpoints (extracted)

Clean line icons → Lucide, with `icon-sm/md/lg` size tokens. Responsive grid: Desktop 12 columns (1200px+), Tablet 8 columns (768–1199px), Mobile 4 columns (320–767px).

✅ **Resolved:** client confirmed **1200px** as the desktop breakpoint (2026-07-30). Layout switches: mobile <768px, tablet 768–1199px, desktop ≥1200px.

---

## 6. Routing Architecture

### Route groups and layout hierarchy

```
app/
├── layout.tsx                → Root: html/body, Poppins, providers, metadata
├── (public)/                 → PublicLayout: TopNav + content + Footer
│   ├── page.tsx              → Marketplace Home            /
│   ├── marketplace/
│   │   ├── page.tsx          → (alias of home listing)     /marketplace
│   │   └── [productId]/      → Product Details             /marketplace/{id}
│   └── compare/              → Comparison                  /compare
├── (app)/                    → future — AppShell (sidebar): /portfolio, /dashboard,
│                               /reports, /notifications, /settings  [Phase 3+]
└── (admin)/                  → future — AdminLayout:        /admin/*     [later]
```

Public routes (Phase 2): `/`, `/marketplace`, `/marketplace/[productId]`, `/compare`. Deep-linkable per Document 04 §13 — compare selection encoded in URL state so a comparison can be shared.

Future authenticated routes live in `(app)` behind a route-group layout that will add the auth guard and sidebar shell (Phase 3+); `(admin)` mirrors this for the admin experience. The group boundaries are created in Phase 0 (empty) so future modules land without moving files.

Rendering strategy per Document 13: server components by default (listing shells, static content), client components only where interactivity demands (search, filters, calculator, compare state).

### Layout hierarchy

Root layout (fonts/providers) → group layout (PublicLayout or AppShell) → page. Pages never re-implement chrome; layouts never contain page content (Document 05).

---

## 7. State Management Architecture

| Concern | Tool | Rules |
|---|---|---|
| Server data (products, banks, portfolio…) | **TanStack Query** | The only owner of server state. Query keys per domain (`['products', filters]`). Caching, retry, background refresh, loading/error states. Never copied into Zustand. |
| Global app state | **Zustand** | Only cross-module client state: UI chrome (mobile nav open, toasts), theme, and later auth session/permissions. Small slices; components subscribe narrowly. |
| Feature state | Module hooks (useState/useReducer inside custom hooks) | Marketplace filters, search query, sort, compare list — owned by `modules/marketplace/hooks`. Never accessible to other modules. |
| Local state | `useState` | Accordion open, modal visibility, input focus. |
| URL state | App Router (searchParams/params) | Pagination page, product id, compare selection — anything shareable/bookmarkable. |
| Forms | **React Hook Form** | Calculator, search bar, future booking/auth forms. Uncontrolled inputs, minimal re-renders. |
| Validation | **Zod** | Single schema per form reused for RHF resolver; also validates env config and (in handlers) mock API payloads — one validation vocabulary everywhere. |

Persistence: only theme/preferences (and later the session identifier) persist; never API responses or temporary UI state (Document 09 §13). Derived values (maturity amount) are always computed, never stored.

Phase 0 delivers the *architecture seats* for these (providers file, empty store folder, lib config); actual stores and queries arrive with the features that need them.

---

## 8. API Layer Architecture

```
UI Component
   ↓ (props/hooks only)
Feature Hook            useMarketplaceProducts()        [module/hooks]
   ↓
Service                 ProductService.getProducts()    [module/services]
   ↓
Repository Interface    ProductRepository               [module/repositories]
   ↓
API Repository          ApiProductRepository            [module/repositories]
   ↓
Axios API Client        request/response interceptors   [services/api]
   ↓
MSW (dev)  /  Production API (future)
   ↓
Mock Data (factories)   [mocks/data]
```

Responsibilities: the **Axios client** (one instance) owns base URL from env, auth header injection, response-envelope unwrapping, and error normalization into a typed `ApiError`. **Repositories** speak HTTP resources and return raw domain DTOs. **Services** transform DTOs into frontend models and hold business operations (Document 10 §14–15). **Hooks** bind services to TanStack Query. **Components** receive prepared data via hooks — they never import axios, repositories, or mock data (ESLint-enforced).

**MSW integration:** the worker starts only when `NEXT_PUBLIC_ENABLE_MOCKS=true`, initialized from a client-side bootstrap before queries fire. Handlers (Phase 2) implement the Document 10 contract faithfully — envelope, pagination computed server-side, combinable filters, sorting, Zod-validated payloads, realistic latency, and error scenarios (404, 422, 500). Migration to production = flipping the env flag. Nothing else changes.

Shared contracts in `src/types`: `ApiResponse<T>` (`success`, `message`, `data`, `meta`), `PaginationMeta`, `ApiError` (`code`, `details`) — defined in Phase 0 so every later layer types against them.

---

## 9. Design System Folder Structure

```
src/design-system/
└── tokens/
    ├── colors.css          # palette + semantic aliases (CSS variables)
    ├── typography.css      # font scale variables (size/leading/weight pairs)
    ├── spacing.css         # 8px-grid scale
    ├── radius.css          # sm / md / card / full
    ├── shadows.css         # card / card-hover elevations
    ├── motion.css          # durations, easings (fast 150ms, base 250ms; reduced-motion respected)
    ├── sizes.css           # icon sizes, button heights, touch targets (≥44px)
    └── index.css           # aggregates tokens; imported by app/globals.css @theme
```

Companion (Phase 0, documentation not code): `docs/engineering/design-tokens.md` — the extracted-token record with source references (which screen/section each value came from), so token provenance is auditable and "do not guess values" is verifiable.

Component variants (Button primary/secondary/outline/ghost sizes sm/md/lg, states incl. loading; Badge semantic variants; Chip selected/unselected…) are *defined* in this blueprint's terms but *implemented* in Phase 1 in `components/ui`, consuming only these tokens via CVA.

---

## 10. Development Order — Phase 0 Task Breakdown

Tasks are 30–60 minutes each, sequential unless noted. Each ends in a working, committable state.

**T0.1 — Initialize the Next.js application.**
Objective: scaffold Next.js 15 + React 19 + TypeScript (strict) with App Router in the repo root, aligned to `src/` convention.
Files: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (default), `.gitignore`.
Expected output: `dev` serves a default page; `build` passes; `typecheck` passes.
Dependencies: none.

**T0.2 — Harden TypeScript and project configuration.**
Objective: strict-plus compiler flags, `@/*` alias, typed routes, pinned dependency versions.
Files: `tsconfig.json`, `next.config.ts`, `package.json` (edits).
Expected output: `typecheck` passes with hardened flags; alias imports resolve.
Dependencies: T0.1.

**T0.3 — ESLint + Prettier with boundary enforcement.**
Objective: flat ESLint config (Next + TS + import order + folder boundary rules + restricted imports), Prettier with Tailwind plugin, scripts wired.
Files: `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `package.json` (scripts).
Expected output: `lint` and `format:check` pass; a deliberate boundary violation fails lint (verified, then removed).
Dependencies: T0.1.

**T0.4 — Git hooks.**
Objective: Husky + lint-staged pre-commit gate (format + lint on staged files).
Files: `.husky/pre-commit`, `package.json` (`prepare`, `lint-staged`).
Expected output: a commit with a formatting violation is blocked; clean commit passes.
Dependencies: T0.3.

**T0.5 — Tailwind v4 + design-token scaffold.**
Objective: Tailwind v4 via PostCSS; create `design-system/tokens/*.css` with the extracted values from Section 5; map tokens into `@theme` in `globals.css`; load Inter via `next/font`.
Files: `postcss.config.mjs`, `src/app/globals.css`, `src/design-system/tokens/*` (8 files), `src/app/layout.tsx` (font wiring).
Expected output: placeholder page renders with Inter on `gray-50` background; token-driven utilities (`bg-primary`, `text-h1`, `rounded-card`, `shadow-card`) generate correctly.
Dependencies: T0.2.

**T0.6 — Token provenance document.**
Objective: record every extracted token with its source (design-system image section or approved screen), including sampled tints and both flagged conflicts with their resolutions.
Files: `docs/engineering/design-tokens.md`.
Expected output: auditable token record; "no guessed values" verifiable.
Dependencies: T0.5.

**T0.7 — shadcn/ui initialization.**
Objective: initialize shadcn configured against our CSS variables and aliases; add the `cn` utility; generate zero components.
Files: `components.json`, `src/lib/cn.ts` (or `lib/utils.ts` per shadcn convention).
Expected output: shadcn CLI ready; config points at `@/components/ui`; no default-styled component exists in the tree.
Dependencies: T0.5.

**T0.8 — Platform folder structure and shared contracts.**
Objective: create the full Section 2 hierarchy with `index.ts` barrels and one-line README per top-level folder stating its responsibility; define shared types (`ApiResponse`, `PaginationMeta`, `ApiError`) and constants (`routes.ts`, `app.ts`).
Files: all Section 2 folders, `src/types/api.ts`, `src/types/pagination.ts`, `src/constants/routes.ts`, `src/constants/app.ts`, folder READMEs.
Expected output: structure matches blueprint exactly; `typecheck` and `lint` pass; boundary rules recognize the folders.
Dependencies: T0.3.

**T0.9 — Environment configuration.**
Objective: Zod-validated env parsing, feature flags, documented example file.
Files: `src/config/env.ts`, `src/config/featureFlags.ts`, `.env.example`, `.env.local` (git-ignored).
Expected output: build fails loudly with a malformed env var (verified, then corrected); flags readable app-wide.
Dependencies: T0.2, T0.8.

**T0.10 — Route groups and provider seats.**
Objective: create `(public)`, `(app)`, `(admin)` route groups with placeholder group layouts; `providers.tsx` composing (for now) nothing but ready for QueryClient in Phase 1; minimal placeholder landing page (unstyled beyond tokens) proving the shell.
Files: `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/providers.tsx`, group placeholders.
Expected output: `/` renders through the public group; hierarchy Root → Group → Page verified.
Dependencies: T0.5, T0.8.

**T0.11 — Verification and phase close-out.**
Objective: full gate run (`build`, `typecheck`, `lint`, `format:check`, hook test); confirm structure against blueprint; write the phase summary (completed work, architectural decisions, deviations if any, Phase 1 proposal).
Files: none new (summary delivered in chat; `current-task.md` updated to point at Phase 1).
Expected output: all gates green; Phase 0 Definition of Done met; Phase 1 ready for approval.
Dependencies: all prior tasks.

---

## Confirmations (resolved 2026-07-30)

1. **Font:** **Inter** (client decision; overrides the Poppins label in the Design System image).
2. **Desktop breakpoint:** **1200px** (768px tablet boundary unchanged).

Blueprint approved 2026-07-30. Implementation begins at T0.1.
