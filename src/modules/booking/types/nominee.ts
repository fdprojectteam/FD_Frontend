/**
 * Nominee domain types (T3.3.1).
 *
 * Models the approved Nominee Details screen and spec 21d §5/§8.
 *
 * ## Why none of this is persisted
 *
 * A nominee's full name and date of birth are **personally identifiable
 * information about a third party** — someone who is not the user and has not
 * consented to anything. Document 19 §Security requires sensitive data to be
 * protected at rest, and the booking draft's own contract, written at T3.2.2
 * and shipped in `draft.ts`, states it plainly:
 *
 * > *"the draft carries identifiers of saved entities and never raw sensitive
 * > values. This type is the place that policy is enforced, by not having the
 * > fields."*
 *
 * Spec 21d §5B describes *Saved Nominees* — reusable records the draft could
 * reference by id — but the approved artwork shows none, so on this screen the
 * user types raw PII and there is no id to store instead.
 *
 * So the nominee slice lives in the booking draft **in memory only** and is
 * excluded from `sessionStorage`. The consequence is stated rather than hidden:
 * **a page refresh clears entered nominee details**, which is a narrowing of
 * FR-SYS-002's auto-save promise for this step alone. Reversing it is a
 * compliance decision, not an engineering one — see `draft-storage.ts`.
 */

/**
 * How the proceeds are divided.
 *
 * The approved artwork offers exactly these two. `multiple` is offered by the
 * design but the *rules* around it — how many nominees are permitted — are not
 * stated anywhere in the specification, so no cap is modelled here. Absence of
 * a limit is the honest representation of a limit nobody has set.
 */
export type NominationTypeId = 'single' | 'multiple';

/**
 * One nominee, exactly as the approved form collects it.
 *
 * Every field is a string, including `dateOfBirth` and `sharePercent`, because
 * this is **what was typed**, not what was validated. A half-entered date is a
 * normal state of a form and cannot be a `Date`; a share field mid-edit cannot
 * be a `number`. Parsing belongs to `nominee-schema.ts`, at the boundary.
 *
 * **`relationship` is a plain string, deliberately not a union.** Spec 21d §8
 * Rule 3 requires it to come "from supported values" — and no supported values
 * are enumerated anywhere in the 34 analysis documents. A union invented here
 * would be business data invented in a type. See `constants/nominee.ts`.
 *
 * **Guardian is a single name field**, matching the approved artwork. Spec 21d
 * §5D also lists guardian relationship and contact; the artwork draws neither,
 * and the artwork is the visual source of truth.
 */
export interface Nominee {
  /** Stable across re-renders and reorders, so React keys and removal are safe. */
  id: string;
  fullName: string;
  relationship: string;
  /** As typed. Parsed at the validation boundary, never stored as a `Date`. */
  dateOfBirth: string;
  /**
   * Shown unconditionally, as the artwork draws it, with the condition carried
   * in the visible label — *"Guardian Name (if nominee is minor)"*.
   *
   * This is why the screen needs no minor-age rule: spec §8 Rule 2 requires
   * guardian information for a minor but never defines "minor", and the
   * approved design resolves that by asking always rather than conditionally.
   */
  guardianName: string;
  /** As typed, a percentage. The approved copy requires the total to reach 100. */
  sharePercent: string;
}

/** The nominee section of a booking draft — in memory only. */
export interface NomineeConfiguration {
  nominationType: NominationTypeId;
  nominees: Nominee[];
}
