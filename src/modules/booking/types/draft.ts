import type { BookingStepId } from './booking';
import type { NomineeConfiguration } from './nominee';

/**
 * The booking draft — Booking's feature state (T3.2.2).
 *
 * `docs/engineering/09_State Management Strategy.md` §6 names exactly this:
 * Booking owns *"Current Step · Entered Details · Confirmation Status"*. §3
 * classifies it as **Feature State**, §4 assigns feature state to
 * "Custom Hooks / Context", and §5 forbids module data in the global Zustand
 * store. That is why this is a module context and not a store slice.
 *
 * ## What is deliberately absent
 *
 * **No maturity amount, no interest, no resolved rate.** Document 09 §10 is
 * explicit — *"Instead of storing Maturity Amount, store Deposit Amount,
 * Interest Rate, Tenure, then calculate when needed"* — and BR-INV-004 requires
 * recalculation on every change. A stored figure is precisely the stale
 * calculation that rule exists to prevent, and on a financial screen a stale
 * figure is not a performance detail.
 *
 * **No current step.** The route already says which step the user is on, and
 * Document 09 §2 forbids multiple copies of one fact. `furthestStep` is a
 * different fact — the high-water mark, used for guards and resume — and that
 * one is genuinely state.
 *
 * **No sensitive values.** Nothing here is PII. Screens 3 and 4 collect PAN,
 * date of birth and account numbers, which Document 19 §Security requires to be
 * protected at rest; the standing policy (plan §3.4, OQ-8) is that the draft
 * carries *identifiers of saved entities* and never raw sensitive values. This
 * type is the place that policy is enforced, by not having the fields.
 */
export type PayoutOptionId = 'at-maturity' | 'monthly' | 'quarterly' | 'half-yearly' | 'annual';

/**
 * What the Details phase collects.
 *
 * Every field is nullable because "not yet chosen" and "chosen as zero" are
 * different states, and a numeric field that defaults to 0 cannot tell them
 * apart. Validation happens at the boundary (`investment-schema.ts`), not here:
 * a draft is allowed to be incomplete — that is what makes it a draft.
 */
export interface InvestmentConfiguration {
  amount: number | null;
  tenureMonths: number | null;
  payoutOption: PayoutOptionId | null;
}

/**
 * How the customer pays (spec 21g §5B).
 *
 * Platform vocabulary, like `PayoutOptionId` — the ids a partner bank
 * configuration would narrow, once one exists.
 */
export type PaymentMethodId = 'net-banking' | 'upi' | 'debit-card' | 'credit-card' | 'neft-rtgs';

/**
 * The declarations Review & Confirm requires (spec 21f §5F, §8 Rule 3).
 *
 * Two booleans rather than one: the artwork draws two checkboxes making two
 * different statements — that the details are correct, and that the terms are
 * accepted — and a single flag could not record that a user ticked one.
 *
 * §5F says only declarations required by regulation or a partner bank should be
 * mandatory. Both drawn declarations are treated as mandatory because both
 * appear ticked on the approved screen and no source distinguishes them.
 */
export interface DeclarationConfiguration {
  detailsConfirmed: boolean;
  termsAccepted: boolean;
}

/**
 * What is known once payment has been submitted (specs 21g–21i).
 *
 * **Deliberately not a maturity figure, an interest total or a rate.** The rule
 * from Document 09 §10 that keeps those out of `InvestmentConfiguration` applies
 * with more force after payment, not less: Success displays a maturity estimate,
 * and it must be *recalculated* from amount, tenure and the resolved rate rather
 * than read from a snapshot that could disagree with the deposit on screen.
 *
 * What is here is what genuinely cannot be recomputed — an identifier, and when
 * it happened.
 */
export interface BookingConfirmation {
  /** Minted once, on payment. See `utils/booking-reference.ts`. */
  reference: string;
  /** Epoch ms. Drives the "Investment Date" the Success screen states. */
  paidAt: number;
  /**
   * When the partner bank confirmed, or `null` while Processing is still under
   * way.
   *
   * Null rather than absent so the two states are distinguishable on a refresh:
   * a booking that has been paid for but not yet confirmed must resume on
   * Processing, not on Success.
   */
  confirmedAt: number | null;
}

export interface BookingDraft {
  /** Scopes the draft. A different product is a different booking. */
  productId: string;
  investment: InvestmentConfiguration;
  /**
   * The saved funding account, **by id** (spec 21e).
   *
   * An identifier, never the account itself — the standing policy stated above,
   * applied. The account number, holder name and IFSC live in the account list;
   * the draft records only which one was chosen, so a persisted draft carries no
   * banking detail at all.
   */
  bankAccountId: string | null;
  /** Spec 21f §8 Rule 3 — progression is blocked until these are accepted. */
  declarations: DeclarationConfiguration;
  paymentMethod: PaymentMethodId | null;
  /** `null` until payment is submitted. */
  confirmation: BookingConfirmation | null;
  /**
   * The nominee section (T3.3.1) — **in memory only, never persisted.**
   *
   * This is the "No sensitive values" rule above being applied rather than
   * merely stated. A nominee's name and date of birth are PII about a third
   * party who has consented to nothing, and Document 19 §Security requires such
   * data to be protected at rest.
   *
   * Spec 21d §5B anticipates *Saved Nominees*, which the draft could reference
   * by id — but the approved artwork shows none, so there is no identifier to
   * store in place of the raw values.
   *
   * `draft-storage.ts` omits this key on write and restores it empty on read.
   * The visible consequence, stated plainly: **a refresh clears entered nominee
   * details.** That narrows FR-SYS-002's auto-save promise for this step alone,
   * and widening it again is a compliance decision rather than an engineering
   * one.
   */
  nominee: NomineeConfiguration;
  /**
   * The furthest step reached, for guards and resume (BR-BOOK-002 forbids
   * skipping states; FR-SYS-001 requires restoring interrupted sessions).
   */
  furthestStep: BookingStepId;
  /** Epoch ms. Drives expiry on read — see `DRAFT_MAX_AGE_MS`. */
  updatedAt: number;
}

/**
 * The shape written to storage. Versioned so a future change fails closed.
 *
 * **`nominee` is excluded at the type level** (T3.3.1), not merely omitted by
 * the code that assembles the payload. `Omit` makes the policy a compile error
 * rather than a convention: a future edit that tries to persist the nominee
 * section fails to typecheck, which is the only kind of rule that survives the
 * person who wrote it.
 */
export interface PersistedBookingDraft {
  version: 2;
  draft: Omit<BookingDraft, 'nominee'>;
}
