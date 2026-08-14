# Platform Component Library

Project: FD Investment Platform
Status: **Component Library — Complete** (T1.1–T1.12) · Phase 1 — In Progress
Last Updated: 2026-07-30

The eleven platform components in `src/components/ui`. All are domain-agnostic, token-only, and reviewable at `/gallery` (dev-only route). This document is the Document 07 §17 deliverable: purpose, usage boundaries, props, variants, and accessibility notes per component.

**Universal rules.** Every component: styles resolve exclusively to design tokens (`docs/engineering/design-tokens.md`) — no hex values, no arbitrary values, no Tailwind default palette; variants defined with CVA; `forwardRef` with typed props extending the native element; `className` for layout placement only, never repainting internals; WCAG 2.2 AA semantics; responsive at the approved breakpoints (`md` 768px, `xl` 1200px).

---

## Button — `button.tsx` · gallery `#button-variants`

**Purpose.** The single button for the platform: every action in the approved UI (Invest Now, View details, Compare, Search, Calculate, Continue to Booking).
**Use when** the user triggers an action. **Not for** navigation-only links styled as text, or toggling filters (that is Chip).
**Props.** `variant` `primary|secondary|outline` · `size` `sm|md|lg` · `asChild` · `loading` · `leftIcon` · `rightIcon` · native button attributes · ref → `HTMLButtonElement`.
**Accessibility.** Native button semantics; token focus ring; `loading` sets `aria-busy`, disables interaction and hides the spinner from screen readers; icons decorative (`aria-hidden`); disabled uses real `disabled` plus a layered muted palette (never opacity alone).

## Input — `input.tsx` · `#input-states`

**Purpose.** The platform text control: search, amounts, calculator fields, all future forms.
**Use when** collecting single-line text/numeric input. **Not for** selection from a fixed list (that is Select).
**Props.** `size` `md|lg` · `invalid` · `loading` · `prefix` · `suffix` · native input attributes · ref → `HTMLInputElement` (React Hook Form compatible).
**Accessibility.** Wrapper carries the visual field so the focus ring encloses prefix/suffix; `invalid` sets `aria-invalid`; `loading` sets `aria-busy`; disabled/read-only restyle from native attributes. Consumers own `id` + `<label htmlFor>` and `aria-describedby`; label/description/error composition belongs to the future `components/forms` layer.

## Card — `card.tsx` · `#card-variants`

**Purpose.** The core content surface (Document 06 §6 card philosophy): product cards, key-info panels, compare columns.
**Use when** grouping related content on a raised surface. **Not for** interactive behavior — Card is never clickable itself.
**Props.** `Card` (`variant` `default|elevated|outlined`) · `CardHeader` · `CardTitle` (renders `<h3>`) · `CardDescription` · `CardContent` · `CardFooter` (layout-only).
**Accessibility.** Semantic, non-interactive regions; no ARIA; `CardTitle` preserves heading hierarchy; interactivity lives in child components.

## Badge — `badge.tsx` · `#badge`

**Purpose.** Display-only status/label pill: trust badges (RBI Regulated, DICGC Insured, AAA Rating), highlight flags, benefit tags, numeric labels.
**Use when** labelling something. **Never** when it toggles or is clickable — that is Chip.
**Props.** `variant` `brand|success|neutral|outline` · `size` `sm|md` · `leftIcon` · `rightIcon` · ref → `HTMLSpanElement`.
**Accessibility.** Semantic `<span>`, no ARIA, no keyboard behavior; icons decorative; meaning must be in the text.

## Chip — `chip.tsx` · `#chip`

**Purpose.** Interactive filter pill: the Bank / Tenure / Interest Rate / Amount filters and removable active-filter tags.
**Use when** the pill toggles state. **Not for** static labels (Badge).
**Props.** `selected` · `disabled` · `size` `sm|md` · `leftIcon` · `rightIcon` · `removable` · `onRemove` · ref → `HTMLButtonElement`.
**Accessibility.** `<button type="button">` with `aria-pressed`; Enter/Space native. `removable` renders a chip *group* — a styled span containing the toggle and a **sibling** remove button (`aria-label="Remove filter"`), because nesting buttons is invalid HTML.

## Select — `select.tsx` · `#select`

