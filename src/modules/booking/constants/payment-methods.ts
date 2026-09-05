import type { PaymentMethodId } from '../types/draft';

/**
 * The payment methods drawn on the approved screen (spec 21g §5B).
 *
 * ## ⚠ The filter this list is missing
 *
 * §8 Rule 2 requires the methods shown to be narrowed by Partner Bank
 * Configuration, Payment Gateway Configuration and regulatory restrictions, and
 * §5B is explicit that *"unavailable methods should not appear"*.
 *
 * **None of those three configurations exist in this codebase.** `ProductMaster`
 * carries no payment capability, there is no gateway, and no document enumerates
 * the restrictions. So this list is what `FD_booking_payment_06.png` draws, and
 * every method is offered for every product — which is a limitation, not a
 * claim about what any partner bank accepts.
 *
 * When a configuration arrives, `resolvePaymentMethods(product)` narrows this
 * list the way `resolvePayoutOptions` already narrows the platform's five payout
 * options to what a product supports. The pattern is established; only the data
 * is absent.
 *
 * `settlement` is the artwork's own badge copy — "Instant" or "1-2 Business
 * Days" — and is presentation, not a promise the platform computes.
 */
export interface PaymentMethod {
  id: PaymentMethodId;
  title: string;
  description: string;
  settlement: string;
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    id: 'net-banking',
    title: 'Net Banking',
    description: 'Pay securely using your bank account',
    settlement: 'Instant',
  },
  {
    id: 'upi',
    title: 'UPI',
    description: 'Pay using any UPI app',
    settlement: 'Instant',
  },
  {
    id: 'debit-card',
    title: 'Debit Card',
    description: 'Pay using your debit card',
    settlement: 'Instant',
  },
  // {
  //   id: 'credit-card',
  //   title: 'Credit Card',
  //   description: 'Pay using your credit card',
  //   settlement: '1-2 Business Days',
  // },
  {
    id: 'neft-rtgs',
    title: 'NEFT / RTGS',
    description: 'Make payment using NEFT or RTGS',
    settlement: '1-2 Business Days',
  },
] as const;

/** The default selection, matching the artwork's pre-selected first card. */
export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = 'net-banking';
