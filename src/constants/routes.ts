import type { Route } from 'next';

/**
 * Typed route builders — the single source for <Link> targets and
 * router navigation (Document 04 §13, deep linking).
 * Never write route strings inline in components.
 *
 * `typedRoutes` is enabled, so `Route` is a union of the routes that exist.
 * A builder returns a template literal, which widens to `string` and is not
 * assignable to `Route`; the assertion below is the **one** place that gap is
 * bridged, exactly as `useMarketplaceUrlState` does for composed query
 * strings. Casting at each call site instead would put an unchecked assertion
 * next to every <Link> (M2.6, E4).
 *
 * `marketplace` has no page. It is a phantom: the approved UI renders the
 * listing inline on Home, so the navigation item labelled "Marketplace" already
 * points at `home`. Nothing links to it, and it is left as a plain string
 * rather than asserted into `Route`, so a component that tries to use it fails
 * to typecheck instead of shipping a 404.
 *
 * `compare` became real in T2.7.3 and is asserted. Note that a bare
 * `/compare` renders the empty state by design: on that route the URL *is* the
 * selection (contract C4), so any affordance navigating there must compose
 * `?ids=` from the store via `serialiseCompareIds`.
 *
 * `bookingOverview` is Booking's entry point (T3.1). The product id is carried
 * **in the path**, not in a session id: step one has no session yet — it is the
 * screen on which the user decides whether to start one — and a path that names
 * the product is resumable, shareable, and answerable without server state.
 * Later steps become siblings of `/overview` under the same product segment.
 */
