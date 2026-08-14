# Motion UX Specification — Goal-Based FD

**Source of truth for behaviour:** `FD_PoC_Rule_Based_Use_Cases_for_Founding_Tech_Team.pdf`, reviewed in `docs/features/goal-based-fd/12-client-source-conformance.md`.
**This document changes no business rule, rate, calculation, recommendation logic or ordering.** Motion is an enhancement layer over a journey that already works.
**UX references:** ICICI iWish, FPSB India — principles only. Nothing copied.

---

## 1. Technology determination

The question asked was whether the existing five CSS primitives are sufficient. **Almost.** Two gaps, sized honestly:

| Need | Verdict |
|---|---|
| Fade, translate, colour, hover, focus, press, stagger | **CSS is sufficient today** — already in `globals.css` |
| Enter/exit transitions | **CSS is sufficient now.** `@starting-style` + `transition-behavior: allow-discrete` reached Baseline in Aug 2024 and run in all four engines |
| **`height: auto` transitions** | **CSS is not sufficient cross-browser.** `interpolate-size` / `calc-size()` are Chromium-only — no Firefox, no Safari |
| FLIP layout displacement | Not required. Nothing in this specification needs it |

**Decision: no motion library.** The gap is closed by one generic `useMeasuredHeight` hook feeding a CSS custom property, consuming the same `--ds-expand-height` mechanism the Accordion already uses. Framer Motion and GSAP are both rejected — not because they are incapable, but because a ~15 KB dependency and a second motion language buy one hook's worth of behaviour in a codebase that has deliberately shipped zero UI libraries.

**The vocabulary stays small and closed:** fade · subtle translate · height expand/collapse · staggered reveal. Nothing else is added. No bounce, scale, spin, parallax, glow, particles, confetti, GIF, Lottie or decorative chart.

---

## 2. Specification

Every animation, in `Surface → User action → Motion → Purpose → Duration → Reduced motion` form. Easing is `ease-out` on enter, `ease-in` on exit, `ease-in-out` on height — the existing tokens, no exceptions.

### 2.1 Home — Goal Selection

| User action | Motion | Purpose | Duration | Reduced motion |
|---|---|---|---|---|
| Section enters viewport | Three columns reveal in sequence — fade + 8 px rise | Draws the eye to the strongest UX moment on Home without a card grid | 200 ms, 60 ms apart | Appear together, no rise |
| Hover / focus a column | Surface → `surface-subtle`; icon `content-muted` → `content-brand` | *"This is one interactive target, and it is a goal"* | 150 ms | Instant |
| Press (touch) | Surface → `surface-muted` | Touch parity — no hover exists on mobile | 100 ms | Instant |
| **Select a goal** | Chosen column holds its active state; siblings fade to `opacity-muted` | **"What did I just choose?"** — the choice is narrowed, not erased. The product responds to intent before the page changes | 150 ms | Instant, end state still applies |
| Select a goal | Navigation dispatched **in parallel** | Motion never queues navigation | — | Unchanged |

**Static:** all text, icon size, column height, hairline dividers, heading, footer link. No lift, no shadow, no scale — any of those would turn one surface into three cards.

### 2.2 Planner — question transitions

| User action | Motion | Purpose | Duration | Reduced motion |
|---|---|---|---|---|
| Arrive with `?goal=` | Header, trail and first question reveal in sequence | The goal feels carried in, not re-asked | 200 ms, 60 ms apart | Appear together |
| Answer a question | Question column height animates to the next question's height | **The height is the continuity.** Without it the trail jumps and the planner reads as separate pages | 200 ms | Snaps |
| Answer a question | Outgoing question fades out; incoming fades in + 8 px rise | Progression, not replacement | 150 ms out / 200 ms in | Instant swap |
| Answer a question | Answered step appears as a trail row | **Visible proof the answer was kept** — the trail's entire justification | 200 ms | Appears instantly |
| Answer a goal | Acknowledgement reveals below the trail | *"What does the product need to know?"* — it restates the rule that will actually run | 200 ms | Appears instantly |
| Press *Change* | Row leaves the trail, question returns | A reopened step is not data loss | 150 ms | Instant |
| Transition completes | Focus moves to the new question's label | Keyboard users never stranded on a removed control | — | Identical |

**Static:** the `Stepper` — a progress indicator must be readable the instant it changes. Also the heading, back link, `PlanMark`, and every `Change` affordance. Question content never animates internally.
**Rejected:** horizontal slide and page-turn. A left/right axis implies a wizard pushing the user through, contradicting the fact that editing preserves later answers.

### 2.3 Finding → Recommendation

Revealed in the client's own information hierarchy: **what was selected → expected return/maturity → why it fits → safety/disclosure → supporting options.**

| User action | Motion | Purpose | Duration | Reduced motion |
|---|---|---|---|---|
| Answers complete, catalogue in flight | Existing `animate-pulse-soft` bars, driven by **real** `isFetching` | A calm system state. Not a spinner, not fake thinking | 1500 ms loop | Loop stops |
| Results arrive | Heading → best-fit shell → MaturityFlow → reasons → **safety note** → alternatives | The narrowing is expressed as sequence: the system's reasoning made legible | 200 ms each, 60 ms apart, **≤ 320 ms total** | All at once |
| Results arrive | **Safety note is present at first paint — never staggered, never delayed** | Client-mandated disclosure. A note that arrives after the CTA can be acted past | 0 ms | Identical |
| Results arrive | CTA clickable from mount | The user acts on the answer before the explanation finishes | — | Identical |
| Results arrive | Alternatives stagger in reading order, capped at 5 steps | Scannable list, not a block | 200 ms, 60 ms apart | All at once |

