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

export interface BookingDraft {
  /** Scopes the draft. A different product is a different booking. */
  productId: string;
  investment: InvestmentConfiguration;
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
  version: 1;
  draft: Omit<BookingDraft, 'nominee'>;
}
