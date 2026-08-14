# Motion & Visual Specification — Goal-Based FD

**Companion to** `motion-architecture.md`, which specifies the motion system and records the technology determination. That decision stands: **CSS + one measured-height hook. No Framer Motion, no GSAP.** Nothing in this document requires revisiting it — see §10.5.

**Source of truth for behaviour:** `FD_PoC_Rule_Based_Use_Cases_for_Founding_Tech_Team.pdf`. No business rule, calculation, data model, recommendation logic or plan ordering is changed. This is a UX layer only.

---

## 0. The grammar already exists

The planner ships one custom visual, `PlanMark`, and it encodes a vocabulary worth building on rather than replacing:

| Element | Means | Why |
|---|---|---|
| **Filled node** | A value the customer commits — **certain** | The amount they choose is a fact |
| **Open ring** | An outcome the platform projects — **an estimate** | Deliberately not solid: `Estimated maturity` is an illustration at today's rate, never a promise |
| **Path / arc** | Time passing between the two | The one dimension a deposit actually moves along |
| **Stroke opacity** | How far along the journey the customer is | Muted = not yet answered; full = answered |

That is a complete visual language for a fixed deposit, and it is already in the product. **Every visual below is that same grammar at a different scale.** Nothing new is invented, which is what makes Home, the planner header and MaturityFlow read as one product rather than three illustrations.

**The one rule that governs all of it:** a filled node is only ever drawn for a value the customer supplied. The platform never draws its own projection as solid.

---

## 1. Home — Goal Selection

**Structure is unchanged.** One calm surface, three columns, hairline dividers, no nested cards, no duplicate CTA, no chevrons. The mark replaces nothing — it sits where the lucide icon sits today.

### 1.1 What each mark depicts, and why it is not decoration

Each mark draws **the tenure rule that will actually run for that goal** (`GOAL_TENURE_PREFERENCE`). It is a picture of the platform's behaviour, not a mood:

| Goal | Rule that runs | Mark | Reading |
|---|---|---|---|
| **Emergency fund** | `shortest` | A filled node under a short protective arc that curves over and back down — a cover, closing quickly | Money held close and reachable soon |
| **Children's education** | `closest-to-horizon` | A rising path from a filled node to a **milestone marker** at a fixed point — a vertical tick on the path | A date is attached, and the platform aims at it |
| **Retirement** | `longest` | A long shallow arc reaching far right to an **open ring**, higher and further than the others | A distant outcome, and an estimated one |

The three share stroke weight, cap style and origin so they read as one family. Only the *shape of time* differs — which is the only thing that actually differs between the three goals.

### 1.2 Interaction

| State | Visual | Duration | Easing |
|---|---|---|---|
| **Idle** | Path drawn at `content-muted`, origin node hollow | — | — |
| **Hover / focus** | Path re-draws left-to-right via `stroke-dashoffset`; stroke → `content-brand`; whole mark rises 1px | 300 ms draw, 150 ms colour | `ease-out` |
| **Selected** | Draw held complete; origin node fills; stroke stays `content-brand`; siblings recede to `opacity-muted` | 150 ms | `ease-out` |

**The draw is the point.** A goal being understood is a line being completed — the same gesture the planner then repeats at full size in its header. Hover is a *preview* of that; selection *commits* it (the node fills).

**Prohibited:** bounce, spin, scale beyond the 1px rise, particles, confetti, colour cycling, and any motion on the label text.

---

## 2. Goal Planner — the journey visual

The header currently renders `PlanMark` at `h-16 w-24`, static. That space becomes the journey.

### 2.1 What it shows

Four nodes on one continuous path: **Goal → Amount → Time → Recommendation.** Not a flowchart — no boxes, no arrows, no labels. A path with stations on it.

| Node | Filled when | Why |
|---|---|---|
| 1 · Goal | A goal is chosen | Customer-supplied |
| 2 · Amount | An amount is entered | Customer-supplied |
| 3 · Time | A horizon is chosen | Customer-supplied |
| 4 · Recommendation | **Never — stays an open ring** | It is the estimate. Filling it would claim a certainty the engine does not have |

The path segment leading to each node draws when that node activates. The segment beyond the last answered node stays muted.

### 2.2 Progressive response

| Trigger | Visual | Duration |
|---|---|---|
| Goal selected | Node 1 fills; segment 1→2 draws | 300 ms |
| Amount entered | Node 2 fills; segment 2→3 draws | 300 ms |
| Horizon selected | Node 3 fills; segment 3→4 draws | 300 ms |
| Target entered *(when built)* | A small tick appears on the path before node 4 | 200 ms |
| **Finding** | Node 4 pulses on the existing `animate-pulse-soft` loop, **tied to real `isFetching`** | loop |
| **Recommendation** | Pulse stops; node 4's ring completes its stroke, staying open | 300 ms |

