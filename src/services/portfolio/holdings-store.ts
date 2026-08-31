import { z } from 'zod';

import type { PortfolioHolding } from '@/types/portfolio';

/**
 * Where confirmed deposits are kept.
 *
 * ## ⚠ A POC store, and honest about it
 *
 * There is no authentication and no account service, so there is no server to
 * ask what an investor holds. Holdings are kept in `sessionStorage` — the same
 * place, and for the same reasons, as the booking draft: Document 19 classifies
 * this as operational data, and a shared machine must not keep one person's
 * investments for the next. A real implementation reads holdings from the
 * investor's account, and this file is the seam it replaces.
 *
 * The visible consequence, stated plainly: **holdings live for the browser tab.**
 * A refresh keeps them; closing the tab does not. That is the honest lifetime
 * for a record the platform cannot actually own.
 *
 * ## Reading is a parse, not a cast
 *
 * Same posture as `draft-storage.ts`. Anything that does not match the schema
 * is dropped rather than trusted, because a half-valid holding would render a
 * deposit that does not exist — on the screen whose entire job is to say what
 * the investor owns.
 *
 * ## Append-only, and idempotent on the reference
 *
 * A confirmation may be recorded more than once — a re-render, a refresh on the
 * Success screen, StrictMode. The bank's reference identifies the deposit, so
 * writing the same one twice is a no-op rather than a duplicate holding.
 */
const STORAGE_VERSION = 3;
const STORAGE_KEY = `fd:portfolio-holdings:v${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEY = 'fd:portfolio-holdings:v2';

const bankSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortCode: z.string(),
  initials: z.string(),
  logoUrl: z.string().nullable(),
  rating: z.string().nullable(),
  category: z.enum(['universal', 'small-finance']).optional(),
});

const holdingSchema = z.object({
  reference: z.string().min(1),
  source: z
    .enum(['platform-booked', 'connected', 'imported', 'manually-added'])
    .default('platform-booked'),
  externalReference: z.string().min(1).nullable().default(null),
  productType: z.literal('fixed-deposit'),
  productId: z.string().min(1),
  productName: z.string().min(1),
  bank: bankSchema,
  principal: z.number().int().positive().finite(),
  annualRate: z.number().positive().finite(),
  tenureMonths: z.number().int().nonnegative(),
  isCumulative: z.boolean(),
  payoutLabel: z.string(),
  startedAt: z.number().int().nonnegative(),
  /* Version 2 — the investor's maturity instruction, or `null` if unasked. */
  maturityInstruction: z
    .enum(['renew-principal-and-interest', 'renew-principal-only', 'pay-out'])
    .nullable(),
  /*
    The funding account reference (Module 11). Defaulted rather than versioned:
    a holding written before the vault existed simply has no account to name,
    and `null` is the honest value for it — bumping the version would have
    discarded deposits an investor already holds to add one optional field.
  */
  fundingAccountId: z.string().min(1).nullable().default(null),
  status: z.enum(['active', 'matured', 'closed']),
});

const payloadSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  holdings: z.array(holdingSchema),
});

/* Version 2 had no source metadata. Every record written by that store was a
   confirmed platform booking, so migration can state that fact without guesswork. */
const legacyPayloadSchema = z.object({
  version: z.literal(2),
  holdings: z.array(holdingSchema.omit({ source: true, externalReference: true })),
});

/** Storage access, guarded — see `draft-storage.ts` for why this can throw. */
function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Every confirmed deposit, oldest first. Empty when there is nothing usable. */
export function readHoldings(): PortfolioHolding[] {
  const storage = safeStorage();
  if (!storage) return [];

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }

    const result = payloadSchema.safeParse(parsed);
    return result.success ? result.data.holdings : [];
  }

  /* A successful migration copies the legacy payload forward. The older key is
     intentionally left untouched, so a blocked write cannot erase holdings. */
  let legacyRaw: string | null;
  try {
    legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return [];
  }
  if (!legacyRaw) return [];

  let legacyParsed: unknown;
  try {
    legacyParsed = JSON.parse(legacyRaw);
  } catch {
    return [];
  }

  const legacy = legacyPayloadSchema.safeParse(legacyParsed);
  if (!legacy.success) return [];

  const migrated = legacy.data.holdings.map((holding) => ({
    ...holding,
    source: 'platform-booked' as const,
    externalReference: null,
  }));
  writeHoldings(migrated);
  return migrated;
}

function writeHoldings(holdings: readonly PortfolioHolding[]): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, holdings }));
  } catch {
    /* Quota or policy. The caller still receives its calculated state. */
  }
}

/**
 * Records a confirmed deposit, once.
 *
 * Returns the full list so a caller can render immediately without a second
 * read. A reference already present is left exactly as it was — the first
 * record of a deposit is the true one.
 */
export function recordHolding(holding: PortfolioHolding): PortfolioHolding[] {
  const existing = readHoldings();
  if (existing.some((entry) => entry.reference === holding.reference)) return existing;

  const next = [...existing, holding];

  writeHoldings(next);

  return next;
}

/** Updates only customer-managed sources. Platform bookings remain read-only. */
export function updateHolding(holding: PortfolioHolding): PortfolioHolding[] {
  const existing = readHoldings();
  const index = existing.findIndex((entry) => entry.reference === holding.reference);
  const current = index < 0 ? undefined : existing[index];
  if (!current || current.source === 'platform-booked') return existing;

  const next = [...existing];
  next[index] = holding;
  writeHoldings(next);
  return next;
}

/** Removes only customer-managed sources. Platform bookings are never deleted here. */
export function removeHolding(reference: string): PortfolioHolding[] {
  const existing = readHoldings();
  const found = existing.find((entry) => entry.reference === reference);
  if (!found || found.source === 'platform-booked') return existing;

  const next = existing.filter((entry) => entry.reference !== reference);
  writeHoldings(next);
  return next;
}

/** Clears every holding. For tests and an explicit reset; never called by a screen. */
export function clearHoldings(): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* Already unreachable. */
  }
}

export const HOLDINGS_STORAGE_KEY = STORAGE_KEY;
export const LEGACY_HOLDINGS_STORAGE_KEY = LEGACY_STORAGE_KEY;
