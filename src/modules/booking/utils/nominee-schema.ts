import { SUPPORTED_RELATIONSHIPS, TOTAL_SHARE_PERCENT } from '../constants/nominee';
import type { Nominee, NomineeConfiguration } from '../types/nominee';

/**
 * Nominee validation (T3.3.1 / T3.3.5).
 *
 * Implements what spec 21d §10 and the approved screen actually state, and
 * **nothing they do not**. Pure and React-free, like every other rule under
 * `utils/`, so each is assertable without rendering a form.
 *
 * ## What is implemented
 *
 * | Rule | Source |
 * |---|---|
 * | Full name required | §10 "Required fields" |
 * | Relationship required | §10 "Required fields" |
 * | Relationship from supported values | §8 Rule 3 — against `SUPPORTED_RELATIONSHIPS` |
 * | Date of birth required and a real date | §10 "Valid date of birth" |
 * | Date of birth not in the future | a birth date that has not happened |
 * | Share is a number in 0–100 | the approved field is a percentage |
 * | Shares total 100% | approved copy, printed on the screen |
 *
 * ## What is deliberately not implemented
 *
 * - **No minor-age rule.** §8 Rule 2 requires guardian information for a minor
 *   and no document defines "minor". The approved artwork asks for the guardian
 *   name unconditionally, so the screen needs no threshold — and inventing one
 *   would make guardian *mandatory* for an age nobody has agreed on.
 * - **No relationship list of its own.** Membership is checked against
 *   `SUPPORTED_RELATIONSHIPS`, which currently holds a **marked POC
 *   assumption** rather than client-supplied data. The check is written to be
 *   inert when that list is empty, so restoring it to empty — or replacing it
 *   wholesale — needs no change here.
 * - **No nominee-count limit.** §5E and the artwork allow adding nominees; no
 *   maximum is stated anywhere.
 * - **No duplicate detection** (§8 Rule 4) — it compares against *previously
 *   saved* nominees, and no saved-nominee store exists.
 * - **Nothing about whether nomination is mandatory** (§8 Rule 1). That rule is
 *   conditional on the partner bank's policy, which is not in the data, and it
 *   gates *Continue* — which is disabled on this flow until T3.2.12 wires
 *   navigation.
 */

export type NomineeField =
  'fullName' | 'relationship' | 'dateOfBirth' | 'guardianName' | 'sharePercent';

export interface NomineeFieldError {
  nomineeId: string;
  field: NomineeField;
  /** Plain-English and actionable, matching the Investment Details standard. */
  message: string;
}

export interface NomineeValidationResult {
  isValid: boolean;
  errors: NomineeFieldError[];
  /** Not tied to any one nominee — e.g. the shares not reaching 100%. */
  formErrors: string[];
}

/**
 * Parses a typed share into a number, or `null` when it is not one.
 *
 * Exported because the screen needs the same reading to display a running total
 * without re-implementing the parse — one interpretation of what the user typed.
 */
export function parseSharePercent(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

/** Validates one nominee in isolation. Share *totals* are a form-level rule. */
export function validateNominee(nominee: Nominee): NomineeFieldError[] {
  const errors: NomineeFieldError[] = [];
  const fail = (field: NomineeField, message: string) =>
    errors.push({ nomineeId: nominee.id, field, message });

  if (nominee.fullName.trim() === '') {
    fail('fullName', 'Enter the nominee’s full name as it appears on their ID proof.');
  }

  if (nominee.relationship.trim() === '') {
    fail('relationship', 'Choose the nominee’s relationship with you.');
  } else if (
    SUPPORTED_RELATIONSHIPS.length > 0 &&
    !SUPPORTED_RELATIONSHIPS.includes(nominee.relationship)
  ) {
    /*
      §8 Rule 3, enforced only when there is a list to enforce. With the list
      empty — as it is until the business supplies one — this branch is
      unreachable, so an absent list cannot reject every value the user types.
    */
    fail('relationship', 'Choose a relationship from the list.');
  }

  const dateOfBirth = nominee.dateOfBirth.trim();
  if (dateOfBirth === '') {
    fail('dateOfBirth', 'Enter the nominee’s date of birth.');
  } else {
    const parsed = Date.parse(dateOfBirth);

    if (Number.isNaN(parsed)) {
      fail('dateOfBirth', 'Enter the date of birth as a valid date.');
    } else if (parsed > Date.now()) {
      // Not an age rule — simply a birth date that has not happened yet.
      fail('dateOfBirth', 'The date of birth cannot be in the future.');
    }
  }

  const share = parseSharePercent(nominee.sharePercent);
  if (share === null) {
    fail('sharePercent', 'Enter the share of proceeds for this nominee.');
  } else if (share <= 0 || share > TOTAL_SHARE_PERCENT) {
    fail('sharePercent', `Enter a share between 1 and ${TOTAL_SHARE_PERCENT}%.`);
  }

  return errors;
}

/** The sum of every readable share. Unreadable entries count as nothing. */
export function totalSharePercent(nominees: readonly Nominee[]): number {
  return nominees.reduce((total, nominee) => {
    const share = parseSharePercent(nominee.sharePercent);
    return total + (share ?? 0);
  }, 0);
}

/**
 * Validates the whole nominee section.
 *
 * Reports **every** failing field rather than stopping at the first, the same
 * choice `validateInvestmentConfiguration` makes: a form that reveals one
 * problem at a time makes the user submit repeatedly to learn how many there
 * are.
 */
export function validateNomineeConfiguration(
  configuration: NomineeConfiguration,
): NomineeValidationResult {
  const { nominees } = configuration;
  const formErrors: string[] = [];

  if (nominees.length === 0) {
    formErrors.push('Add at least one nominee to continue.');
    return { isValid: false, errors: [], formErrors };
  }

  const errors = nominees.flatMap(validateNominee);

  /*
    The share total, stated on the approved screen: "The total share of all
    nominees must be equal to 100%."

    Only checked once every individual share is readable — telling someone their
    shares total 60% while one field is still blank describes the form's state,
    not their mistake.
  */
  const everyShareReadable = nominees.every(
    (nominee) => parseSharePercent(nominee.sharePercent) !== null,
  );

  if (everyShareReadable) {
    const total = totalSharePercent(nominees);

    if (total !== TOTAL_SHARE_PERCENT) {
      const difference = Math.abs(TOTAL_SHARE_PERCENT - total);
      const direction = total < TOTAL_SHARE_PERCENT ? 'add' : 'remove';

      formErrors.push(
        `The shares add up to ${total}%. ${direction === 'add' ? 'Add' : 'Remove'} ${difference}% to reach ${TOTAL_SHARE_PERCENT}%.`,
      );
    }
  }

  return {
    isValid: errors.length === 0 && formErrors.length === 0,
    errors,
    formErrors,
  };
}
