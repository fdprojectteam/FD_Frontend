import type { BankBranch, BankInstitution } from '@/types/bank-account';

/**
 * Which bank and branch an IFSC belongs to.
 *
 * ## ⚠ A fixture, and unambiguously so
 *
 * India has around 170,000 IFSC codes and they are published by the RBI and
 * mirrored by several public APIs. **None of that is connected here.** This
 * file is a hand-authored directory covering the codes the demonstration uses,
 * shaped exactly as a real lookup response would be and read through one
 * function — so introducing `GET /ifsc/:code` replaces this file's body and
 * nothing else. The screens already await a resolution.
 *
 * It is the same provenance rule the investor identity fixture follows: a
 * screen may be driven by demo data, but nothing may be *invented* beside it.
 *
 * ## An unknown code resolves to nothing, never to a guess
 *
 * The temptation with IFSC is to read the first four characters as a bank code
 * and infer the institution. That is right often enough to be dangerous: it
 * would confidently name a bank for a mistyped code, and the customer would
 * confirm an account at a bank they do not hold one with. An unrecognised code
 * returns `null`, and the screen says the details could not be identified.
 *
 * ## Format, not existence
 *
 * `isWellFormedIfsc` checks the shape the RBI defines — four letters, a zero,
 * six alphanumerics. A code can be perfectly well formed and belong to no
 * branch, which is precisely why the two checks are separate.
 */

export interface IfscResolution {
  ifsc: string;
  institution: BankInstitution;
  branch: BankBranch;
}

/** Four letters, then `0`, then six alphanumerics — the RBI's own format. */
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function normaliseIfsc(value: string): string {
  return value.trim().toUpperCase();
}

export function isWellFormedIfsc(value: string): boolean {
  return IFSC_PATTERN.test(normaliseIfsc(value));
}

interface DirectoryEntry {
  bank: string;
  initials: string;
  branch: string;
  city: string;
}

/**
 * The demonstration's directory.
 *
 * Includes the codes carried by the seeded accounts, so the details a customer
 * sees in the vault agree with what the lookup would say, plus a handful of
 * well-known branch codes to make the add flow demonstrable.
 */
const DIRECTORY: Readonly<Record<string, DirectoryEntry>> = {
  UTIB0001234: { bank: 'Axis Bank', initials: 'AB', branch: 'Indiranagar', city: 'Bengaluru' },
  HDFC0005678: { bank: 'HDFC Bank', initials: 'HB', branch: 'Koramangala', city: 'Bengaluru' },
  ICIC0009012: { bank: 'ICICI Bank', initials: 'IB', branch: 'Anna Nagar', city: 'Chennai' },
  HDFC0001234: { bank: 'HDFC Bank', initials: 'HB', branch: 'Perungudi', city: 'Chennai' },
  SBIN0001234: {
    bank: 'State Bank of India',
    initials: 'SB',
    branch: 'Mount Road',
    city: 'Chennai',
  },
  KKBK0000123: {
    bank: 'Kotak Mahindra Bank',
    initials: 'KM',
    branch: 'Nungambakkam',
    city: 'Chennai',
  },
  IDFB0040101: {
    bank: 'IDFC FIRST Bank',
    initials: 'ID',
    branch: 'Adyar',
    city: 'Chennai',
  },
  AUBL0002345: {
    bank: 'AU Small Finance Bank',
    initials: 'AU',
    branch: 'Jayanagar',
    city: 'Bengaluru',
  },
};

/**
 * The bank and branch for a code, or `null` when it is not in the directory.
 *
 * Synchronous because the directory is local. The callers treat it as an
 * answer that may not exist, which is the shape a network lookup will also
 * have — so the screens do not change when this becomes a request.
 */
export function resolveIfsc(value: string): IfscResolution | null {
  const ifsc = normaliseIfsc(value);
  if (!isWellFormedIfsc(ifsc)) return null;

  const entry = DIRECTORY[ifsc];
  if (entry === undefined) return null;

  return {
    ifsc,
    institution: { name: entry.bank, initials: entry.initials },
    branch: { name: entry.branch, city: entry.city },
  };
}

/** Codes the demonstration can resolve — shown as examples in the add flow. */
export const SAMPLE_IFSC_CODES: readonly string[] = ['HDFC0001234', 'SBIN0001234', 'UTIB0001234'];
