/**
 * The amount an entry flow hands to Booking.
 *
 * ## Why Booking accepts one at all
 *
 * Goal-Based FD and Comparison both establish an amount before Booking is
 * reached — it is the figure the recommendation was evaluated for, and the
 * figure every compared column was priced against. Asking for it again on
 * Investment Details is not a validation step, it is the customer typing the
 * same number twice.
 *
 * ## Why this is not the rate/maturity rule being relaxed
 *
 * `booking-handoff.ts` refuses to carry the engine's **quote** and **maturity**,
 * and that stands unchanged. The reason it stands is that those are *figures the
 * platform computed*, and forwarding one would create a second authority for a
 * price that Booking must resolve for itself at the moment of booking.
 *
 * An amount is the opposite: it is **the customer's own input**, the platform
 * computed nothing, and there is no second authority to create. Booking still
 * prices it, still validates it against the product's minimum, maximum and
 * increment, and still refuses it if the product would.
 *
 * So a rate crossing the boundary would be Booking believing someone else's
 * price. An amount crossing it is Booking not asking a question it has already
 * been answered.
 *
 * ## It is a prefill, never a fact
 *
 * The value is parsed here and written into the canonical draft **once**. From
 * that moment `draft.investment.amount` is the single authority — the same field
 * Investment Details, Review, Payment and Success all read. Nothing downstream
 * knows an entry flow existed, and there is no second booking state.
 *
 * ## Nothing is invented
 *
 * A missing, malformed, non-integer or non-positive value yields `null`, and
 * `null` means *the draft is left alone*. Investment Details then reports the
 * amount as missing in its own words, which is the existing intended behaviour
 * — never a minimum, a quick amount, a reference figure or a product default.
 *
 * Pure and React-free.
 */

/** The query key Booking accepts on its entry route. Declared once. */
export const ENTRY_AMOUNT_PARAM = 'amount';

/**
 * The amount to seed, or `null` when there is nothing usable to seed.
 *
 * Accepts what a URL can carry — a string, an array of them, or nothing — so
 * the caller hands over `searchParams` untouched rather than narrowing it
 * first. An array means the key was repeated, which is ambiguous rather than
 * merely odd: two different amounts and no basis to choose, so neither is used.
 */
export function parseEntryAmount(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (trimmed === '') return null;

  /*
    Digits only. `Number('1e5')`, `Number('0x10')` and `Number(' 12 ')` all
    produce a number from something no entry flow would ever write, and an
    amount arriving in exponent notation is a sign the value was tampered with
    rather than a formatting variant to be tolerant of.
  */
  if (!/^\d+$/.test(trimmed)) return null;

  const amount = Number(trimmed);

  /*
    Whole positive rupees, and inside the range the draft's own schema accepts.
    The rupee is the smallest unit this platform transacts in, and a value past
    `MAX_SAFE_INTEGER` stops being an amount and starts being an arithmetic
    hazard.
  */
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;

  return amount;
}
