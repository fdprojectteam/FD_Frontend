import type { InvestorIdentity, KycMethod, KycMethodId, KycStatus } from '@/types/investor';

/**
 * KYC readiness — **what is already true, and therefore what to ask for.**
 *
 * ## The rule the whole experience turns on
 *
 * > Determine what already exists. Only request missing information.
 * > — doc 07, Stage 3 (Investor Verification)
 *
 * A form that renders every field it *could* collect is the thing this module
 * exists to prevent. Readiness is computed first; the screen then shows the one
 * action that is actually outstanding, and nothing else.
 *
 * ## Pure, so the decision is testable without a screen
 *
 * Nothing here fetches, navigates or renders. Give it an identity, get back what
 * the platform needs from the investor. That is what lets every branch — already
 * verified, confirm-only, one missing field, nothing on file — be asserted
 * directly rather than inferred from a rendered tree.
 *
 * ## It never claims more than it knows
 *
 * `update-required` is a distinct outcome from `verified`, because a record that
 * needs refreshing is not the same as a current one, and telling an investor
 * they are done when they are not would be the dishonest simplification. Where
 * the platform has no verification at all, readiness says so rather than
 * defaulting to "collect everything".
 */

/** The identity fields the booking journey may need from an investor. */
export type IdentityFieldId = 'fullName' | 'dateOfBirth' | 'mobile' | 'email' | 'address' | 'pan';

/** Customer-facing labels. Plain words, no abbreviation left unexplained. */
export const IDENTITY_FIELD_LABELS: Record<IdentityFieldId, string> = {
  fullName: 'Full name',
  dateOfBirth: 'Date of birth',
  mobile: 'Mobile number',
  email: 'Email address',
  address: 'Address',
  pan: 'PAN',
};

/**
 * What the investor has to do next.
 *
 * Four outcomes, and the screen renders exactly one of them. Adding a fifth is a
 * compile error at the switch that presents them, which is the point.
 */
export type KycOutcome =
  /** Verified and current. Nothing is required; the journey simply continues. */
  | 'already-verified'
  /** Everything is known but the investor has not confirmed it this session. */
  | 'confirm-details'
  /** Some required detail is absent and must be supplied. */
  | 'collect-missing'
  /** Verified once, but the record needs refreshing before continuing. */
  | 'refresh-required';

export interface KycReadiness {
  outcome: KycOutcome;
  /** Fields the platform already holds — these are prefilled, never asked for. */
  knownFields: readonly IdentityFieldId[];
  /** Fields genuinely absent. The only ones the screen may ask for. */
  missingFields: readonly IdentityFieldId[];
  /** Whether a fresh verification step is needed on top of confirmation. */
  requiresVerification: boolean;
  /** Methods that can actually run in this build. May be empty. */
  usableMethods: readonly KycMethodId[];
}

/**
 * The fields a booking requires.
 *
 * PAN is included because doc 11 lists it among the Investor domain's owned
 * data and Indian fixed deposits require it for tax reporting. Aadhaar is
 * **not** in this list: no approved document in this repository states that a
 * deposit booking requires it, and adding it would be inventing a regulatory
 * requirement.
 */
export const REQUIRED_IDENTITY_FIELDS: readonly IdentityFieldId[] = [
  'fullName',
  'dateOfBirth',
  'mobile',
  'pan',
] as const;

/** Fields that improve the record but never block a booking. */
export const OPTIONAL_IDENTITY_FIELDS: readonly IdentityFieldId[] = ['email', 'address'] as const;

function hasValue(value: string | null): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

/** Whether one field is on file, reading the identity's own shape. */
export function isFieldKnown(identity: InvestorIdentity, field: IdentityFieldId): boolean {
  if (field === 'pan') return identity.pan.status !== 'missing' && hasValue(identity.pan.masked);

  return hasValue(identity.profile[field]);
}

/** Verification states that still need the investor to do something. */
const NEEDS_VERIFICATION: readonly KycStatus[] = ['not-started', 'in-progress', 'update-required'];

export function deriveKycReadiness(
  identity: InvestorIdentity,
  methods: readonly KycMethod[],
): KycReadiness {
  const allFields = [...REQUIRED_IDENTITY_FIELDS, ...OPTIONAL_IDENTITY_FIELDS];

  const knownFields = allFields.filter((field) => isFieldKnown(identity, field));
  const missingFields = REQUIRED_IDENTITY_FIELDS.filter((field) => !isFieldKnown(identity, field));

  const usableMethods = methods
    .filter((method) => method.availability === 'available')
    .map((method) => method.id);

  const requiresVerification = NEEDS_VERIFICATION.includes(identity.kyc.status);

  /*
    Order matters, and it is the order of honesty rather than convenience.

    A missing required field outranks everything: the platform cannot verify an
    investor whose name it does not have, whatever the stored status says. A
    record needing refresh outranks "verified", because it is not current. Only
    when nothing is missing and nothing needs refreshing is the outcome the
    quiet one.
  */
  const outcome: KycOutcome =
    missingFields.length > 0
      ? 'collect-missing'
      : identity.kyc.status === 'update-required'
        ? 'refresh-required'
        : requiresVerification
          ? 'confirm-details'
          : 'already-verified';

  return { outcome, knownFields, missingFields, requiresVerification, usableMethods };
}

/**
 * Whether the journey may continue past identity verification.
 *
 * `already-verified` passes without the investor doing anything — which is the
 * returning-customer experience, expressed as a rule rather than as a screen
 * state. Every other outcome needs their confirmation, recorded on the booking.
 */
export function isIdentityCleared(readiness: KycReadiness, hasConfirmed: boolean): boolean {
  return readiness.outcome === 'already-verified' || hasConfirmed;
}
