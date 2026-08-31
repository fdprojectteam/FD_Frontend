import type { BookingOverview } from '../types/booking';

/**
 * Booking Overview fixture (T3.1) — **temporary, and deliberately conspicuous.**
 *
 * The screen is built against the shape the Booking API will return, not
 * against whatever was convenient to type. When the endpoints land, this file is
 * deleted and a service supplies the same `BookingOverview`; nothing above it
 * changes, because nothing above it knows where the object came from.
 *
 * **Why a module fixture and not MSW.** `@/mocks` is ESLint-banned outside the
 * mock layer, and rightly — application code must not know mocks exist. Adding
 * handlers now would also mean inventing the request/response contract before
 * the API specification is approved, which is the one thing the working
 * agreement forbids. A typed fixture inside the module states the shape without
 * pretending there is a transport, and it cannot leak into a production bundle
 * behind a service call that does not yet exist.
 *
 * ## The figures describe catalogue product `fd-002` (corrected 2026-08-11)
 *
 * **HDFC Bank, 7.25%, 12 months, ₹10,000 minimum** — the same product the
 * catalogue serves under `fd-002`, field for field on every identity and terms
 * value the two models share.
 *
 * They previously described the approved artwork's **Axis Bank, 7.25%, 24
 * months, ₹5,00,000** while still being keyed `fd-002`. Once Goal-Based FD began
 * recommending catalogue products and handing their ids to Booking, that made
 * the one resolvable id a **silent product substitution**: a customer
 * recommended "HDFC, 12 months, ₹1,00,000" arrived at a booking screen for
 * Axis, 24 months, minimum ₹5,00,000. Two screens, two products, one id, and
 * nothing on either screen saying so.
 *
 * The rate was already 7.25% in both, so only the bank, the tenure and the
 * minimum moved.
 *
 * **Consequence, stated rather than buried:** the approved Booking artwork draws
 * Axis Bank and 24 months. This fixture no longer matches that artwork. The
 * alternative was a handoff that shows a different product than the one
 * recommended, which is the more serious defect — but the artwork divergence is
 * real and needs Design/Product acknowledgement. It is fixture data only: no
 * layout, component or copy changed.
 *
 * Everything below that has no catalogue equivalent — `maxInvestment`,
 * `tenureRange`, payout options, premature withdrawal, auto-renewal, assurances
 * and the disclosure copy — is unchanged Booking demo data.
 *
 * Replaced by: `GET /bookings/overview?productId=…` (see the API integration
 * points in `docs/features/booking/analysis/18`).
 */
