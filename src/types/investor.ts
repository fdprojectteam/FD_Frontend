/**
 * The investor's identity — the platform's Investor domain (doc 11, Domain 1).
 *
 * ## Why this lives in `types/`, not in a module
 *
 * Doc 11 lists the Investor domain as *used by* Booking, Portfolio, Support and
 * future products, and doc 10 states the platform must "reuse verified investor
 * information wherever possible, minimizing repeated data entry". A copy of this
 * shape inside Booking would be the first of four copies, and the fourth would
 * disagree with the first.
 *
 * So identity is platform vocabulary, exactly as `Bank` and `Tenure` are. Booking
 * consumes it; it belongs to no module.
 *
 * ## Nothing here is a document
 *
 * There is no PAN number, no Aadhaar number and no uploaded file in this type —
 * only a **masked** last-four and a status. Doc 15 (Security Principles) requires
 * identity numbers to be protected at rest, and a type that cannot hold one
 * cannot leak one. That is the same reasoning `BankAccount` follows for account
 * numbers, applied to the identifiers that carry more risk.
 */

/** How far identity verification has actually progressed. */
export type KycStatus =
  /** Nothing on file. The investor has not been through verification. */
  | 'not-started'
  /** Some identifiers are on file; verification has not completed. */
  | 'in-progress'
  /** Verified, and the verification is still current. */
  | 'verified'
  /**
   * Verified once, but the record now needs refreshing.
   *
   * A distinct state on purpose: telling someone they are verified when their
   * record needs updating would be the dishonest simplification. Periodic
   * re-verification is a real requirement for Indian KYC, and the type carries
   * it rather than pretending verification is permanent.
   */
  | 'update-required';

/** Whether one identifier is on file and confirmed. */
export type IdentifierStatus = 'verified' | 'on-file' | 'missing';

/**
 * The verification routes the product may offer.
 *
 * Declared as a closed union so the orchestrator is exhaustive over them, and so
 * adding a real integration is a compile error at every place that must handle
 * it — rather than a silent gap.
 *
 * **Declaring a method is not claiming it works.** `KycMethod.availability`
 * carries that, and in this POC most of these are `not-connected`.
 */
export type KycMethodId =
  /** Reuse an existing verified record. No new information is collected. */
  | 'existing-kyc'
  /** Central KYC Registry lookup. */
  | 'ckyc'
  /** Documents fetched from the investor's DigiLocker, with consent. */
  | 'digilocker'
  /** Aadhaar-based electronic KYC, where permitted for the product. */
  | 'aadhaar-ekyc'
  /** Video Customer Identification Process. */
  | 'video-cip'
  /** Assisted or manual review when no digital route completes. */
  | 'assisted';

export type KycMethodAvailability =
  /** Usable in this build. */
  | 'available'
  /** Modelled, but no integration exists yet. Never offered as usable. */
  | 'not-connected';

export interface KycMethod {
  id: KycMethodId;
  /** Plain words. No abbreviation reaches the screen unexplained. */
  label: string;
  description: string;
  availability: KycMethodAvailability;
}

/** One identifier the regulator or partner bank may require. */
export interface InvestorIdentifier {
  status: IdentifierStatus;
  /**
   * The only part of the number the platform holds — e.g. `••••1234`.
   *
   * `null` when nothing is on file. There is deliberately no field for the
   * whole number.
   */
  masked: string | null;
}

/** Contact and personal details, as far as they are known. */
export interface InvestorProfile {
  fullName: string | null;
  /** ISO `YYYY-MM-DD`, or `null`. Formatting belongs to the screen. */
  dateOfBirth: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
}

/**
 * Everything the platform knows about who is investing.
 *
 * One object, so a consumer asks once and gets a complete answer — the
 * precondition for "ask less, prefill more".
 */
export interface InvestorIdentity {
  investorId: string;
  profile: InvestorProfile;
  pan: InvestorIdentifier;
  aadhaar: InvestorIdentifier;
  kyc: {
    status: KycStatus;
    /** Which route produced the current record, or `null` if none has. */
    method: KycMethodId | null;
    /** ISO timestamp of the last completed verification, or `null`. */
    verifiedAt: string | null;
    /**
     * When the record stops being current, or `null` when no expiry applies.
     *
     * Nullable rather than assumed: the platform must not invent a validity
     * period the partner bank has not stated.
     */
    validUntil: string | null;
  };
}
