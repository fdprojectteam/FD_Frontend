'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { REFERENCE_AMOUNT } from '../constants/filters';
import type { ProductSummary } from '../types/product';
import { parseDepositAmount } from '../utils/calculator-input';

/**
 * useComparisonPreferences — the comparison's **context**, not its data
 * (change request, 2026-08-02; amended by the Comparison Experience Refinement,
 * same date).
 *
 * The brief's architecture in one hook:
 *
 *     Investment Preferences → Comparison Context → Products → Results
 *
 * The distinction it turns on is that the deposit amount is not a field *of* the
 * comparison, it is an input *to* it. Every product is recalculated against it,
 * so it cannot live in a row, a column, or a view — and if it lived in
 * `CompareScreen` as loose `useState` (which it did until now), the second
 * preference would arrive as a second pair of `useState`s, the third as a third,
 * and the "reusable, not just a deposit amount" instruction would be satisfied
 * in the components and defeated in the state.
 *
 * So preferences are modelled as **one object with one setter per field**.
 * Adding Tenure is a key here, a field in the section, and nothing else: the
 * query key, the service call and both views already take whatever this returns.
 *
 * **Not in the URL** (decision D3, unchanged): `/compare`'s approved parameter
 * set stays closed at `?ids=`, so a shared link carries the selection rather
 * than the visitor's deposit.
 *
 * ---
 *
 * ## Draft and applied (refinement, 2026-08-02)
 *
 * The screen used to recalculate on every keystroke, so typing `500000` walked
 * the whole comparison through `5`, `50`, `500`, `5000`, `50000` — five full
 * refreshes of a table the user was not yet asking about. Arithmetically
 * correct, and the wrong interaction for a workspace where the figures are the
 * thing being read: the table moved while the user was still deciding what to
 * put in it.
 *
 * So editing and applying are separated:
 *
 *     input → draftDepositAmount → Update Comparison → appliedDepositAmount
 *                                                            ↓
 *                                                      calculations
 *
 * **Two values, and only one of them is business input.** The draft is text the
 * user is editing and nothing downstream may read it. The applied figure is what
 * the comparison is calculated against — it changes only when the user says so,
 * or when the products-derived default is first settled. The query key, the
 * service call and both presentations see `preferences` alone, which is what
 * keeps desktop and mobile refreshing together: there is one applied value, so
 * there is nothing to synchronise.
 *
 * **This replaces the old last-valid-parse latch.** The hook used to hold the
 * last figure that parsed so a half-deleted amount would not blank the table.
 * That was a workaround for recalculating mid-edit; with an explicit apply step
 * the applied value is *by construction* the last thing the user confirmed, so
 * an unparseable draft is a field error and nothing more.
 */

/** The context every compared product is calculated against. */
export interface ComparisonPreferences {
  depositAmount: number;
}

export interface UseComparisonPreferencesResult {
  /** The **applied** context. Every calculation reads this and only this. */
  preferences: ComparisonPreferences;
  /** Raw field text — what the user is typing, which may not yet parse. */
  depositAmountInput: string;
  depositAmountError: string | null;
  /**
   * The draft differs from what the comparison is showing — either a different
   * amount, or text that cannot be read as one. Drives the "Changes not
   * applied" indicator and the presence of the apply action.
   */
  hasPendingChanges: boolean;
  /**
   * There is a *valid* pending change. Distinct from `hasPendingChanges`: `abc`
   * is pending and cannot be applied, and the action is disabled rather than
   * absent so the field's error is the explanation rather than a control
   * quietly disappearing.
   */
  canApply: boolean;
  setDepositAmount: (raw: string) => void;
  /** Promotes the draft to the applied context. No-ops unless `canApply`. */
  applyPreferences: () => void;
  /** Restores the draft to the applied context — the Escape affordance. */
  resetDraft: () => void;
  /**
   * Offers a products-derived default. Ignored once the user has typed, and
   * applied at most once — see the note on the implementation.
   */
  applyDefaultFor: (products: readonly ProductSummary[]) => void;
}

