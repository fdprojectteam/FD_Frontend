'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { emptyNominee, emptyNomineeConfiguration } from '../constants/booking-draft';
import { BOOKING_STEPS } from '../constants/steps';
import type { BookingStepId } from '../types/booking';
import type {
  BookingConfirmation,
  BookingDraft,
  DeclarationConfiguration,
  InvestmentConfiguration,
  PaymentMethodId,
} from '../types/draft';
import type { Nominee, NomineeConfiguration } from '../types/nominee';
import { clearDraft, readDraft, writeDraft } from '../utils/draft-storage';

/**
 * The booking draft — Booking's feature state (T3.2.2).
 *
 * Document 09 §3 classifies this as Feature State, §4 assigns feature state to
 * "Custom Hooks / Context", and §5 forbids module data in the global store. So
 * this is a module-scoped context, and **no dependency was added** — the same
 * conclusion `useCompareSelection` reached on the Marketplace side, from the
 * same paragraphs.
 *
 * **Seated on the `/booking/[productId]` layout**, so its lifetime is the
 * booking, not the screen. That is what makes progress survive a move from
 * Details to Nominee and back, which FR-CONF-002 requires and which a
 * screen-level `useState` cannot do.
 *
 * **Persistence is a side effect, not the source of truth.** React state is
 * authoritative; storage is written after it changes and read once on mount. If
 * storage is unavailable — private browsing, policy, quota — the draft still
 * works for the tab. FR-CONF-002 says "where feasible", and no booking should
 * fail because a browser declined to remember it.
 *
 * **Hydration.** The initial state is deliberately *not* read from storage
 * during render: `sessionStorage` does not exist on the server, and seeding
 * `useState` from it produces a server/client mismatch. The draft therefore
 * starts empty and is replaced in an effect on mount. The visible consequence
 * is one frame of empty fields on a resumed booking, which is the correct
 * trade against a hydration error on a financial screen.
 */
export interface BookingDraftContextValue {
  draft: BookingDraft;
  /** False until the mount-time storage read has run — screens can defer autofocus. */
  isHydrated: boolean;
  /** Merges a patch into the investment configuration. */
  setInvestment: (patch: Partial<InvestmentConfiguration>) => void;
  /**
   * Merges a patch into the nominee configuration (T3.3.3).
   *
   * The same shape as `setInvestment` on purpose — one way to write a section,
   * whichever section it is. **Never persisted:** the effect below writes only
   * what `PersistedBookingDraft` permits, and that type omits `nominee`.
   */
  setNominee: (patch: Partial<NomineeConfiguration>) => void;
  /** Appends an empty nominee. No maximum is enforced — none is specified. */
  addNominee: () => void;
  /** Removes one nominee by id. A no-op for an id that is not present. */
  removeNominee: (nomineeId: string) => void;
  /** Merges a patch into one nominee, leaving the others untouched. */
  updateNominee: (nomineeId: string, patch: Partial<Omit<Nominee, 'id'>>) => void;
  /** Records which saved account funds this booking (spec 21e). */
  setBankAccountId: (bankAccountId: string | null) => void;
  /** Merges a patch into the Review declarations (spec 21f §5F). */
  setDeclarations: (patch: Partial<DeclarationConfiguration>) => void;
  setPaymentMethod: (paymentMethod: PaymentMethodId) => void;
  /**
   * Records that payment was submitted, **once**.
   *
   * Idempotent by construction: a draft that already carries a confirmation is
   * returned unchanged, so a double-click, a StrictMode double-invoke or a
   * replayed effect cannot mint a second reference for one booking. That is
   * spec 21g §8 Rule 3 held in the state layer rather than in a disabled
   * button, because a disabled button is a UI detail and this is money.
   */
  confirmPayment: (confirmation: BookingConfirmation) => void;
  /** Marks the partner bank's confirmation. Also idempotent. */
  completeBooking: (confirmedAt: number) => void;
  /**
   * Advances the high-water mark. Never retreats — going Back does not undo
   * having reached a step, which is what makes resume land in the right place
   * (FR-SYS-001) and what step guards read (BR-BOOK-002).
   */
  markStepReached: (stepId: BookingStepId) => void;
  /** Wipes the draft and its stored copy. For Success and explicit cancellation. */
  reset: () => void;
}

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

function emptyDraft(productId: string, now: number): BookingDraft {
  return {
    productId,
    investment: { amount: null, tenureMonths: null, payoutOption: null },
    nominee: emptyNomineeConfiguration(),
    bankAccountId: null,
    declarations: { detailsConfirmed: false, termsAccepted: false },
    paymentMethod: null,
    confirmation: null,
    furthestStep: 'overview',
    updatedAt: now,
  };
}

/** Position in the approved journey — the ordering `markStepReached` compares on. */
function stepIndex(stepId: BookingStepId): number {
  return BOOKING_STEPS.findIndex((step) => step.id === stepId);
}

export interface BookingDraftProviderProps {
  productId: string;
  children: ReactNode;
}