**Purpose.** The platform dropdown: tenure pickers, filters, settings.
**Use when** choosing one option from a known list. **Not for** free text (Input) or multi-select (not yet approved).
**Props.** `options: {value,label,disabled?}[]` · `size` `md|lg` · `placeholder` · `invalid` · `disabled` · `loading` · `value`/`defaultValue`/`onValueChange` · `name`/`id`/aria attributes · ref → trigger. Low-level parts (`SelectRoot/Trigger/Content/Item/Value`) are exported for future composed cases.
**Accessibility.** Radix combobox/listbox semantics, arrow keys, Enter, Escape, Home/End, typeahead, focus restoration — all unmodified. `invalid` → `aria-invalid`; `loading` → `aria-busy`; chevron decorative.

## Accordion — `accordion.tsx` · `#accordion`

**Purpose.** Disclosure sections: Product Details, Interest Breakdown, FAQs, Terms & Conditions, future Portfolio sections.
**Use when** progressively disclosing content. **Not for** navigation.
**Props.** Standard Radix composition — `Accordion` (`type` `single|multiple`, `collapsible`, `value`/`defaultValue`/`onValueChange`) · `AccordionItem` (`value`, `disabled`) · `AccordionTrigger` · `AccordionContent`.
**Accessibility.** Radix: Enter/Space, ArrowUp/Down, Home/End roving focus, `aria-expanded`/`aria-controls`, labelled `role="region"` content, real `<h3>` header per item.
**Motion.** `animate-expand-down` / `animate-collapse-up` with padding on an inner element so measured height matches rendered height (no end-of-animation jump).

## Dialog — `dialog.tsx` · `#dialog`

**Purpose.** The modal foundation: confirmations, pickers, future auth and settings flows.
**Use when** a task requires focused interruption. **Not for** transient feedback (Toast).
**Props.** Ten exports: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`.
**Accessibility.** Radix: focus trap, focus restoration to trigger, Escape and overlay-click close, `role="dialog"` + `aria-modal`, `aria-labelledby`/`aria-describedby` via Title/Description (always render a Title), body scroll lock. Close button has a real accessible name.
**Layering.** Overlay `--ds-z-overlay`, panel `--ds-z-modal`; scrim via `overlay-scrim`; viewport caps via `overlay-viewport-height/width`; independent fade on overlay and panel.

## Toast — `toast.tsx` · `#toast`

**Purpose.** Transient feedback: success confirmations, error notifications, informational messages.
**Use when** feedback should not interrupt. **Not for** decisions requiring acknowledgement (Dialog).
**Props.** Seven exports: `ToastProvider`, `ToastViewport`, `Toast` (`variant` `success|error|info`), `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`.
**Accessibility.** Radix polite live region ("Notifications (F8)"), auto-dismiss with pause on hover and focus, keyboard and swipe dismissal. `ToastAction` composes the platform Button via `asChild` and requires `altText`.
**Note.** No application-wide toast manager exists yet; consumers render Provider/Viewport. A platform provider is a future approved task.

## Pagination — `pagination.tsx` · `#pagination`

**Purpose.** Numbered page navigation (`‹ 1 2 3 4 ›`).
**Use when** paging a collection. **Presentation-only:** no URL/`searchParams` sync, no router integration, no data awareness, no page-size assumptions.
**Props.** `currentPage` · `totalPages` · `onPageChange` · `disabled` · `className` · ref → `HTMLElement`. No `siblingCount`, no ellipsis — the approved UI shows the full range.
**Accessibility.** `<nav aria-label="Pagination">` + `<ul>/<li>`; `aria-current="page"` on the active item (its accessible name is the visible number); icon-only prev/next carry explicit labels and are genuinely `disabled` at the range boundaries.
**Active-page style.** Outlined (brand border + brand-subtle fill + brand text) per the approved Marketplace UI — see design-tokens §2e.

## Skeleton — `skeleton.tsx` · `#skeleton`

**Purpose.** Loading placeholder (Document 13 §16 — skeletons over spinners).
**Use when** content shape is known before data arrives; size skeletons to match real content so no layout shift occurs.
**Props.** `className` + native div attributes · ref → `HTMLDivElement`. No variants, no size props — shape comes from composition (`h-4 w-32`, `size-10 rounded-full`, `h-40 w-full`).
**Accessibility.** `aria-hidden="true"` by default. Announce loading once at the container level: `<div role="status" aria-live="polite"><span className="sr-only">Loading…</span>…</div>`. The gallery card skeleton is the reference implementation for Marketplace loading screens.

