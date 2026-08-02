# Design Token Inventory

Project: FD Investment Platform
Status: Approved 2026-07-30 (with client refinements) — implemented by T0.5
Last Updated: 2026-07-30

## Method & Provenance

Every token below is tagged with its source. Nothing is invented silently.

- **[SPEC]** — stated explicitly in the approved Design System image (`FD-design-sys-01.png`)
- **[SAMPLED]** — extracted programmatically (pixel sampling / dominant-color analysis) from the approved Marketplace UI screens in `docs/features/marketplace/ui/`
- **[DERIVED]** — computed from an approved rule (e.g., 8px grid snapping) with the derivation shown
- **[TED]** — *Temporary Engineering Default*: no design source exists for this category; standard engineering values adopted provisionally and **validated during Phase 1** against the approved UI

Sampling used the three approved desktop screens (home, product details, comparison) at native resolution (1921px wide).

---

## 1. Color Palette (raw)

### Primary (✅ resolved 2026-07-30: `#4B2E83` — approved UI is final source of truth; the Design System poster is treated as outdated where conflicts exist)

| Token | Value | Source | Evidence |
|---|---|---|---|
| `purple-700` (primary) | `#4B2E83` | [SAMPLED] | Identical across all three screens: hero card, "Invest Now"/"Continue to Booking"/"Proceed to Booking" buttons, all interest-rate text, comparison highlights |
| `purple-50` (tint) | `#F1EBFB` | [SAMPLED] | Calculator maturity box, comparison best-value cells, "Highest Rate" badge background — consistent across screens |
| Poster label value | `#5B3FD0` | [SPEC] | Stated as "Purple 600" in the Design System image (its own swatch renders `#512FB7`, matching neither the label nor the UI) |

### Neutrals

| Token | Value | Source | Usage evidence |
|---|---|---|---|
| `white` | `#FFFFFF` | [SPEC]+[SAMPLED] | Cards, buttons text, page sheet |
| `gray-50` | `#F9FAFB` | [SPEC] | Subtle backgrounds |
| `surface-subtle` | `#F8F9FC` | [SAMPLED] | Recommendation category cards fill (slightly cooler than gray-50; real in-design surface) |
| `gray-100` | `#F3F4F6` | [SPEC]+[SAMPLED] | Fills, hover states (sampled inside product cards) |
| `gray-200` | `#E5E7EB` | [SPEC]+[SAMPLED] | All borders: chips, secondary buttons, search inputs, key-info cards |
| `gray-400` | `#9CA3AF` | [SAMPLED] | Input placeholder text (search bar) |
| `gray-500` | `#6B7280` | [SAMPLED] | Secondary/meta text throughout the approved UI (labels, chip text, trust text) |
| `gray-600` | `#4B5563` | [SPEC] | Poster's stated secondary-text gray (UI screens sample `#6B7280`; both kept in palette) |
| `gray-900` | `#111827` | [SPEC] | Headings, primary text |

### Semantic base colors

| Token | Value | Source | Evidence |
|---|---|---|---|
| `green-600` (success) | `#16A34A` | [SPEC]+[SAMPLED] | Poster spec confirmed by sampling trust-badge icons in product page — exact match |
| `amber-500` (warning) | `#F59E0B` | [SPEC] | Poster only (no warning state visible in approved screens) |
| `red-500` (error) | `#EF4444` | [SPEC] | Poster only |
| `blue-500` (info) | `#3882F6` | [SPEC] | Poster only |

## 2. Semantic Color Aliases

Aliases components consume; raw palette is never used directly in components. Mapping [DERIVED] from usage observed in the approved screens:

| Alias | Maps to | Observed usage |
|---|---|---|
| `--color-primary` | purple-700 | Primary actions, key figures (rates, maturity values) |
| `--color-primary-subtle` | purple-50 | Highlight fills, badges, result boxes |
| `--color-background` | white | Page sheet |
| `--color-surface` | white | Cards |
| `--color-surface-subtle` | surface-subtle `#F8F9FC` | Category/recommendation cards |
| `--color-surface-muted` | gray-100 | Inset fills (estimated-returns strip on product cards) |
| `--color-border` | gray-200 | All borders and dividers |
| `--color-text` | gray-900 | Headings, body emphasis |
| `--color-text-muted` | gray-500 | Secondary text, labels |
| `--color-text-placeholder` | gray-400 | Input placeholders |
| `--color-success` / `-warning` / `-error` / `-info` | semantic bases | Status, trust indicators |
| `--color-text-on-primary` | white | Text on primary buttons/hero card |

## 2a. Border Tokens — [SAMPLED]/[DERIVED]

| Token | Value | Source |
|---|---|---|
| `border-default` | 1px solid gray-200 `#E5E7EB` | [SAMPLED] chips, inputs, secondary buttons, key-info cards |
| `border-strong` | 1px solid gray-400 `#9CA3AF` | [DERIVED] focused/active input edge where ring alone is insufficient |
| `border-primary` | 1px solid purple-700 `#4B2E83` | [SAMPLED] selected states (active filter chip, selected compare card) |
| `divider` | 1px solid gray-100 `#F3F4F6` | [SAMPLED] row dividers in comparison table |

