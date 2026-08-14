import type { NominationTypeId } from '../types/nominee';

/**
 * Nominee constants (T3.3.1).
 *
 * The two nomination types the approved artwork offers, and the share total the
 * approved copy states. Nothing here is inferred — each value is either drawn on
 * the screen or written on it.
 */

/**
 * The two cards under "Nomination Type", with the artwork's own wording.
 *
 * Transcribed from `FD_booking_nominee_03.png`, the same way the payout
 * descriptions were at T3.2.9.
 */
export const NOMINATION_TYPES: readonly {
  id: NominationTypeId;
  title: string;
  description: string;
}[] = [
  {
    id: 'single',
    title: 'Single Nominee',
    description: 'All proceeds will be paid to one nominee.',
  },
  {
    id: 'multiple',
    title: 'Multiple Nominees',
    description: 'Proceeds will be distributed among multiple nominees.',
  },
] as const;

/** The approved default — the artwork shows "Single Nominee" selected. */
export const DEFAULT_NOMINATION_TYPE: NominationTypeId = 'single';

/**
 * The shares of all nominees must add up to this.
 *
 * Stated on the approved screen itself: *"The total share of all nominees must
 * be equal to 100%."*
 *
 * Worth recording that spec 21d §10 marks the same rule **"(future)"**. The
 * artwork asserts it as current and the screen prints it to the user, so it is
 * implemented as current — but the divergence is noted rather than smoothed
 * over.
 */
export const TOTAL_SHARE_PERCENT = 100;

/**
 * ⚠ **[POC ASSUMPTION — replaceable in one edit]**
 *
 * Spec 21d §8 Rule 3 requires the relationship to come "from supported values",
 * and **no such list exists in any of the 34 Booking analysis documents**.
 * Document 19 names "Relationship Types" among the platform's *Reference Data*
 * without enumerating it; the only concrete values anywhere are two
 * illustrations — "Brother" in spec §5B and "Wife" in the approved artwork.
 *
 * These eight are a **conventional Indian FD nomination set, supplied as a POC
 * stand-in on 2026-08-06 while the client was unavailable.** They are not
 * sourced from any specification and carry no regulatory authority.
 *
 * ## Replacing them
 *
 * **This array is the only edit required.** It is the single source of truth:
 *
 * - `nominee-schema.ts` validates membership against it
 * - `NomineeFields` renders the `Select` options from it
 * - no component, screen or test hard-codes a relationship
 *
 * Changing the list changes the dropdown, the validation and the error message
 * together. An invariant asserts that no component declares its own.
 *
 * Note "Wife" from the artwork is **not** here: "Spouse" covers it without
 * assuming the investor's gender. Worth confirming with the client, since the
 * artwork shows the narrower word.
 */
export const SUPPORTED_RELATIONSHIPS: readonly string[] = [
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Other',
] as const;
