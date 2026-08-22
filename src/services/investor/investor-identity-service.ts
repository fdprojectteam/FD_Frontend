import type { InvestorIdentity } from '@/types/investor';

/**
 * Where the investor's identity comes from.
 *
 * ## ⚠ A fixture, and unambiguously so
 *
 * There is no authentication in this build, no investor service and no session —
 * so there is no real person whose record this could be. This returns a
 * hand-authored identity so the readiness rules, the prefill experience and the
 * returning-customer path can all be exercised end to end.
 *
 * It is shaped exactly as a real service response would be, and it is read
 * through this one function, so introducing `GET /investors/me` replaces this
 * file's body and nothing else. The screens already read a hook.
 *
 * ## Why the fixture is "verified", not empty
 *
 * The experience being built is *"most of the work is done for you"*. A fixture
 * with nothing on file would demonstrate the opposite and would leave the
 * prefill and returning-customer paths untested. The other states are reachable
 * through `identityWithStatus`, which the readiness tests drive directly.
 */

/** The demo investor. Transcribed from no one; every value is invented for the POC. */
const DEMO_INVESTOR: InvestorIdentity = {
  investorId: 'inv-demo-0001',
  profile: {
    fullName: 'Arjun Sharma',
    dateOfBirth: '1984-07-19',
    mobile: '+91 98••• ••210',
    email: 'a••••@example.com',
    address: 'Indiranagar, Bengaluru, Karnataka 560038',
  },
  pan: { status: 'verified', masked: '••••• 4321F' },
  aadhaar: { status: 'verified', masked: '•••• •••• 7788' },
  kyc: {
    /**
     * On file, **not yet confirmed for this application.**
     *
     * This was `verified`, which made the step disappear: readiness resolved to
     * `already-verified`, the screen said "nothing to do", and a customer — or
     * an investor being shown the product — passed through identity
     * verification without seeing it happen. The platform appeared to have
     * silently decided something about them.
     *
     * `in-progress` is also the more honest state for this build: details are on
     * file, and **no external provider has verified anything**, because none is
     * connected. Readiness therefore resolves to `confirm-details`, which is
     * exactly the experience the journey should demonstrate — the customer reads
     * what is held about them and confirms it.
     *
     * A returning customer whose record *has* been confirmed still skips the
     * work; that path is `already-verified` and is covered by the readiness
     * tests. Changing this one field is what switches between them.
     */
    status: 'in-progress',
    method: null,
    /* Nothing has verified this record, so there is no date to state. */
    verifiedAt: null,
    /* No expiry is asserted — the partner bank has stated none. */
    validUntil: null,
  },
};

export interface InvestorIdentityService {
  /** The signed-in investor's identity, or `null` when none is on file. */
  findCurrent(): Promise<InvestorIdentity | null>;
}

export function createInvestorIdentityService(): InvestorIdentityService {
  return {
    findCurrent: () => Promise.resolve(DEMO_INVESTOR),
  };
}

/**
 * The demo identity with a different verification status.
 *
 * Exported for verification: the four readiness outcomes are properties of the
 * rules, and asserting them needs identities in each state without a service, a
 * network or a React tree.
 */
export function identityWithStatus(
  status: InvestorIdentity['kyc']['status'],
  overrides: Partial<InvestorIdentity> = {},
): InvestorIdentity {
  return {
    ...DEMO_INVESTOR,
    ...overrides,
    kyc: { ...DEMO_INVESTOR.kyc, status },
  };
}