export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  product: (productId: string) => `/marketplace/${productId}` as Route,
  compare: '/compare' as Route,
  /**
   * Booking's entry point, with the amount the entry flow already established.
   *
   * `productId` stays in the **path** — it is the booking's identity, and the
   * screen must be resumable and shareable by it. `amount` is an optional
   * **query** because it is a prefill rather than identity: two customers
   * booking the same deposit for different amounts are on the same screen, and
   * dropping the parameter must still produce a valid URL.
   *
   * Only Goal-Based FD and Comparison supply it, and only because both have
   * already asked the customer for it. Booking parses it through
   * `parseEntryAmount`, writes it into the canonical draft once, and validates
   * it against the product like any other amount. An absent or unusable value
   * changes nothing — see that module for why no fallback exists.
   *
   * **No rate, maturity or tenure may ever be added here.** Those are figures
   * Booking resolves for itself; an amount is the customer's own input. The
   * distinction is the whole reason this parameter is safe and those would not
   * be, and an invariant holds the query key list at exactly one.
   */
  bookingOverview: (productId: string, amount?: number) => {
    const query = amount === undefined ? '' : `?amount=${String(amount)}`;
    return `/booking/${productId}/overview${query}` as Route;
  },
  /**
   * Investment Details — step two, a sibling of `/overview` under the same
   * product segment (T3.2.7), exactly as `bookingOverview` anticipated.
   *
   * The segment is `investment-details` while the *step id* is `investment`.
   * They are allowed to differ and deliberately do: the step id is the
   * platform's internal vocabulary (`BOOKING_STEPS`, guards, resume), the
   * segment is the user-facing URL, and coupling them would mean a copy change
   * to a URL forced an edit to the state machine.
   */
  /**
   * Investor Verification — step two, a sibling of the rest (doc 07 Stage 3).
   *
   * The segment is `identity` while the step id is `identity` too; the word is
   * the customer's ("verify your identity"), not the regulator's. "KYC" appears
   * in no URL and on no button, because an abbreviation is exactly what an
   * older or first-time investor should not have to decode.
   */
  bookingIdentity: (productId: string) => `/booking/${productId}/identity` as Route,
  bookingInvestmentDetails: (productId: string) =>
    `/booking/${productId}/investment-details` as Route,
  /** Nominee — step three, a sibling of the two before it (T3.3.2). */
  bookingNominee: (productId: string) => `/booking/${productId}/nominee` as Route,
  /**
   * Steps four to eight, completing the approved journey.
   *
   * All five are siblings under the same `[productId]` segment, exactly as the
   * three before them — which is what makes this **one** booking flow rather
   * than two. Goal-Based FD and Comparison both end at `bookingOverview`, and
   * every step after it is reached the same way regardless of where the
   * customer came from.
   *
   * Segment names are the user-facing words; the step ids they correspond to
   * (`bank-account`, `review`, `payment`, `processing`, `success`) remain the
   * platform's internal vocabulary. `BOOKING_STEP_ROUTES` is the one bridge.
   */
  bookingBankAccount: (productId: string) => `/booking/${productId}/bank-account` as Route,
  /**
   * The partner bank's FD application — between Bank Account and Review.
   *
   * The segment is `application`, the customer's word. Which bank's form it is
   * comes from the deposit, not from the URL, so there is one route however
   * many institutions the library serves.
   */
  bookingApplication: (productId: string) => `/booking/${productId}/application` as Route,
  bookingReview: (productId: string) => `/booking/${productId}/review` as Route,
  bookingPayment: (productId: string) => `/booking/${productId}/payment` as Route,
  bookingProcessing: (productId: string) => `/booking/${productId}/processing` as Route,
  bookingSuccess: (productId: string) => `/booking/${productId}/success` as Route,
  /**
   * Goal-Based FD planner — the goal-led entry into the same booking journey.
   *
   * A **second entry point, not a second flow**: it ends at
   * `bookingOverview(productId)`, the route Marketplace already leads to
   * (`06-architecture.md` §2). Nothing about Booking changes because the user
   * arrived here instead of from a product card.
   */
  /**
   * The investor's holdings — the first surface where the product moves from
   * "I am booking an FD" to "I own one".
   */
  /** The notification centre, reachable from the header bell. */
  notifications: '/notifications' as Route,
  portfolio: '/portfolio' as Route,
  /**
   * Maturity Management — nested under Portfolio.
   *
   * A maturity is a question asked of a holding, so it lives inside the route
   * that owns holdings; the prefix match also keeps Portfolio the active
   * navigation item.
   */
  maturities: '/portfolio/maturities' as Route,
  /**
   * Reports & statements — nested under Portfolio for the same reason
   * maturities are.
   *
   * A statement is a **document about a holding**, so it belongs inside the
   * route that owns holdings; the prefix match also keeps Portfolio the active
   * navigation item. There is no top-level `/reports`, because a report that is
   * not about something the investor owns does not exist.
   */
  reports: '/portfolio/reports' as Route,
  /**
   * One document.
   *
   * The id is `kind--reference` (`fd-statement--FD-2026-0001`), built by
   * `documentId` and read back by `parseDocumentId`. It is in the **path**
   * because it identifies the document rather than configuring it: the URL must
   * be resumable and shareable, and an id that names no document the investor
   * holds resolves to an honest "not available" rather than an empty sheet.
   */
  report: (reportId: string) => `/portfolio/reports/${reportId}` as Route,
  /**
   * The bank account vault — top-level, not under Portfolio.
   *
   * An account belongs to the **customer**, not to the deposits they hold: it
   * funds a booking today and may serve other products later, so nesting it
   * under `/portfolio` would say something about it that is not true. Booking
   * links here to manage accounts; Portfolio links here as a quick action.
   */
  /**
   * The Family Dashboard — top-level, beside Portfolio.
   *
   * It spans members rather than belonging to one, so it is not nested under
   * `/portfolio`: a route that said "this family view is part of your portfolio"
   * would be describing the wrong relationship.
   */
  family: '/family' as Route,
  /**
   * Help & support.
   *
   * Top-level and reachable from every page, because the moment a customer
   * needs it is not a moment to go looking. The navigation item was reserved
   * and disabled from the first release; this is the route it was waiting for.
   */
  support: '/support' as Route,
  /**
   * Contacting support, optionally about something.
   *
   * The context is a **query parameter and a reference**, never a copy: a
   * deposit's bank reference or an account's opaque vault id, both of which the
   * screen resolves against the canonical domain. Nothing sensitive goes in the
   * URL — no PAN, no account number, no amount — and an unresolvable reference
   * falls back to general support rather than rendering a request about a
   * deposit that does not exist.
   */
  supportNew: (context?: { holding?: string; account?: string }) => {
    const params = new URLSearchParams();
    if (context?.holding !== undefined) params.set('holding', context.holding);
    if (context?.account !== undefined) params.set('account', context.account);

    const query = params.size === 0 ? '' : `?${params.toString()}`;
    return `/support/new${query}` as Route;
  },
  /** One request, by the number the customer quotes. */
  supportRequest: (requestId: string) => `/support/requests/${requestId}` as Route,
  bankAccounts: '/bank-accounts' as Route,
  bankAccountNew: '/bank-accounts/new' as Route,
  /**
   * One account.
   *
   * The id is opaque and carries **no part of the account number** — a URL that
   * ended in the digits every screen masks would undo the masking in the
   * address bar, in history and in any referrer.
   */
  bankAccount: (accountId: string) => `/bank-accounts/${accountId}` as Route,
  /**
   * The operations console.
   *
   * A **separate portal under one namespace**, not a section of the customer
   * product: it answers "what is happening across the platform", has its own
   * shell and its own navigation, and nothing in the customer experience links
   * into it. Every admin route lives under `/admin` so the boundary is visible
   * in the URL as well as in the code.
   */
  /**
   * Tax Center.
   *
   * Top-level rather than under `/portfolio`: it answers a question about a
   * *period* — what interest belongs to a tax year — rather than about what the
   * investor owns, and a future product's interest would appear on the same
   * page without the route saying anything about deposits.
   */
  tax: '/tax' as Route,
  admin: '/admin' as Route,
  adminCustomers: '/admin/customers' as Route,
  adminCustomer: (customerId: string) => `/admin/customers/${customerId}` as Route,
  adminApplications: '/admin/applications' as Route,
  adminApplication: (applicationId: string) => `/admin/applications/${applicationId}` as Route,
  adminProducts: '/admin/products' as Route,
  adminProduct: (productId: string) => `/admin/products/${productId}` as Route,
  /**
   * Verification operations.
   *
   * The segment is `verification`, not the abbreviation — the platform holds
   * "KYC" out of every URL, and an operations console is not a reason to make
   * an exception. The screen and the navigation say the same word.
   */
  adminVerification: '/admin/verification' as Route,
  adminSupport: '/admin/support' as Route,
  adminAudit: '/admin/audit' as Route,
  goalPlanner: '/goal-planner' as Route,
  /**
   * Multi-goal planning (client source document, Use Case 2).
   *
   * **One constant for one URL.** A second name — `multiGoalPlanner` — pointed
   * at this same path, which is the duplicate-source-of-truth problem in its
   * smallest form: two names drift the moment one of them is changed, and
   * nothing would have failed until a link quietly went somewhere else. Home's
   * multi-goal entry now reads this one.
   */
  goalPlannerPlan: '/goal-planner/plan' as Route,
} as const;