export function BookingDraftProvider({ productId, children }: BookingDraftProviderProps) {
  const [draft, setDraft] = useState<BookingDraft>(() => emptyDraft(productId, Date.now()));
  const [isHydrated, setIsHydrated] = useState(false);

  /*
    Mount-time hydration, and re-run when the product changes — a different
    product is a different booking, so the draft must not carry across.
  */
  useEffect(() => {
    const stored = readDraft(productId);
    setDraft(stored ?? emptyDraft(productId, Date.now()));
    setIsHydrated(true);
  }, [productId]);

  /*
    Persist after render rather than inside the setters.

    Writing in the setter would serialise on every keystroke and would also make
    each setter responsible for remembering to persist — the kind of duty that
    is eventually forgotten by the fifth one. Here there is a single writer, and
    it cannot be bypassed.

    The `isHydrated` guard matters: without it the empty initial draft would be
    written to storage before the stored one is read, erasing the very progress
    this exists to preserve.
  */
  const hasPendingWrite = useRef(false);
  useEffect(() => {
    if (!isHydrated) return;
    if (!hasPendingWrite.current) return;
    hasPendingWrite.current = false;
    writeDraft(draft);
  }, [draft, isHydrated]);

  const setInvestment = useCallback((patch: Partial<InvestmentConfiguration>) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({
      ...current,
      investment: { ...current.investment, ...patch },
      updatedAt: Date.now(),
    }));
  }, []);

  const setNominee = useCallback((patch: Partial<NomineeConfiguration>) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({
      ...current,
      nominee: { ...current.nominee, ...patch },
      updatedAt: Date.now(),
    }));
  }, []);

  const addNominee = useCallback(() => {
    hasPendingWrite.current = true;
    setDraft((current) => ({
      ...current,
      nominee: {
        ...current.nominee,
        nominees: [
          ...current.nominee.nominees,
          emptyNominee(current.nominee.nominees.length === 0),
        ],
      },
      updatedAt: Date.now(),
    }));
  }, []);

  const removeNominee = useCallback((nomineeId: string) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({
      ...current,
      nominee: {
        ...current.nominee,
        nominees: current.nominee.nominees.filter((nominee) => nominee.id !== nomineeId),
      },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateNominee = useCallback((nomineeId: string, patch: Partial<Omit<Nominee, 'id'>>) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({
      ...current,
      nominee: {
        ...current.nominee,
        nominees: current.nominee.nominees.map((nominee) =>
          nominee.id === nomineeId ? { ...nominee, ...patch } : nominee,
        ),
      },
      updatedAt: Date.now(),
    }));
  }, []);

  const setBankAccountId = useCallback((bankAccountId: string | null) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({ ...current, bankAccountId, updatedAt: Date.now() }));
  }, []);

  const setDeclarations = useCallback((patch: Partial<DeclarationConfiguration>) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({
      ...current,
      declarations: { ...current.declarations, ...patch },
      updatedAt: Date.now(),
    }));
  }, []);

  const setPaymentMethod = useCallback((paymentMethod: PaymentMethodId) => {
    hasPendingWrite.current = true;
    setDraft((current) => ({ ...current, paymentMethod, updatedAt: Date.now() }));
  }, []);

  const confirmPayment = useCallback((confirmation: BookingConfirmation) => {
    hasPendingWrite.current = true;
    /*
      The guard is inside the updater on purpose, unlike `markStepReached`'s
      ref flag: this one must read the *current* draft to decide, and doing it
      here is what makes a second call a no-op even when two callers race.
    */
    setDraft((current) =>
      current.confirmation === null ? { ...current, confirmation, updatedAt: Date.now() } : current,
    );
  }, []);

  const completeBooking = useCallback((confirmedAt: number) => {
    hasPendingWrite.current = true;
    setDraft((current) =>
      current.confirmation === null || current.confirmation.confirmedAt !== null
        ? current
        : {
            ...current,
            confirmation: { ...current.confirmation, confirmedAt },
            updatedAt: Date.now(),
          },
    );
  }, []);

  const markStepReached = useCallback((stepId: BookingStepId) => {
    /*
      The flag is set here, in the event handler, and not inside the updater.
      An updater must be pure — React may invoke it twice in StrictMode — and a
      ref mutation inside one is exactly the impurity that makes a double
      invocation observable. A flag left `true` after a no-op advance is
      harmless: it only means the next genuine change writes, which it would.
    */
    hasPendingWrite.current = true;
    setDraft((current) =>
      stepIndex(stepId) <= stepIndex(current.furthestStep)
        ? current
        : { ...current, furthestStep: stepId, updatedAt: Date.now() },
    );
  }, []);

  const reset = useCallback(() => {
    clearDraft(productId);
    hasPendingWrite.current = false;
    setDraft(emptyDraft(productId, Date.now()));
  }, [productId]);

  const value = useMemo<BookingDraftContextValue>(
    () => ({
      draft,
      isHydrated,
      setInvestment,
      setNominee,
      addNominee,
      removeNominee,
      updateNominee,
      setBankAccountId,
      setDeclarations,
      setPaymentMethod,
      confirmPayment,
      completeBooking,
      markStepReached,
      reset,
    }),
    [
      draft,
      isHydrated,
      setInvestment,
      setNominee,
      addNominee,
      removeNominee,
      updateNominee,
      setBankAccountId,
      setDeclarations,
      setPaymentMethod,
      confirmPayment,
      completeBooking,
      markStepReached,
      reset,
    ],
  );

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

/**
 * Throws outside a provider rather than returning a null-ish default.
 *
 * A booking screen that silently loses its draft is worse than one that fails
 * to render: the first ships, the second is caught the moment it is opened.
 */
export function useBookingDraft(): BookingDraftContextValue {
  const context = useContext(BookingDraftContext);

  if (!context) {
    throw new Error('useBookingDraft must be used within a BookingDraftProvider.');
  }

  return context;
}
