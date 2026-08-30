# Three banks, one booking flow — DBS integration report

**Date:** 30 August 2026
**Scope:** extending the FD marketplace from SBI + AU Small Finance Bank to SBI + AU + DBS Bank India.

---

## 1. What changed, in one sentence

DBS was added as **data** — a bank record, catalogue products, and one application
template — plus two genuine capability gaps the DBS form exposed: conditional
fields, and a checkbox control. No DBS-specific flow, screen, store or branch
exists anywhere in the codebase.

## 2. The source document

`public/bank-forms/dbs/dbs-fixed-deposite-form.pdf` — *Fixed/Recurring Deposit
form (including Nomination Form DA1)*, form code **TDA_AOF/001/July25**, 4 pages.
Read page by page. It is a **scanned document with no AcroForm fields**; nothing
in this build claims otherwise, and nothing writes into it. The application screen
links to it so a customer can read the original.

## 3. The finding that shaped the template

DBS's form asks for **no PAN number, no date of birth, no address, no mobile and
no email**. It identifies the applicant by the **CIF ID the bank fills in**, plus
a name beside the signature — it is written for someone who is already a DBS
customer (*"Debit existing DBS A/C No."*).

SBI's and AU's forms open an account *and* a deposit, so both ask for all of the
above. The DBS template therefore asks for none of it. Borrowing SBI's identity
block to make the three banks look uniform would have been the platform
inventing a bank's requirement.

## 4. Master field matrix — the three banks

| Concept | SBI | AU | DBS | Classification |
|---|---|---|---|---|
| Applicant name | ✓ | ✓ | ✓ | **A** — canonical (`identity`) |
| Date of birth | ✓ | ✓ | — | A, where asked |
| PAN | ✓ (masked) | ✓ (masked) | — | A, where asked |
| Address / mobile / email | ✓ | ✓ | — | A, where asked |
| Deposit amount | ✓ | ✓ | ✓ | **B** — booking-managed (`investment`) |
| Tenure | ✓ | ✓ | ✓ | B |
| Rate | ✓ | ✓ | ✓ | B |
| Interest / payout option | ✓ | ✓ | ✓ | B |
| Currency | — | — | ✓ | **C** — canonical deposit fact (INR) |
| Nominee name / relationship / DOB | ✓ | ✓ | ✓ | A (`nominee`) |
| Nominee address | — | ✓ (mandatory) | ✓ | **D** — bank-specific, manual |
| Nominee mobile, city, state, PIN | — | ✓ | — | D |
| Funding bank / account / IFSC | ✓ | ✓ | ✓ (conditional) | A (`bank-account`) |
| Maturity instruction | ✓ | ✓ | ✓ (own wording) | D — same question, three vocabularies |
| Customer type (7 options) | — | — | ✓ | D |
| TDS applicable, PAN applicable | — | — | ✓ | D |
| Form 60 / Form 15G–15H undertaking | — | — | ✓ (conditional) | D |
| Payment mode, mode of operation | ✓ (partial) | ✓ (partial) | ✓ | D |
| Number of receipts | — | — | ✓ | D |
| Nominee name on advice | — | — | ✓ | D |
| CIF ID, branch, SOL, RM, employee code, CSM | — | ✓ (some) | ✓ | **E** — bank-only, never asked |

**A** = canonical, asked once, reused. **B** = owned by Investment Details,
stated not asked. **C** = a fact about the deposit. **D** = bank-specific,
declared in that bank's template. **E** = the bank's own boxes.

## 5. Nothing DBS-specific leaked upward

`ApplicationField.source` gained no member. `SelectedDeposit`, `BookingDraft`,
`PortfolioHolding` and the product DTO are unchanged. The only additions to
shared code are two capabilities that are not about DBS at all:

- `visibleWhen` on `ApplicationField` — conditional visibility.
- a rendered `checkbox` control — the field type already existed in the union
  and nothing had ever rendered it.

## 6. Conditional fields — resolved in the schema, not the renderer

Four questions on the DBS form branch, and the schema branches with them:

| Governing answer | Reveals |
|---|---|
| PAN applicable = **No** | Form 60 undertaking |
| TDS applicable = **No** | Form 15G / 15H undertaking |
| Maturity = **renew principal, repay interest** | Renewal term |
| Maturity payment = **NEFT / RTGS** | Account number + IFSC |
| Payment mode = **debit my account** | Account number |

Hidden means **absent**, not greyed out. `resolveApplication` drops a hidden
field before statuses are computed, so it cannot appear in `outstanding`, cannot
fail validation, and cannot inflate "N fields still need your input". A
screen-level `if` would have hidden the field while leaving it outstanding — a
form the customer cannot finish and cannot see why.

An answer left behind by an abandoned branch does not resurrect the field.
Asserted.

## 7. The editability regression — checked, on all three banks

The previous defect: a prefilled field became static text the moment it had a
value, so the AU nominee address accepted exactly one character and then had no
input left. The fix (a customer field is *always* an input) was already in place;
this work adds the journey that would catch it returning. For **every text input
on every bank's form**, the journey types a value, re-queries the DOM, types a
second different value, and asserts the element is still an input holding the
second value. 6 assertions, all passing.

## 8. DBS catalogue — what is documented and what is not

