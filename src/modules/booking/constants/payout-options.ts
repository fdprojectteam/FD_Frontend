import type { PayoutOptionId } from '../types/draft';

/**
 * The platform's interest payout vocabulary (T3.2.7, extended T3.2.9).
 *
 * Five options, in the order they are offered. `at-maturity` is first because
 * it is the default and because it is the one most deposits are booked on.
 *
 * **This is the platform's set, not any product's.** Which of these a given
 * deposit actually offers is `DepositTerms.supportedPayouts`, and
 * `resolvePayoutOptions` is what narrows one to the other — spec 21b §D is
 * explicit that unavailable options must not be displayed.
 *
 * **Why the ids are not the labels.** `PayoutOptionId` is stable vocabulary that
 * ends up in a stored draft and, later, in a booking record; the label is copy.
 * Keeping them apart is what lets "Annual" be relabelled "Yearly" — which it
 * just was — without invalidating a single persisted draft.
 */
export const PAYOUT_OPTION_ORDER: readonly PayoutOptionId[] = [
  'at-maturity',
  'monthly',
  'quarterly',
  'half-yearly',
  'annual',
];

/**
 * The default when a booking has not chosen yet.
 *
 * Interest that compounds is the safer default: it is what the approved artwork
 * shows selected, and a user who never opens this control ends up with the
 * option that pays the most rather than one that quietly reduces their return.
 */
export const DEFAULT_PAYOUT_OPTION: PayoutOptionId = 'at-maturity';

/**
 * Display labels.
 *
 * `annual` reads as **"Yearly"** — plainer English for the same thing, and the
 * wording confirmed for T3.2.9. The id stays `annual` deliberately; see above.
 */
export const PAYOUT_OPTION_LABELS: Record<PayoutOptionId, string> = {
  'at-maturity': 'At Maturity',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-Yearly',
  annual: 'Yearly',
};

/**
 * One line explaining what each option does to the money.
 *
 * The first three are the approved artwork's own wording, verbatim. The last two
 * are **not drawn** — the artboard shows three cards, because the demo product
 * offers three — so they follow the identical pattern of the two frequency
 * options that are drawn. Flagged in the T3.2.9 report as the one piece of copy
 * not transcribed from the source of truth.
 */
export const PAYOUT_OPTION_DESCRIPTIONS: Record<PayoutOptionId, string> = {
  'at-maturity': 'Get full interest along with principal at maturity.',
  monthly: 'Receive interest every month.',
  quarterly: 'Receive interest every quarter.',
  'half-yearly': 'Receive interest every six months.',
  annual: 'Receive interest every year.',
};
