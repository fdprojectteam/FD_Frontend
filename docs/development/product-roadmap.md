# FD Investment Platform — Product Roadmap Dashboard

Last updated: **2026-08-01** (M2.7 closed; post-audit UX refinements shipped)
Maintained by: automatic update on every task, milestone, or module change —
see §8.

> **Two numbering systems, deliberately kept apart.** This document uses the
> **product** phases (Phase 1–5, fourteen modules). The repository is organised
> by **engineering** phases: Phase 0 foundation → Phase 1 component library and
> data layer → Phase 2 Marketplace (M2.1–M2.9) → Phase 3 booking. The *Delivered
> by* column maps one to the other, so a status here can always be traced to
> code.

---

## 1. Product timeline

| #   | Module                           | Phase   | Status         | Progress | Delivered by            | Start | Target | Actual | Notes                                              |
| --- | -------------------------------- | ------- | -------------- | -------- | ----------------------- | ----- | ------ | ------ | -------------------------------------------------- |
| 1   | Authentication & User Management | Phase 1 | 🟢 Completed¹  | 100%     | *(outside this repo)*   | —     | —      | —      | ¹ **Unverified here** — no auth code in this repository |
| 2   | Bank Account Management          | Phase 1 | ⚪ Planned      | 0%       | —                       | —     | —      | —      | Pending                                            |
| 3   | Fixed Deposit Marketplace        | Phase 2 | 🟡 In Progress | **75%**  | M2.1–M2.6 ✅ · M2.8 ⚪ · M2.9 ⚪ | —     | —      | —      | Six of eight milestones signed off                 |
| 4   | FD Comparison                    | Phase 2 | 🟢 Completed   | 100%     | **M2.7** ✅              | —     | —      | —      | Audited 2026-08-01, all five gates green           |
| 5   | FD Booking                       | Phase 3 | ⚪ Planned      | 0%       | Phase 3                 | —     | —      | —      | **Next module**                                    |
| 6   | Mock FD Processing               | Phase 3 | ⚪ Planned      | 0%       | Phase 3                 | —     | —      | —      | Pending                                            |
| 7   | Portfolio Dashboard              | Phase 3 | ⚪ Planned      | 0%       | Phase 3                 | —     | —      | —      | First module behind the sidebar layout             |
| 8   | Maturity Management              | Phase 4 | ⚪ Planned      | 0%       | Phase 4                 | —     | —      | —      | Pending                                            |
| 9   | Tax Center                       | Phase 4 | ⚪ Planned      | 0%       | Phase 4                 | —     | —      | —      | Pending                                            |
| 10  | Family Dashboard                 | Phase 4 | ⚪ Planned      | 0%       | Phase 4                 | —     | —      | —      | Pending                                            |
| 11  | Notifications                    | Phase 4 | ⚪ Planned      | 0%       | Phase 4                 | —     | —      | —      | Pending                                            |
| 12  | Reports & Statements             | Phase 5 | ⚪ Planned      | 0%       | Phase 5                 | —     | —      | —      | Pending                                            |
| 13  | Customer Support Portal          | Phase 5 | ⚪ Planned      | 0%       | Phase 5                 | —     | —      | —      | Pending                                            |
| 14  | Admin Portal                     | Phase 5 | ⚪ Planned      | 0%       | Phase 5                 | —     | —      | —      | Pending                                            |

**Dates are owner-supplied and not yet provided.** The repository holds no git
history and the documents carry only "Last Updated" stamps, so every date column
is blank rather than estimated. Everything else on this page is derived from
repository evidence.

Module 3's 75 % is not an impression: the Marketplace product module is
delivered by eight engineering milestones (M2.1–M2.6, M2.8, M2.9) and six are
signed off.

---

## 2. Overall project progress

| Metric                          | Value                                     |
| ------------------------------- | ----------------------------------------- |
| Total modules                   | 14                                        |
| Completed                       | 2 *(1 verified in this repository)*       |
| In progress                     | 1                                         |
| Planned                         | 11                                        |
| **Overall completion**          | **20 %** *(13 % counting only verified work)* |

```
████░░░░░░░░░░░░░░  20%
```

Weighted by module progress: (100 + 0 + 75 + 100 + 0 × 10) ÷ 14 = 19.6 %.
Excluding the unverified Authentication module: 175 ÷ 14 = 12.5 %.

---

## 3. Current position

| | |
|---|---|
| **Current phase** | Phase 2 — Marketplace *(engineering Phase 2)* |
| **Current milestone** | **M2.7 — Comparison — complete**, audited, ready to close |
| **Current task** | None in flight. Last completed: post-audit UX refinements (touch targets, selection feedback, mobile peek, table spacing) |
| **Current sprint** | Not tracked in the repository |
| **Current focus** | Formal M2.7 sign-off, then M2.8 |
| **Next task** | M2.8 — cross-screen states: skeletons per layout, empty states, error states with retry, slow-network and 500 scenarios through MSW |
| **Next milestone** | **M2.8 — Cross-screen States**, then M2.9 — Final Marketplace Audit |
| **Expected completion date** | **Owner input required** — no dates in the repository |

