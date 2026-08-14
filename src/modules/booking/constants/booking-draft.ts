import { DEFAULT_NOMINATION_TYPE, TOTAL_SHARE_PERCENT } from './nominee';
import type { Nominee, NomineeConfiguration } from '../types/nominee';

/**
 * Empty draft sections (T3.3.1).
 *
 * Declared once so the provider, the storage layer and the tests all agree on
 * what "nothing entered yet" looks like. Two definitions of empty is how a
 * restored draft comes to differ from a fresh one in a way nobody notices until
 * a comparison fails.
 *
 * A **function**, not a frozen constant: each caller needs its own array, and a
 * shared one would let a nominee added in one booking appear in the next.
 */
export function emptyNomineeConfiguration(): NomineeConfiguration {
  return { nominationType: DEFAULT_NOMINATION_TYPE, nominees: [] };
}

/**
 * A blank nominee row (T3.3.3).
 *
 * **The first nominee opens at 100%**, because a single nominee is the approved
 * default and 100 is the only share that can ever be valid for one. Subsequent
 * rows open blank: the moment there are two, the platform has no basis for
 * guessing how the user wants the proceeds split, and pre-filling a number they
 * did not choose is worse than an empty field they must.
 *
 * The id is generated rather than positional so removing a middle nominee does
 * not silently renumber the ones after it — React keys, focus and per-field
 * errors all key on it.
 */
export function emptyNominee(isFirst = false): Nominee {
  return {
    id: nextNomineeId(),
    fullName: '',
    relationship: '',
    dateOfBirth: '',
    guardianName: '',
    sharePercent: isFirst ? String(TOTAL_SHARE_PERCENT) : '',
  };
}

/**
 * Monotonic ids, scoped to the tab.
 *
 * `crypto.randomUUID` is unavailable in some of the environments this runs in
 * (older Safari, the jsdom harness), and a counter is sufficient: ids only need
 * to be unique among the handful of nominees in one booking, never globally.
 */
let nomineeSequence = 0;
function nextNomineeId(): string {
  nomineeSequence += 1;
  return `nominee-${nomineeSequence}`;
}
