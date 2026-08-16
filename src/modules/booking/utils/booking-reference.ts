/**
 * The booking reference shown from Processing onwards (specs 21g–21i).
 *
 * ## Why it is generated here and stored, rather than derived on each render
 *
 * The reference is the one thing a customer writes down. It appears on
 * Processing, on Success, in the confirmation email the platform promises, and
 * is what they would quote to support. A value recomputed per render — from
 * `Date.now()`, say — would differ between the two screens that display it,
 * which is worse than having none.
 *
 * So it is **minted once**, when the payment is submitted, and lives in the
 * draft from then on. This module is the pure function that mints it; the
 * caller supplies the seed, so the result is assertable without mocking a clock.
 *
 * ## ⚠ This is not a bank reference
 *
 * A real reference is issued by the partner bank when the deposit is created,
 * and no such call exists. This is a locally generated identifier with the
 * shape the approved artwork draws (`AXISFD1252405123456`), so the screens have
 * something structurally valid to display and copy. It resolves to nothing.
 *
 * When booking submission is real, the bank's reference replaces this and the
 * screens are unchanged — they read one field.
 */

/** Digits after the bank prefix, matching the artwork's reference length. */
const DIGIT_COUNT = 14;

/**
 * `AXISFD1252405123456` — bank code, product marker, then digits.
 *
 * The prefix is uppercased and stripped to letters so a short code with a dot
 * or a space in it cannot produce a reference with punctuation in the middle.
 */
export function buildBookingReference(bankShortCode: string, seed: number): string {
  const prefix =
    bankShortCode
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4) || 'FD';

  /*
    Derived from the seed rather than from `Math.random`, so the same seed
    always yields the same reference. That is what makes this testable, and it
    means a re-render during payment cannot mint a second reference for one
    booking.
  */
  const digits = String(Math.abs(Math.trunc(seed)))
    .padStart(DIGIT_COUNT, '0')
    .slice(-DIGIT_COUNT);

  return `${prefix}FD${digits}`;
}