**No new state.** Progress is derived from `flow.answers` and `flow.stage`, which already exist. The visual is a pure function of the planner's state — it cannot drift from it, and it cannot delay it.

### 2.3 Restraint

It is `hidden md:block` — below `md` the questions own the width and the journey would be noise. Fixed `viewBox` with reserved dimensions, so no layout shift as nodes activate. Stroke opacity never exceeds the heading's contrast, so it can never compete with the question.

---

## 3. Question transitions

**Already implemented and unchanged** (`motion-architecture.md` §2.2): measured-height container, reveal on the incoming question, trail rows on `ds-stagger`, focus moved to the new label. The journey visual updates in the same frame as the trail row appears, so the header and the trail confirm the same answer at the same moment.

---

## 4. Finding → Recommendation

**Already implemented and unchanged** (§2.3): real `isFetching`, honest single-line copy, sequenced reveal in the client's hierarchy, coverage note and CTA painted instantly.

**Added:** the journey completes as described in §2.2. The completion is triggered by the query resolving — the same state change that renders the results. There is no timer, no minimum display time, and no way to show the completion without a real fetch having occurred.

**On a cached catalogue** `isFetching` never becomes true, node 4 never pulses, and the ring completes on mount. Correct, and required.

---

## 5. MaturityFlow

**Investigated, and yes — it should use the same grammar.** It currently renders two lucide chevrons between three cells. Chevrons say "next"; they do not say what kind of value each cell holds.

| Element | Now | Becomes | Gain |
|---|---|---|---|
| *You invest* | Label + figure | **Filled node** above the label | States the amount is certain |
| Connector | `ChevronRight` / `ChevronDown` | A drawn hairline segment | Time, in the same stroke language as the header |
| *For* | Label + figure | Small node on the path | The interval, not an endpoint |
| *Estimated maturity* | Label + figure | **Open ring** above the label | States the figure is a projection — reinforcing the word `Estimated` visually |

**This is a meaning improvement, not a restyle.** The certain/estimated distinction is currently carried by one word in a label; the grammar carries it in the shape.

**Motion:** the connector segments draw left-to-right as the row reveals — 300 ms, `ease-out`. Direction follows the existing responsive flip (down when stacked, right in a row).

**Unchanged:** the figures, the labels, the `Estimated` wording, the layout breakpoints, the tabular alignment. **No chart, no curve, no bar, no growth animation** — the engine produces two figures, and nothing may draw values between them.

> Note the exception already recorded in `motion-architecture.md` §2.4: this row's stagger runs past the 320 ms budget because the maturity figure is necessarily last. It is permitted only because nothing here is actionable — the CTA and coverage note paint instantly.

---

## 6. Target status

**Blocked and unbuildable** — `assessTarget` and `TARGET_ADJUSTMENTS` are complete and match client UC3 verbatim, but nothing collects a target amount (`12-client-source-conformance.md` §4). Specified for the day the input lands:

| Trigger | Visual | Duration |
|---|---|---|
| Valid target entered | Status region expands to measured height; a tick appears on the journey path before node 4 | 200 ms |
| Target met | Calm confirmation line; the tick sits **on** the path | 200 ms |
| Target missed | Gap stated first, then remedies stagger; the tick sits **beyond** node 4 — visibly not reached | 200 ms, 60 ms apart |

**The shortfall is never animated closed.** No motion may shrink, approach or resolve the gap: that would imply a shortfall is more surmountable than it is, contradicting `R-TARGET-003`. No confetti, trophy or celebration — `achieved` is an arithmetic comparison, not an achievement.

---

## 7. Mobile behaviour

| Surface | Mobile |
|---|---|
| Goal marks | Rendered at every width — they are the column's icon. Draw runs on `:active` as well as hover, since touch has no hover |
| Journey visual | **Not rendered below `md`.** The questions own the width; a decorative-looking header visual on a 360px screen competes with the thing being asked |
| MaturityFlow | Existing vertical stack; connectors draw top-to-bottom, following the layout |
| All marks | Fixed `viewBox`, intrinsic sizing from Tailwind classes — no measurement, no layout shift, no reflow as state changes |
| Touch targets | Unaffected. No mark is interactive; the column is the target and its size never changes |
| Performance | `stroke-dashoffset` and `opacity` only — both composited. No JS animation, no `requestAnimationFrame`, no timers |

