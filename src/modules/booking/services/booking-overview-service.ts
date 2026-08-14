import {
  createProductMasterRepository,
  type ProductMasterRepository,
} from '@/services/product-master';
import type { ProductMaster } from '@/types/product-master';
import { publishedTenure, toWholeMonths } from '@/utils/finance';

import { BOOKING_OVERVIEW_FIXTURE } from '../fixtures/booking-overview';
import type { BookingOverview, DemoTermId, SelectedDeposit } from '../types/booking';
import { resolveBookingOverview } from '../utils/deposit-catalogue';

/**
 * Resolving the deposit a customer is booking, for **any** catalogue product.
 *
 * ## The problem this closes
 *
 * `BOOKING_OVERVIEWS_BY_PRODUCT_ID` holds one hand-authored deposit. Every
 * documented scenario recommends several — UC2 alone names four — so all but one
 * recommendation reached Booking's not-found boundary. Authoring twenty-five
 * fixtures by hand would have meant inventing twenty-five sets of partner copy.
 *
 * Instead the deposit is **derived from the product the customer actually
 * chose**: bank, rate, tenure and minimum come from `ProductMaster`, which is
 * the same source the recommendation priced. Nothing is substituted — the id in
 * the URL is the id that is loaded, and if the catalogue does not have it,
 * Booking still fails closed.
 *
 * ## What is real and what is demo
 *
 * **Real, from the catalogue:** `productId`, bank (including rating and
 * category), `interestRate`, `tenureMonths`, `minInvestment`, and the rate card
 * entry for the term the product actually publishes.
 *
 * **Demo placeholders, declared as such:** `maxInvestment`, `tenureRange`,
 * payout options, premature-withdrawal terms, auto-renewal, `tagline` and
 * `highlights`. The catalogue publishes none of them.
 *
 * They are not presented as bank terms. Every one is listed in `demoTerms`, and
 * the summary builders render those rows as **"Not published"** rather than as
 * a figure the bank has agreed to. The values are kept only so the screens have
 * something structurally valid to lay out; nothing reads them as a term.
 *
 * ⚠️ **No financial claim is fabricated.** The rate card carries **only** the
 * term the product publishes, so no tenure is offered at a rate no bank quoted —
 * the rule `booking-overview.ts` already states, applied to every product.
 *
 * ## Why the hand-authored fixture still wins
 *
 * `fd-002` keeps its curated entry: it is the approved artwork's deposit, with
 * real partner copy and a transcribed disclosure set. Derivation is the
 * fallback for everything else, not a replacement for what Design signed off.
 *
 * Replaced wholesale by `GET /bookings/overview?productId=…` when it exists;
 * this is the seam that endpoint slots into.
 */

/**
 * The terms a derived deposit cannot publish.
 *
 * Every field here is rendered as unpublished. The list is exhaustive over what
 * `DepositTerms` requires but `ProductMaster` does not carry — if the catalogue
 * later publishes one, it is removed here and the row starts showing a real
 * value with no other change.
 */
const DERIVED_DEMO_TERMS: readonly DemoTermId[] = [
  'max-investment',
  'tenure-range',
  'payout-options',
  'premature-withdrawal',
  'auto-renewal',
  'tagline',
  'highlights',
] as const;

/** Structural stand-ins only — every one is declared in `DERIVED_DEMO_TERMS`. */
const DEMO_TERMS = BOOKING_OVERVIEW_FIXTURE.deposit.terms;
const DEMO_DEPOSIT = BOOKING_OVERVIEW_FIXTURE.deposit;

/**
 * One catalogue product as a bookable deposit.
 *
 * Exported for verification: the mapping is assertable without a repository,
 * a network call or a React tree.
 */
export function toBookingOverview(product: ProductMaster): BookingOverview {
  const { terms } = product;
  const tenureMonths = terms.tenureMonths;

  /*
    The rate card carries exactly one entry — the term this product publishes —
    and only when that term is expressible in whole months. A deposit priced in
    days (91 days) has no month-based tenure to offer, so it publishes none
    rather than being rounded into one.
  */
  const monthEquivalent = toWholeMonths(publishedTenure(terms));
  const tenureRates =
    monthEquivalent === null ? [] : [{ tenureMonths: monthEquivalent, annualRate: terms.baseRate }];

  const deposit: SelectedDeposit = {
    productId: product.productId,
    productName: product.name,
    /* Structural placeholder — declared demo, never rendered as a bank claim. */
    tagline: DEMO_DEPOSIT.tagline,
    bank: product.bank,
    isPreferredPartner: false,
    about: `${product.bank.name} Fixed Deposit. Rate, tenure and terms are confirmed with the bank before your booking is placed.`,
    highlights: DEMO_DEPOSIT.highlights,
    terms: {
      interestRate: terms.baseRate,
      tenureMonths,
      minInvestment: product.minInvestment,
      /* Demo defaults — the catalogue publishes none of the following. */
      maxInvestment: DEMO_TERMS.maxInvestment,
      tenureRange: DEMO_TERMS.tenureRange,
      tenureRates,
      payoutOptions: DEMO_TERMS.payoutOptions,
      supportedPayouts: DEMO_TERMS.supportedPayouts,
      prematureWithdrawal: DEMO_TERMS.prematureWithdrawal,
      autoRenewal: DEMO_TERMS.autoRenewal,
    },
    demoTerms: DERIVED_DEMO_TERMS,
  };

  return {
    deposit,
    assurances: BOOKING_OVERVIEW_FIXTURE.assurances,
    importantInformation: BOOKING_OVERVIEW_FIXTURE.importantInformation,
    investmentInformation: BOOKING_OVERVIEW_FIXTURE.investmentInformation,
    nominationInformation: BOOKING_OVERVIEW_FIXTURE.nominationInformation,
    nextStep: BOOKING_OVERVIEW_FIXTURE.nextStep,
  };
}

export interface BookingOverviewService {
  /** The deposit for this id, or `null` when no such product exists. */
  findByProductId(productId: string): Promise<BookingOverview | null>;
}

export function createBookingOverviewService(
  repository: ProductMasterRepository = createProductMasterRepository(),
): BookingOverviewService {
  return {
    async findByProductId(productId: string): Promise<BookingOverview | null> {
      /*
        The curated deposit first: `fd-002` is the approved artwork's product and
        carries real partner copy that derivation cannot reproduce.
      */
      const curated = resolveBookingOverview(productId);
      if (curated) return curated;

      const product = await repository.findById(productId);

      /*
        Fails closed, exactly as before. An unknown id returns `null` and the
        route takes its not-found boundary — no substitute deposit, ever.
      */
      return product === null ? null : toBookingOverview(product);
    },
  };
}