| Product | Attribute | Source |
|---|---|---|
| Flexi FD, **374 days** | tenure | ⚠ stated on the DBS form |
| Flexi FD, **₹10,000** minimum | minimum | ⚠ stated on the DBS form |
| Tax Saver, **5-year lock-in** | tenure | ⚠ stated on the DBS form |
| Tax Saver, **₹1,50,000** limit | limit | ⚠ stated on the DBS form — *see §9* |
| Simple interest under 6 months, quarterly compounding at 6 months and above | pricing | ⚠ stated on the DBS form |
| **Every rate** | — | **Demonstration figure chosen by the platform** |

The DBS form publishes no rates: *"refer the latest interest rate chart at the
branch or visit www.dbsbank.com"*. Every DBS rate in this build is the
platform's own demonstration figure. The application form says so **on the rate
field, where the customer reads it** — and nothing anywhere states or implies
that DBS published or confirmed a rate. Both are asserted, in units and in the
journey.

## 9. Two things I could not model honestly

**The ₹1,50,000 tax-saver limit is not enforced.** The product model has no
`maxInvestment` concept — `src/constants/booking.ts` records that inventing one
was deliberately refused — and the pre-existing HDFC tax-saving product carries
no cap either. Adding a cap for DBS alone would be a product rule invented in a
fixture. **Flagged, not implemented.**

**The 5-year lock-in is not enforced.** The platform has no lock-in or
premature-withdrawal model. Same reasoning.

Both are product decisions, not engineering ones.

## 10. A side effect of adding a bank, disclosed

The catalogue generator distributes its 18 placeholder products by
`index % banks.length`. Adding DBS to the bank list therefore **redistributed
which bank each generated product belongs to**. The six approved seeds and every
product the client document names are declared explicitly and are unaffected —
the units suite asserts all nine documented bank/tenure/rate combinations still
exist, and they do.

One documented output did move, legitimately: **UC3's four-bank allocation.** DBS's
demonstration 5-year rate (7.4%) beats IDFC FIRST's 7.2%, so the engine now
places a leg with DBS instead. That is the allocator correctly reading its own
catalogue. Rather than pin the assertion to a stale list, it was **split into two
stronger ones**: the documented figures are reproduced from the documented
catalogue, and the property that makes them right — highest eligible rate, one
leg per bank, split evenly, nothing better left on the table — is asserted
against the full catalogue.

## 11. Two defects found and fixed while wiring DBS up

1. **`checkbox` was an unimplemented member of `ApplicationFieldType`.** Any
   template using it silently rendered a free-text box, so "Form 60 will be
   submitted" could have been answered with arbitrary text. Now a real checkbox,
   with `CHECKBOX_ACCEPTED` pinned in the schema layer and the validator
   rejecting anything else.
2. **Booking-managed fields dropped their hint.** The rate is booking-managed,
   and the demonstration-rate disclosure lives on the rate field's hint — so the
   single most important sentence on the DBS form was invisible. Fixed; the
   journey asserts the word appears on the rendered page.

## 12. Verification — actual exit codes

| Command | Result |
|---|---|
| `tsc --noEmit` | **PASS** (exit 0) |
| `verify unit` | **PASS** — 2111 passed, 0 failed (exit 0) |
| `verify invariants` | **PASS** — 1166 passed, 0 failed (exit 0) |
| `verify boundaries` | **PASS** — 15 passed, 0 failed (exit 0) |
| `verify journeys` | **PASS** — 601 passed, 0 failed (exit 0) |
| `eslint --max-warnings 0 src verification` | **PASS** (exit 0) — see note |
| `next build` | **PASS** (exit 0) — see note |
| `prettier --check src verification` | **PASS** (exit 0) — see note |

**Note on where those three ran.** ESLint, `next build` and Prettier exceed the
tool time limit when run against the mounted working copy; ESLint alone was
killed at 170 s with no output. They were run instead against a byte-identical
copy of `src/` and `verification/` (verified with `diff -r`), with the same
`eslint.config.mjs`, `prettier.config.mjs`, `package.json` and `.env.local`, and
dependencies installed from the same `package-lock.json`. `next build` compiled
in 16.4 s and emitted all 40 routes including
`/booking/[productId]/application`. The exit codes above are real; the working
directory was a mirror, and that is stated rather than glossed.

## 13. Coverage added

- **Units** — DBS template shape; the five absent identity fields; no
  recurring-deposit question reaches an FD applicant; the demonstration-rate
  disclosure; six conditional-visibility cases; stale-answer behaviour; checkbox
  validation; library resolution derived from the templates rather than
  hardcoded; the completion loop extended to all three banks.
- **Invariants** — conditional visibility is declared on the field and resolved
  by the mapper, and the renderer, field control and screen decide no field's
  visibility.
- **Journey (P1)** — all three banks' application step mounted in a real DOM,
  composed exactly as the booking segment composes it (draft provider outside
  deposit provider, both keyed by `productId`): each form names its own bank,
  links to its own document, states that no submission route is connected,
  states the signature requirement, shows no full account number; the typing
  regression on every field; and the DBS conditional driven through the real
  select.

## 14. What is still not true, and is not claimed to be

No submission route to any bank. No bank confirmation, no KYC provider, no
government integration, no email or SMS. No agent identities. Every DBS rate is
a demonstration figure. The application is prepared on the platform and nothing
is filed with or sent to a bank — stated on the screen, not only here.