## 2b. Surface Tokens — [SAMPLED]

| Token | Value | Usage |
|---|---|---|
| `surface-page` | white `#FFFFFF` | Page sheet |
| `surface-card` | white `#FFFFFF` | Cards (with `elevation-1` + `border-default`) |
| `surface-subtle` | `#F8F9FC` | Recommendation/category cards |
| `surface-muted` | gray-100 `#F3F4F6` | Inset fills (estimated-returns strip) |
| `surface-brand` | purple-700 `#4B2E83` | Hero rate card, primary buttons |
| `surface-brand-subtle` | purple-50 `#F1EBFB` | Highlights, badges, result boxes |

## 2c. Text Tokens — [SAMPLED]/[SPEC]

| Token | Value | Usage |
|---|---|---|
| `text-primary` | gray-900 `#111827` | Headings, emphasized body |
| `text-secondary` | gray-500 `#6B7280` | Labels, meta, supporting copy |
| `text-placeholder` | gray-400 `#9CA3AF` | Input placeholders |
| `text-brand` | purple-700 `#4B2E83` | Rates, key figures, links/active nav |
| `text-on-brand` | white `#FFFFFF` | Text on primary surfaces |
| `text-success` | green-600 `#16A34A` | Trust/positive indicators |

## 2d. Focus Tokens — [TED] (values engineering-defined; behavior mandated by Document 14 §6)

| Token | Value |
|---|---|
| `focus-ring-color` | purple-700 `#4B2E83` |
| `focus-ring-width` | 2px |
| `focus-ring-offset` | 2px |

Focus rings are always visible on keyboard focus (`:focus-visible`), never removed without an accessible alternative.

## 2e. Component Token Mapping — [DERIVED] (consumed by Phase 1 component implementation)

| Component | Tokens |
|---|---|
| Button / primary | `surface-brand`, `text-on-brand`, `radius-md`, `button-md/lg`, `focus-ring-*`, hover: `elevation-1` + darkened brand (Phase 1 validated) |
| Button / secondary | `surface-card`, `border-default`, `text-primary`, `radius-md`, `button-md` |
| Card (FD product) | `surface-card`, `border-default`, `radius-card`, `elevation-1` → `elevation-2` on hover, padding `space-6` |
| Filter chip | `surface-card`, `border-default`, `text-secondary`, `radius-full`, height `button-sm`; selected: `border-primary`, `text-brand`, `surface-brand-subtle` |
| Badge / tag | `surface-brand-subtle`, `text-brand`, `radius-full`, `text-caption`; semantic variants use semantic bases |
| Input / search | `surface-card`, `border-default`, `radius-md`, `input-md/lg`, `text-placeholder`, `focus-ring-*` |
| Accordion | `surface-card`, `border-default`, `radius-card` (container), `divider` between items |
| Pagination | `button-sm` squares, `radius-sm`; active page: `border-primary` + `surface-brand-subtle` + `text-brand` (outlined — corrected 2026-07-30 to match the approved Marketplace UI, which supersedes the earlier filled-purple note) |
| Comparison highlight cell | `surface-brand-subtle`, `text-brand` |

## 3. Typography Scale — [SPEC]

Font family: **Inter** (client decision 2026-07-30), fallback `system-ui, sans-serif`.

| Token | Size / Line height | Weight | Usage |
|---|---|---|---|
| `text-h1` | 32px / 40px | Bold 700 | Hero/page headings |
| `text-h2` | 24px / 32px | SemiBold 600 | Sub headings |
| `text-h3` | 18px / 28px | SemiBold 600 | Section titles |
| `text-body-lg` | 16px / 24px | Regular 400 | Lead copy |
| `text-body` | 14px / 20px | Regular 400 | Default text |
| `text-caption` | 12px / 16px | Regular 400 | Labels, meta |
| `text-numeric` | 20px+ / tight | Bold 700 | Rates and key values (`7.75%`, `₹1,07,978`); tabular numerals enabled [DERIVED — prevents layout shift in financial figures] |

## 4. Font Weights — [SPEC]

`regular 400` · `medium 500` [DERIVED — needed for buttons/nav emphasis visible in UI] · `semibold 600` · `bold 700`.

## 5. Spacing Scale — [SPEC] (8px grid)

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px [DERIVED — visible in chip/badge padding; consistent with 4px base] |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

## 6. Border Radius

| Token | Value | Source |
|---|---|---|
| `radius-sm` | 8px | [DERIVED] small elements, grid-aligned |
| `radius-md` | 10px | [SAMPLED] buttons/inputs measured ≈11px at render scale (~10px at design scale) |
| `radius-lg` | 16px | [DERIVED] intermediate step |
| `radius-card` | 20px | [SPEC] "Rounded corners 20px for softness" |
| `radius-full` | 9999px | [SAMPLED] pills: filter chips, benefit chips, badges |