---

## Slider — `slider.tsx` · `#slider-radio-cards`

**Purpose.** Single bounded numeric value the user scrubs rather than types (T3.2.3). First consumer: Booking's tenure rail.
**Use when** the value is continuous-ish and its position within a range is itself meaningful. **Do not use** for an unbounded amount — that is `Input`.
**Built on** native `input[type=range]`, so arrow/Home/End keys, `role="slider"`, live `aria-valuenow`/`min`/`max`, pointer capture and form participation all come from the browser. No dependency added.
**Props.** `value` `min` `max` `step` `label` `labelHidden` `valueText` `caption` `disabled` + native input attributes · ref → `HTMLInputElement`.
**Accessibility.** `label` is required and bound via `htmlFor`. `valueText` → `aria-valuetext`, because "24" and "24 Months" are different announcements and only the consumer knows the unit. Focus ring via `focus-ring`.
**Styling.** Track and thumb live in `globals.css` under `.ds-slider` — vendor pseudo-elements are unreachable from utility classes. The fill is a gradient driven by the `--ds-slider-fill` custom property, so nothing has to be kept in sync with the thumb. Thumb transition only; the fill is never animated. 44px hit area below `md`.
**Edge case covered.** `min === max` (a product offering one tenure) does not divide by zero.

---

## RadioCardGroup — `radio-card-group.tsx` · `#slider-radio-cards`

**Purpose.** One choice from a small set where each option needs an icon, a title and a line of explanation (T3.2.3). First consumer: Booking's interest payout options.
**Use when** a plain radio list would not carry enough meaning. **Do not use** for multi-select — that is a group of `Chip`s.
**Built on** a `<fieldset>` + `<legend>` + real `input[type=radio]`, so the whole group is one Tab stop with arrow-key movement inside it — the behaviour div-based implementations most often get wrong. No `aria-*` attribute appears in the file.
**Props.** `label` `labelHidden` `labelAdornment` `options` (`{ id, title, description?, icon?, disabled? }`) `value` `onChange` `name` `className`. Generic over the option id type, so consumers keep their own union.
**Accessibility.** The legend is the group's accessible name. The radio is restyled but never hidden: it keeps its box and its focus, and the ring is drawn on the whole card via `has-[:focus-visible]` using the token shorthand `Input` already uses. Selection is signalled by border, fill **and** a tick — never colour alone.
**Responsive.** Stacks below `md`, three across from `md`; full-width cards keep targets past 44px.

---

## Motion inventory (project record)

Exactly five animation primitives exist. **No additional animation primitives may be introduced during Phase 1 without explicit approval.**

| Keyframe | Utility | Consumers |
|---|---|---|
| `ds-expand-down` | `animate-expand-down` | Accordion (any future Collapsible) |
| `ds-collapse-up` | `animate-collapse-up` | Accordion |
| `ds-fade-in` | `animate-fade-in` | Dialog overlay + panel, Toast |
| `ds-fade-out` | `animate-fade-out` | Dialog overlay + panel, Toast (incl. swipe end) |
| `ds-pulse` | `animate-pulse-soft` | Skeleton (any future placeholder) |

All durations/easings come from motion tokens; the global `prefers-reduced-motion` rule collapses every animation to an immediate state change.

## Shared utilities

`cn()` (`src/lib/utils.ts`) — the only class-composition helper; extended so token type-scale utilities are not mistaken for colors. Global utilities: `focus-ring`, `container-page`, `container-detail`, `overlay-scrim`, `overlay-viewport-height`, `overlay-viewport-width`, `overlay-panel-max-w`, plus the five animation utilities above. Global component styles: `.ds-slider` (T3.2.3) — the one place vendor pseudo-elements are styled, because utility classes cannot reach them.

## Dependencies (all exact-pinned)

Runtime: `@radix-ui/react-accordion 1.2.20` · `@radix-ui/react-dialog 1.1.23` · `@radix-ui/react-select 2.3.7` · `@radix-ui/react-slot 1.3.3` · `@radix-ui/react-toast 1.2.23` · `class-variance-authority 0.7.1` · `clsx 2.1.1` · `lucide-react 1.28.0` · `tailwind-merge 3.6.0` · `zod 4.4.3` · `next 15.5.22` · `react`/`react-dom 19.1.0`.