export const BOOKING_OVERVIEW_FIXTURE: BookingOverview = {
  deposit: {
    productId: 'fd-002',
    productName: 'HDFC Bank Fixed Deposit',
    /* Was "Secure • Trusted • Guaranteed Returns" — three claims, none established. */
    tagline: 'Fixed rate • Fixed term • Terms confirmed by the bank',
    bank: {
      id: 'hdfc',
      name: 'HDFC Bank',
      shortCode: 'HDFC',
      initials: 'HB',
      logoUrl: '/banks/HDFC-Bank-logo.svg',
      rating: 'AAA',
    },
    isPreferredPartner: true,
    /*
      Was: "Earn assured returns … Your investment is 100% secure and backed by
      the bank's strong financials and legacy of trust." Assured, 100% secure
      and a judgement about the bank's financials — none of which this platform
      has any basis for. What replaces it describes how a fixed deposit works,
      which is what a customer on this screen actually needs.
    */
    about:
      'A fixed deposit holds your money for an agreed term at a rate agreed up front. The rate does not change during the term, and the amount you receive at maturity is set by that rate, the term and how interest is paid out.',
    highlights: [
      { id: 'flexible-tenure', label: 'Choice of tenure' },
      { id: 'payout-options', label: 'Interest paid out or compounded' },
      { id: 'premature-withdrawal', label: 'Premature withdrawal, with terms' },
      { id: 'auto-renewal', label: 'Auto-renewal available' },
    ],
    terms: {
      interestRate: 7.25,
      tenureMonths: 12,
      minInvestment: 10_000,
      maxInvestment: 50_000_000,
      tenureRange: { minDays: 7, maxYears: 10 },
      /**
       * **One entry, deliberately** (T3.2.4b, decision of 2026-08-06).
       *
       * 24 months at 7.25% is the only tenure/rate pair this product actually
       * publishes — it is the figure on the approved screen and in the summary
       * panel. The six other tenures the artwork draws have **no published
       * rate**, and "Booking must not invent rates", so they are absent rather
       * than guessed.
       *
       * This is a data gap, not a modelling gap. When Product supplies the real
       * rate card, this array gains rows and the tenure control matches the
       * approved artwork with **no code change** — `selectableTenures` derives
       * the rail from exactly this list.
       *
       * Note what is *not* here: no 12-month or 36-month entry interpolated
       * from 7.25%, and no fallback to the headline rate for unpriced terms.
       * Either would put a number on screen that no bank has agreed to pay.
       */
      tenureRates: [{ tenureMonths: 12, annualRate: 7.25 }],
      payoutOptions: ['Monthly', 'Quarterly', 'Cumulative', 'At Maturity'],
      /**
       * The same four advertised strings, in platform vocabulary (T3.2.9).
       *
       * **Three ids, not four.** "Cumulative" and "At Maturity" are the partner
       * bank's two names for one thing — interest retained and compounded — so
       * they resolve to a single `at-maturity`. Rendering both would offer the
       * user the same deposit twice under different names.
       *
       * Derived from the line above rather than invented, and the result is the
       * three cards the approved artwork draws. Half-Yearly and Yearly exist in
       * the platform vocabulary but this product does not publish them, so
       * spec 21b §D keeps them off the screen.
       */
      supportedPayouts: ['at-maturity', 'monthly', 'quarterly'],
      prematureWithdrawal: 'allowed-with-terms',
      autoRenewal: true,
    },
  },
  /*
    Three things this build genuinely does. See `BookingAssuranceId` for what
    was here before and why none of it survived.
  */
  assurances: [
    {
      id: 'terms-first',
      title: 'Terms before you confirm',
      description: 'Rate, term and payout on the review step',
    },
    {
      id: 'no-credentials',
      title: 'No banking credentials',
      description: 'You are never asked for a password or PIN',
    },
    {
      id: 'demonstration',
      title: 'Demonstration build',
      description: 'No money moves and nothing reaches a bank',
    },
  ],
  importantInformation: [
    'Interest rates and terms are provided by the partner bank and are subject to change.',
    'Please review the latest rates on the bank’s website before investing.',
  ],
  /**
   * The Investment Details screen's four notes, **transcribed verbatim from the
   * approved artwork** (`FD_booking_investment_details_02.png`), not composed.
   *
   * They differ from Overview's two by design — that screen discloses where the
   * rates come from, this one discloses what happens to the money. Both are
   * legible in their respective artboards, so this is transcription from the
   * visual source of truth rather than invented copy.
   *
   * Flagged for confirmation at sign-off (open question OQ-7): the artwork is
   * authoritative for *what is drawn*, and final regulatory wording is
   * Compliance's to approve.
   */
  investmentInformation: [
    'Interest rates are subject to change.',
    'Premature withdrawal is allowed as per bank policy.',
    'TDS will be applicable as per Income Tax Act.',
    'Please review the terms & conditions before investing.',
  ],
  /**
   * The Nominee screen's four points, **transcribed verbatim from the approved
   * artwork** (`FD_booking_nominee_03.png`), not composed.
   *
   * Note the third line asserts that nomination is mandatory. That is the
   * artwork's own wording and is reproduced as copy — it is **not** wired to any
   * behaviour, because spec 21d §8 Rule 1 makes the requirement conditional on
   * the partner bank's policy, which the data does not carry. Flagged for
   * confirmation rather than implemented as a rule.
   */
  nominationInformation: [
    'Ensures quick settlement of deposit amount',
    'Reduces paperwork for your family',
    'Mandatory as per RBI guidelines',
    'You can modify nominee anytime before maturity',
  ],
  nextStep: 'Click “Continue” to enter your investment amount, tenure and payout preference.',
};

/**
 * The deposits Booking can resolve, keyed by product id.
 *
 * **This record is the seam.** Until now the Overview screen accepted a
 * `productId` and ignored it, rendering one hardcoded deposit whatever product
 * the user had come from. A lookup — even a lookup with one entry — is the
 * difference between a screen that *accepts* an id and a screen that *uses*
 * one, and it is what a product master or `GET /bookings/overview?productId=…`
 * replaces without anything above it changing.
 *
 * **Booking-owned deliberately.** The Addendum asks for a reusable product
 * master; this is not it and does not pretend to be. What it does is stop
 * Booking hardcoding a single product, which is the prerequisite for one.
 *
 * ## The id collision is resolved; the sparseness is not
 *
 * `fd-002` now describes the same product the catalogue serves under that id —
 * HDFC Bank, 7.25%, 12 months, ₹10,000 minimum. A Goal-Based FD recommendation
 * for `fd-002` hands off to a Booking screen for **that** deposit, and a unit
 * assertion compares the two models field by field.
 *
 * **What remains a data gap:** this record still holds **one** entry. Goal-Based
 * FD recommends from all 24 catalogue products, so 23 of 24 handoffs reach
 * Booking's not-found boundary — *"This deposit isn't available"*. That is
 * honest (Booking fails closed rather than substituting a deposit) but it is
 * not complete. Adding the other 23 means inventing `maxInvestment`,
 * `tenureRange`, payout options, premature-withdrawal terms and partner copy for
 * products that publish none of it — so they are absent rather than guessed,
 * and this stays a one-entry record until Booking has a real product source.
 *
 * Declared after the fixture because a `const` cannot be read before its own
 * initialiser has run.
 */
export const BOOKING_OVERVIEWS_BY_PRODUCT_ID: Record<string, BookingOverview> = {
  'fd-002': BOOKING_OVERVIEW_FIXTURE,
};