## 7. Elevation Tokens — [TED]

Poster specifies "soft shadow for elevation, white background, minimal borders" but no values. PNG sampling cannot recover blur/spread reliably. Temporary Engineering Defaults, validated in Phase 1 against the approved UI:

| Token | Value | Usage |
|---|---|---|
| `elevation-0` | `none` | Flat surfaces, inset fills |
| `elevation-1` | `0 1px 2px rgb(17 24 39 / 0.04), 0 4px 12px rgb(17 24 39 / 0.06)` | Resting cards |
| `elevation-2` | `0 2px 4px rgb(17 24 39 / 0.05), 0 10px 24px rgb(17 24 39 / 0.10)` | Hovered/raised cards |
| `elevation-overlay` | `0 16px 48px rgb(17 24 39 / 0.18)` | Modals, drawers, popovers |

## 8. Icon Sizes — [DERIVED] (8px grid; poster shows ~24px line icons)

`icon-sm 16px` · `icon-md 20px` · `icon-lg 24px` · `icon-xl 32px` (feature/trust icons).

## 9. Button Heights — [DERIVED from grid + measurement]

Measured primary CTA ≈55px at 1921px render (≈40–44px at design scale). Grid-snapped:

| Token | Value | Usage |
|---|---|---|
| `button-sm` | 32px | Compact contexts (tables) |
| `button-md` | 40px | Default (card actions: View details / Compare) |
| `button-lg` | 48px | Hero CTA, booking actions |

Minimum touch target 44×44px [SPEC — Document 14 §10]: `button-sm` reserved for pointer-dense desktop contexts.

Button's fourth size, `icon`, is 44×44px square and reuses `--ds-touch-target-min` — **no new token** (T2.7.8a). It exists because the `ghost` variant has no surface of its own, and a control whose label is its icon still needs a hit area.

## 10. Input Heights — [DERIVED]

`input-md 44px` (default; meets touch target) · `input-lg 48px` (hero search bar, calculator — matches visual weight in approved screens). Search-bar panel uses white bg, gray-200 border, gray-400 placeholder [SAMPLED].

## 11. Breakpoints — approved decisions (2026-07-30)

| Token | Value | Columns [SPEC] |
|---|---|---|
| mobile | 320–767px | 4 |
| `bp-md` (tablet) | ≥768px | 8 |
| `bp-xl` (desktop) | ≥1200px | 12 |

## 12. Container Widths — [DERIVED from 12-col/1200px grid spec]

`container-max 1200px` · content gutter `24px` (mobile `16px`). Product-detail content column `~920px` observed [SAMPLED, informational — implemented as a narrower prose container in Phase 2].

## 13. Z-Index Layers — [TED] (ordering per Document 05 §15 overlay system)

| Token | Value | Layer |
|---|---|---|
| `z-base` | 0 | Content |
| `z-sticky` | 100 | Sticky header/action bars |
| `z-dropdown` | 200 | Menus, selects |
| `z-overlay` | 300 | Scrim behind modals/drawers |
| `z-modal` | 400 | Modals, drawers, bottom sheets |
| `z-popover` | 500 | Popovers/tooltips above modals |
| `z-toast` | 600 | Toasts — always top |

## 14. Motion Durations — [TED] (Document 13 §14: short durations)

`duration-fast 150ms` (hover/focus feedback) · `duration-base 200ms` (default transitions) · `duration-slow 300ms` (overlays, drawers). All motion honors `prefers-reduced-motion` [SPEC — Document 14 §16].

**`duration-pulse 1500ms`** — [TED], approved 2026-07-30 (T1.11). Exists **solely for loading placeholders** (skeletons and any future placeholder surface), deliberately much slower than the interaction durations so the effect remains visually quiet. Consumed only by the generic `animate-pulse-soft` utility. To be validated during visual review.

## 15. Transition Easings — [TED]

`ease-out cubic-bezier(0, 0, 0.2, 1)` (enter — default) · `ease-in cubic-bezier(0.4, 0, 1, 1)` (exit) · `ease-in-out cubic-bezier(0.4, 0, 0.2, 1)` (movement/resize).

## 16. Opacity Scale — [TED]

`opacity-disabled 0.5` · `opacity-muted 0.7` · `opacity-hover-overlay 0.04` · `opacity-scrim 0.5` (overlay backdrop, on gray-900).

---

## Resolved Decisions (2026-07-30)

1. **Primary purple = `#4B2E83`.** The approved Marketplace UI is the final source of truth; the Design System poster is treated as outdated where conflicts exist.
2. **Temporary Engineering Defaults** ([TED]: elevation, z-index, motion, easings, opacity, focus values) adopted provisionally; each is validated against the approved UI during Phase 1 component reviews.
3. Border, Surface, Text, Focus, and Component Token Mapping sections added (§2a–2e) per client refinement before implementation.