### Blocking or awaiting you

- `npm run build` must be run locally for each future milestone; it cannot run
  in the agent environment.
- Eight M2.7 assumptions (A1–A7, A10) are carried **unconverted**; **A3** — a
  user comparing three products cannot open any of them — is a product decision.
- Thirteen manual browser checks are outstanding (`m2.7-audit.md` §10).

---

## 4. Phase timeline

```
Phase 1  █████░░░░░  50%   Auth ✅(unverified) · Bank Accounts ⚪
Phase 2  █████████░  88%   Marketplace 75% · Comparison 100%
Phase 3  ░░░░░░░░░░   0%   Booking · Processing · Portfolio
Phase 4  ░░░░░░░░░░   0%   Maturity · Tax · Family · Notifications
Phase 5  ░░░░░░░░░░   0%   Reports · Support · Admin
```

Phase 1 reads 50 %, not 100 %: Bank Account Management is a Phase 1 module and
has not started.

---

## 5. Milestones achieved

| Milestone | Scope | Evidence |
|---|---|---|
| **Phase 0** | Platform foundation, design tokens, shadcn re-theme | T0.1–T0.11, audited |
| **Phase 1** | Component library (12 primitives), public layout shell, data layer | T1.1–T1.14, audited |
| **M2.1** | Marketplace domain foundation *(no UI)* | Signed off |
| **M2.2** | Marketplace business components | Signed off |
| **M2.3** | Marketplace Home | Signed off |
| **M2.4** | Listing, pagination, sort, URL state | Signed off — defect C0 closed |
| **M2.5** | Search & filters | Signed off — 221 assertions |
| **M2.6** | Product Details | Signed off — 401 assertions |
| **M2.7** | **Comparison** | **Audited 2026-08-01 — 696 assertions, 0 failed; all five gates green** |

**M2.7 in detail** — eleven tasks: T2.7.0 documentation · T2.7.1a batch widened
· T2.7.1 row model · T2.7.2a/b URL authority · T2.7.2 `?ids=` state · T2.7.3
route and shell · T2.7.4 desktop table · T2.7.5 mobile carousel · T2.7.6 add
picker · T2.7.7 action bar · T2.7.3b Home entry · T2.7.8a build blockers ·
T2.7.8 audit · post-audit UX refinements.

Assertion growth across the milestone: **401 → 696**.

---

## 6. Upcoming roadmap

| Order | Module | Estimated duration | Depends on | Readiness |
|---|---|---|---|---|
| **Now** | Marketplace — M2.8 cross-screen states | *owner input* | M2.3–M2.7 | ✅ Ready |
| Then | Marketplace — M2.9 final audit | *owner input* | M2.8 | Blocked on M2.8 |
| **Next** | FD Booking | *owner input* | Comparison ✅ | ✅ Unblocked — `CompareActionBar`'s Proceed is inert and awaiting it |
| After | Mock FD Processing | *owner input* | Booking | — |
| After | Portfolio Dashboard | *owner input* | Booking | Needs the sidebar layout (not yet built) |
| After | Maturity Management | *owner input* | Portfolio | — |
| After | Tax Center | *owner input* | Portfolio | — |
| After | Family Dashboard | *owner input* | Portfolio | — |
| After | Notifications | *owner input* | All core modules | — |
| After | Reports & Statements | *owner input* | Portfolio | — |
| After | Customer Support Portal | *owner input* | Core platform | — |
| Last | Admin Portal | *owner input* | All modules | — |

**Phase 3 is not blocked by Phase 2.** Booking depends on Comparison, which is
complete. M2.8 and M2.9 finish the Marketplace module; they do not gate Booking.

---

## 7. The seven questions, answered

| Question | Answer |
|---|---|
| Where are we now? | Phase 2, milestone M2.7 complete and audited |
| Which module is being developed? | Fixed Deposit Marketplace (75 %) — M2.8 next |
| Which modules are complete? | FD Comparison (verified) · Authentication (recorded, not in this repo) |
| What comes next? | M2.8 cross-screen states → M2.9 audit → **FD Booking** |
| Expected completion timeline? | **Unknown — dates not yet supplied** |
| What percentage is complete? | **20 %** recorded · 13 % verified in code |
| Which milestones are achieved? | Phase 0, Phase 1, and M2.1–M2.7 — §5 |

---

## 8. Maintenance protocol

This document is updated **in the same change as the work it describes**, never
in a separate pass:

| Trigger | What changes |
|---|---|
| A task completes | §3 Current position, §5 if it closes a milestone |
| A milestone closes | §1 status and progress, §2 metrics, §4 phase bars, §5 milestones, §6 readiness |
| A module completes | §1 status → 🟢 with the actual date, §2 recount, §7 |
| An assumption becomes a decision, or a blocker appears | §3 *Blocking or awaiting you* |

**Rules that keep it honest.** Progress is computed from completed milestones,
never estimated. A status is only 🟢 when its gates are green and its audit is
recorded. Anything not verifiable in this repository is marked as such, as the
Authentication row is. Dates are never invented.