---

## 8. Reduced-motion behaviour

Three independent guarantees, as before: the global CSS reset, `motion-safe:` variants on every animated class, and each visual's own end state being complete without motion.

| Surface | Reduced motion |
|---|---|
| Goal marks | Paths render **fully drawn** at rest. Hover/selection still change colour and fill the node — instantly. Nothing is lost: the mark's meaning is in its shape, never in the drawing of it |
| Journey visual | Nodes and segments appear in their current state with no draw. The pulse on node 4 stops |
| MaturityFlow | Connectors render fully drawn; cells appear together |
| Everything | **No information is carried by motion alone.** Every state is also in text, colour or shape |

The `stroke-dashoffset` starting value is applied by the `motion-safe` variant only, so under reduced motion the dash properties are never set and the path is simply a path.

---

## 9. Asset strategy

| Decision | Rule |
|---|---|
| **Format** | Inline SVG components only |
| **Colour** | `currentColor` and design tokens exclusively. No hex in any mark |
| **Files in `public/`** | **None.** Zero new network requests |
| **GIF / Lottie / PNG / stock illustration** | **Prohibited.** Not "avoided" — none may be added |
| **Icon library** | `lucide-react` stays for functional icons (Check, Pencil, ArrowRight). Marks are hand-drawn because lucide has no equivalent for "a short protective arc" or "a journey with four stations" |
| **Weight** | ~3 KB of JSX total, tree-shaken, server-rendered. No runtime cost |
| **Accessibility** | Every mark is `aria-hidden`. The adjacent text always carries the meaning — a decorative visual must never be the only source of information |

**Why hand-drawn SVG rather than an illustration set:** an illustration would have to be *chosen* to look like protection or growth. These are *derived* — each shape states a rule the engine runs. That is the difference between a picture on a financial product and a picture of one.

---

## 10. Implementation approach

### 10.1 New CSS primitive — one

```
@utility animate-draw   /* stroke-dashoffset → 0 over --ds-duration-draw */
```

Plus `--ds-duration-draw: 300ms` `[TED]` in `tokens/motion.css`. Draw is slower than the 200 ms base because a line completing must be legible as a line completing; 200 ms reads as a flicker. It is the only duration in the system above `slow`, and it applies to stroke only.

Vocabulary after this addition: fade · reveal · expand/collapse · pulse · stagger · **draw**. Closed again.

### 10.2 Components

| File | Purpose | Boundary |
|---|---|---|
| `src/components/business/goal-mark.tsx` | The three goal marks, selected by a `kind` prop | `components` — importable by **both** Marketplace and the goal module. Marketplace may not import the goal module, so a shared home is the only legal one |
| `src/modules/goal-based-fd/components/plan-mark.tsx` | Evolved in place into the progressive journey visual, taking a `progress` prop | Goal module. Rewritten rather than replaced, so no dead component is left behind |
| `src/modules/goal-based-fd/components/maturity-flow.tsx` | Chevrons → node/path grammar | Goal module |

### 10.3 State

**None is added.** `GoalEntryList` already holds the selected id for the de-emphasis. The journey's `progress` is computed in `GoalPlannerScreen` from `flow.answers` and `flow.stage` — both already read there. `usePlannerFlow` is not touched.

### 10.4 What is explicitly not done

- No change to any figure, rule, rate, calculation or ordering
- No change to the approved Marketplace, Compare or Booking screens
- No new library, no new dependency, no asset file
- No animation on any numeral, anywhere

### 10.5 Why CSS still suffices

`stroke-dashoffset` is a plain animatable CSS property; the draw is a transition on a number. Progressive node states are conditional class names on server-rendered SVG. Nothing here needs presence orchestration, FLIP, or interpolation to an intrinsic size. **The technology determination is unchanged, and this specification is evidence for it rather than against it.**

---

## 11. Definition of Done

- [ ] `npm run typecheck` and `npm run lint` clean
- [ ] `node verification/run.mjs` passes; existing Goal Planner journeys unchanged
- [ ] New invariants: no raster or animated asset added; no hex in any mark; marks are `aria-hidden`; the journey visual derives from planner state and holds none of its own
- [ ] Reduced motion: every path renders complete, every state still distinguishable
- [ ] No layout shift as any node activates (fixed `viewBox`, reserved box)
- [ ] Mobile: journey visual absent below `md`; goal marks legible and touch-responsive
- [ ] The open ring is never filled — asserted, not merely intended