**Required test, not an edge case:** a cached catalogue means `isFetching` never becomes true and the finding state never renders. The reveal must be correct from a cold mount. **Nothing may be added to force the finding state to appear** — no `setTimeout`, no minimum display time, ever.
**Static:** every figure. Also the eyebrow (no shimmer), bank badge (no spin), CTA (no pulse), and the status copy — one honest line, no cycling messages, no "Analysing 24 deposits".

### 2.4 MaturityFlow

| User action | Motion | Purpose | Duration | Reduced motion |
|---|---|---|---|---|
| Recommendation reveals | *You invest* → *For* → *Estimated maturity* reveal in order, chevrons fading between them | **The order is the explanation:** this much, held this long, becomes this. The relationship, not decoration | 200 ms each, 60 ms apart across five members — last figure settles ≈ 440 ms | All at once |

> **This is the one sequence that exceeds the 320 ms budget, and it is a deliberate exception.** The five members are three cells and two connectives, so the maturity figure is necessarily last. It was tempting to drop the stagger for that reason — a financial figure should never be made to wait. It survives because *nothing here is actionable*: the CTA and the coverage note are both painted instantly (§2.3), so the sequence delays only the reading of a figure that is already labelled *Estimated*, never the ability to act on it. If that ceases to be true, the stagger goes.

Direction follows the existing layout — left-to-right from `sm`, top-to-bottom below it.
**Static — and this is the point:** the numerals. **No chart, no curve, no bar, no progress fill, no growth animation.** The engine produces exactly two figures, in and out; drawing anything between them would render values that do not exist.

### 2.5 Target status — specified, blocked

Unreachable today: `assessTarget` and `TARGET_ADJUSTMENTS` are complete and match the client's UC3 remedies verbatim, but **nothing collects a target amount**. Applies the day that input lands (conformance §4).

| User action | Motion | Purpose | Duration | Reduced motion |
|---|---|---|---|---|
| Enter a valid target | Status region expands to measured height | Progressive disclosure — the region does not exist until it has something to say | 200 ms | Snaps open |
| Target met | Confirmation line reveals | A calm confirmation. One line | 200 ms | Instant |
| Target missed | Gap statement reveals, **then** remedies stagger in | The problem is read before the responses to it | 200 ms, 60 ms apart | All at once |

**Static:** the gap figure. **No animation may visually close or shrink the gap** — that would imply a shortfall is more surmountable than it is, contradicting `R-TARGET-003`.
**Prohibited:** confetti, celebration, trophy, badge, colour flare. `achieved` is an arithmetic comparison, not an achievement, and the figure is already labelled *Estimated*.

### 2.6 Allocation — first-class, blocked

Two of the client's three use cases need a multi-bank split; it is blocked on a configured concentration limit. When built: **total → each leg with its reason → combined maturity**, 60 ms apart. Each leg reveals *with its reason*, because the client's principle is understanding why an allocation is suitable — a sequence of bare amounts explains nothing.

---

## 3. Guardrails

| Concern | Rule |
|---|---|
| Accessibility | No animation delays focus, blocks a control, or is the sole carrier of information. Focus rings never animate. Announcements fire on state change, not on animation completion |
| Keyboard | Every transition is fully interactive while running. Focus follows the question |
| Performance | `opacity` and `transform` only, plus one scoped height transition. No layout thrash, no measurement in a render path |
| Financial clarity | No figure animates as a figure. No sequence implies growth or certainty the engine did not produce. Mandatory disclosures are never animated |
| Actionability | No sequence may delay an element the customer can act on. The CTA and the coverage note carry no entrance at all; only inert, already-qualified reading matter is ever sequenced |
| Architecture | No rule, rate, route, store or recommendation ordering modified. No component rebuilt where a wrapper suffices |
| Honesty | No artificial delay, anywhere, for any reason |

**The product principle:** motion communicates progress, confidence, hierarchy and continuity. It never communicates fake thinking, fake calculation, unnecessary loading, or gamification.

---

## 4. Implementation

**Tokens** (`design-system/tokens/motion.css`, `[TED]`): `--ds-duration-stagger: 60ms`, `--ds-reveal-distance: 8px`.

**Primitives** (`globals.css`, joining the existing five): `animate-reveal`, `ds-stagger` (capped at 5 steps), `ds-auto-height`.

**Hook** `src/hooks/use-measured-height.ts` — generic, domain-free: measures content with `ResizeObserver`, survives content changes and rapid toggles, cleans up its observer, and no-ops under `prefers-reduced-motion`.

**Component** `src/components/motion/auto-height.tsx` — the one wrapper consuming the hook. May not import from `modules`, `services` or `store`.

**Order of work — functional requirements first:**

1. Deposit-insurance note in the recommendation — client-mandated, content only *(done with this pass, since §2.3 reveals it)*
2. Target-amount input — client UC3, engine already complete **← highest-value remaining functional gap**
3. Multi-goal session — client UC2 input side
4. Allocation / concentration cap — **blocked on the client**
5. Senior-citizen rate delta — **blocked on catalogue data**

Motion never displaces items 2–5.

---

## 5. Sources

- Client — `FD_PoC_Rule_Based_Use_Cases_for_Founding_Tech_Team.pdf` (source of truth)
- [Baseline: animating entry effects](https://web.dev/blog/baseline-entry-animations) · [`interpolate-size` support](https://caniuse.com/mdn-css_properties_interpolate-size)
- ICICI Bank — [iWish](https://www.icici.bank.in/personal-banking/deposits/iwish) · FPSB India — [Goal-based Financial Planning](https://india.fpsb.org/goal-based-financial-planning/) (UX principles only)
