import { z } from 'zod';

import { emptyNomineeConfiguration } from '../constants/booking-draft';
import type { BookingDraft, PersistedBookingDraft } from '../types/draft';

/**
 * Booking draft persistence (T3.2.2).
 *
 * Satisfies FR-SYS-002 (auto-save without a manual save action), FR-CONF-002
 * (preserve configuration across navigation and refresh), FR-SYS-001 / BR-SYS-001
 * (restore interrupted sessions) and BR-REC-002 (preserve local progress through
 * an interruption).
 *
 * Pure and React-free, so the read/write rules are assertable without a DOM.
 *
 * **Why `sessionStorage` and not `localStorage`.** Document 19 classifies session
 * information as *Operational Data* with shorter retention, and a pre-payment
 * investment draft is exactly that. `localStorage` would leave a stranger's
 * deposit amount on a shared machine indefinitely — nothing requires that, and
 * BR-REC-001 ("restore the booking **after re-authentication**") argues against
 * it. A tab-scoped draft is the honest lifetime for money the user has not yet
 * committed.
 *
 * **Why a version prefix and a schema parse.** Stored shapes outlive the code
 * that wrote them. Reading is therefore a *parse*, not a cast: anything that
 * does not match returns `null` and the user starts clean, rather than a
 * half-valid object hydrating into a financial form. Failing closed is the only
 * safe direction here.
 */
const STORAGE_VERSION = 4;

/** Namespaced and versioned; one draft per product. */
export function draftStorageKey(productId: string): string {
  return `fd:booking-draft:v${STORAGE_VERSION}:${productId}`;
}

/**
 * Drafts older than this are discarded on read.
 *
 * Doc 13's timeout table expires a `Created` booking "after inactivity
 * threshold" without naming one. 24h is a **[TED — Temporary Engineering
 * Default]**, recorded as such rather than presented as a product rule, and is
 * one constant to change when the threshold is specified.
 */
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const payoutOptionSchema = z.enum(['at-maturity', 'monthly', 'quarterly', 'half-yearly', 'annual']);

const stepIdSchema = z.enum([
  'overview',
  'identity',
  'investment',
  'nominee',
  'bank-account',
  'application',
  'review',
  'payment',
  'processing',
  'success',
]);

/**
 * Amounts and tenures are bounded here as well as at the form boundary.
 *
 * Not duplication for its own sake: the form protects the *user* from a typo,
 * this protects the *application* from a hand-edited storage entry. They guard
 * different threats, so they are allowed to be two checks.
 *
 * **`amount` is `.int()` — whole rupees only.** The rupee is the smallest unit
 * this platform transacts in; a deposit of ₹5,00,000.50 is not something a bank
 * can book. Nothing in the UI can produce one — the amount field strips
 * non-digits and quick amounts are integers — but a hand-edited storage entry
 * or a future API could, and this is the boundary that exists to refuse it.
 *
 * **No `STORAGE_VERSION` bump is needed for this.** The schema only *narrows*:
 * every draft that was valid under the old rule and is still valid under the
 * new one parses unchanged, and the few that are not fail closed, which is the
 * behaviour already designed for. A version bump would discard good drafts to
 * announce a change that costs nothing.
 */
const paymentMethodSchema = z.enum([
  'net-banking',
  'upi',
  'debit-card',
  'credit-card',
  'neft-rtgs',
]);

/**
 * Version 2 adds the sections screens 4–8 fill in.
 *
 * **A genuine version bump, not a narrowing.** The rule stated above — that a
 * schema which only narrows needs no bump — does not apply here: these are new
 * required keys, so a v1 draft cannot satisfy v2 and would fail closed with no
 * explanation. Bumping the key means a v1 draft is simply not found, and the
 * customer starts a clean booking rather than resuming a half-shaped one.
 *
 * **Still no PII.** `bankAccountId` is a reference to a saved account, not an
 * account number; the account's holder name, IFSC and last four digits are
 * never written here. The nominee section remains excluded at the type level.
 */
const persistedSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  draft: z.object({
    /* The session this draft belongs to — see `BookingDraft.bookingId`. */
    bookingId: z.string().min(1),
    productId: z.string().min(1),
    investment: z.object({
      amount: z.number().int().positive().finite().nullable(),
      tenureMonths: z.number().int().positive().nullable(),
      payoutOption: payoutOptionSchema.nullable(),
    }),
    /*
      Version 3 adds identity confirmation. Two non-PII fields: when the
      investor confirmed, and by which route. The identity itself is never
      written here — it belongs to the Investor domain and is read from it.
    */
    /*
      Version 4 adds the application. Answers to fields nothing else owns, plus
      accepted declarations — no identity, nominee or account detail, which are
      read from their own owners each time the application is resolved.
    */
    application: z.object({
      /*
        No `answers`. A manual answer may be a third party's address or mobile
        number — AU's Form DA-1 requires both — and those follow the nominee's
        rule: held for the session, never written at rest.
      */
      acceptedDeclarations: z.array(z.string()),
      preparedAt: z.number().int().nonnegative().nullable(),
      identityMethod: z
        .enum(['existing-kyc', 'ckyc', 'digilocker', 'aadhaar-ekyc', 'video-cip', 'assisted'])
        .nullable(),
    }),
    identity: z.object({
      confirmedAt: z.number().int().nonnegative().nullable(),
      method: z
        .enum(['existing-kyc', 'ckyc', 'digilocker', 'aadhaar-ekyc', 'video-cip', 'assisted'])
        .nullable(),
    }),
    bankAccountId: z.string().min(1).nullable(),
    declarations: z.object({
      detailsConfirmed: z.boolean(),
      termsAccepted: z.boolean(),
    }),
    paymentMethod: paymentMethodSchema.nullable(),
    confirmation: z
      .object({
        reference: z.string().min(1),
        paidAt: z.number().int().nonnegative(),
        confirmedAt: z.number().int().nonnegative().nullable(),
      })
      .nullable(),
    furthestStep: stepIdSchema,
    updatedAt: z.number().int().nonnegative(),
  }),
});

/**
 * Storage access, guarded.
 *
 * `sessionStorage` throws rather than returning undefined in several real
 * situations — Safari private browsing, storage disabled by policy, quota
 * exhausted — and it is simply absent during server rendering. All of them mean
 * the same thing to this module: no persistence available. FR-CONF-002 says
 * "where feasible", so degrading to an in-memory draft is compliant, and a
 * booking must never fail because a browser declined to remember it.
 */
function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Returns the stored draft for a product, or `null` if there is nothing usable. */
export function readDraft(productId: string, now: number = Date.now()): BookingDraft | null {
  const storage = safeStorage();
  if (!storage) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(draftStorageKey(productId));
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = persistedSchema.safeParse(parsed);
  if (!result.success) return null;

  const { draft } = result.data;

  // A draft filed under one product's key that claims another product's id has
  // been tampered with or mis-written. Either way it is not this booking.
  if (draft.productId !== productId) return null;

  if (now - draft.updatedAt > DRAFT_MAX_AGE_MS) {
    clearDraft(productId);
    return null;
  }

  /*
    The nominee section is restored **empty**, never from storage, because it is
    never written there (T3.3.1). Returning it here rather than making the
    caller remember keeps one shape of "a draft" in the module.
  */
  /*
    The nominee section and the application's typed answers are both restored
    **empty**, never from storage, because neither is written there. Returning
    them here rather than making the caller remember keeps one shape of "a
    draft" in the module.
  */
  return {
    ...draft,
    nominee: emptyNomineeConfiguration(),
    application: { ...draft.application, answers: {} },
  };
}

/**
 * Persists a draft. Silent on failure — see `safeStorage`.
 *
 * **The nominee section is deliberately omitted.** Names and dates of birth are
 * PII about a third party, and the draft's contract — shipped at T3.2.2 — is
 * that it "never carries raw sensitive values". This function is where that
 * stops being a comment: the persisted payload is assembled field by field, so
 * a future section is only stored if someone adds it here on purpose.
 */
export function writeDraft(draft: BookingDraft): void {
  const storage = safeStorage();
  if (!storage) return;

  const payload: PersistedBookingDraft = {
    version: STORAGE_VERSION,
    draft: {
      bookingId: draft.bookingId,
      productId: draft.productId,
      identity: draft.identity,
      application: {
        acceptedDeclarations: draft.application.acceptedDeclarations,
        preparedAt: draft.application.preparedAt,
        identityMethod: draft.application.identityMethod,
        // `answers` cannot appear here: `PersistedApplicationConfiguration`
        // omits it, so adding it back is a type error rather than a review note.
      },
      investment: draft.investment,
      bankAccountId: draft.bankAccountId,
      declarations: draft.declarations,
      paymentMethod: draft.paymentMethod,
      confirmation: draft.confirmation,
      furthestStep: draft.furthestStep,
      updatedAt: draft.updatedAt,
      // `nominee` cannot appear here: `PersistedBookingDraft` omits it, so
      // adding it back is a type error rather than a review comment.
    },
  };

  try {
    storage.setItem(draftStorageKey(draft.productId), JSON.stringify(payload));
  } catch {
    // Quota or policy. The in-memory draft remains authoritative for this tab.
  }
}

export function clearDraft(productId: string): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.removeItem(draftStorageKey(productId));
  } catch {
    // Nothing to do — the draft is already unreachable.
  }
}