/**
 * The default deposit for a set of products: the **highest** minimum among
 * them, floored at the platform reference amount.
 *
 * "The product's minimum deposit" is unambiguous for one product and undefined
 * for four, which is the case this screen actually has. Taking the highest is
 * the only choice under which the opening comparison is entirely valid — every
 * column can be opened at the amount shown, so nothing starts flagged as below
 * its own minimum. Taking the lowest would seed the table with figures the user
 * cannot act on in two of four columns.
 *
 * The floor is the brief's "or ₹100,000 if no better default exists", read as a
 * lower bound rather than a fallback: it keeps the opening figures consistent
 * with the "Estimated returns on ₹1,00,000" line the rest of Marketplace quotes,
 * for the common case where every minimum is well below it.
 */
export function defaultDepositAmount(products: readonly ProductSummary[]): number {
  return products.reduce(
    (amount, product) => Math.max(amount, product.minInvestment),
    REFERENCE_AMOUNT,
  );
}

export function useComparisonPreferences(): UseComparisonPreferencesResult {
  /**
   * The two values the refinement is about. The applied figure keeps the
   * `REFERENCE_AMOUNT` seed — the screen has to open on *something*, and the
   * products it would derive a better default from are fetched using it.
   */
  const [appliedDepositAmount, setAppliedDepositAmount] = useState(REFERENCE_AMOUNT);
  const [draftDepositAmount, setDraftDepositAmount] = useState(String(REFERENCE_AMOUNT));

  const parsed = useMemo(() => parseDepositAmount(draftDepositAmount), [draftDepositAmount]);
  const depositAmountError = parsed.ok ? null : parsed.message;

  /**
   * Pending is compared by **value, not by text**. `" 100000"` and `"0100000"`
   * both read as the applied amount, so neither is a pending change — offering
   * an Update Comparison button that would recalculate nothing is a promise the
   * refresh cannot keep. Unparseable text *is* pending: something is in the
   * field that the comparison is not showing.
   */
  const canApply = parsed.ok && parsed.amount !== appliedDepositAmount;
  const hasPendingChanges = !parsed.ok || canApply;

  /**
   * Whether the default has been settled — by the user typing, or by the first
   * batch of products arriving.
   *
   * A ref, not state: nothing renders differently because of it, and as state it
   * would be a third value to keep in step with the two above.
   *
   * **Why the default cannot simply be the initial state.** It is derived from
   * the products' minimums, and the products are fetched *using* the amount —
   * the amount is part of the query key. There is no moment before the first
   * fetch at which the minimums are known. So the screen opens on the reference
   * amount, and the first successful batch settles the real default, which
   * re-keys the query and refetches. That second fetch is the honest cost of the
   * dependency; it is one mock round-trip, and the alternative — computing
   * returns in the component to avoid it — would put the calculation in the UI,
   * which is the one thing this architecture does not do.
   *
   * The refinement makes this the **only** implicit write to the applied value.
   * It happens before the user has expressed any opinion, which is why it may
   * skip the apply step; every later change goes through it.
   */
  const settled = useRef(false);

  const setDepositAmount = useCallback((raw: string) => {
    // The user has an opinion; no derived default may overwrite it afterwards.
    settled.current = true;
    setDraftDepositAmount(raw);
  }, []);

  /**
   * The apply step, and the **only** place the draft reaches the applied
   * context. It re-checks rather than trusting the caller: the action is
   * disabled when there is nothing to apply, but Enter reaches this from the
   * field, and a guard that lives only in the button is a guard the keyboard
   * path does not have.
   */
  const applyPreferences = useCallback(() => {
    if (!parsed.ok || parsed.amount === appliedDepositAmount) return;

    settled.current = true;
    setAppliedDepositAmount(parsed.amount);

    // Normalised, so the field shows exactly the figure now being compared —
    // `"0500000"` applied and left in place would read as an unapplied change
    // on the very next render.
    setDraftDepositAmount(String(parsed.amount));
  }, [parsed, appliedDepositAmount]);

  const resetDraft = useCallback(() => {
    setDraftDepositAmount(String(appliedDepositAmount));
  }, [appliedDepositAmount]);

  const applyDefaultFor = useCallback((products: readonly ProductSummary[]) => {
    if (settled.current || products.length === 0) return;
    settled.current = true;

    const amount = defaultDepositAmount(products);
    setDraftDepositAmount(String(amount));
    setAppliedDepositAmount(amount);
  }, []);

  return {
    preferences: { depositAmount: appliedDepositAmount },
    depositAmountInput: draftDepositAmount,
    depositAmountError,
    hasPendingChanges,
    canApply,
    setDepositAmount,
    applyPreferences,
    resetDraft,
    applyDefaultFor,
  };
}
