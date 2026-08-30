import { z } from 'zod';

import type { AdminAuditEvent, AdminRole } from '@/types/admin';

/**
 * The operations journal — the only state Admin owns.
 *
 * ## Append-only, and projected rather than mirrored
 *
 * Actions are appended; nothing is ever updated or removed. Whether a product
 * change is awaiting review, or an application was approved, is **derived from
 * the events** by the projections in the admin module. Storing a status beside
 * the event that produced it would be two records of one fact — and an audit
 * log that can disagree with the state it audits is worse than none.
 *
 * ## It records intent, never data
 *
 * An event names its subject by id and carries a one-line summary written in
 * operational language. No customer name, no PAN, no account number, no
 * amount. The schema below is the enforcement: a payload containing anything
 * else fails to parse and is discarded.
 *
 * ## The role, not a person
 *
 * There is no authentication in this build, so there is no user to attribute an
 * action to. Events record the **role** that acted and the demonstration
 * identity's display name. Inventing an operator's name would be inventing a
 * person, on a record whose whole purpose is accountability.
 */

const STORAGE_VERSION = 1;
const JOURNAL_KEY = `fd:admin-journal:v${STORAGE_VERSION}`;
const SESSION_KEY = `fd:admin-session:v${STORAGE_VERSION}`;

const ROLES = ['operations', 'product', 'support', 'auditor'] as const;

const subjectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('customer'), id: z.string().min(1) }),
  z.object({ kind: z.literal('application'), id: z.string().min(1) }),
  z.object({ kind: z.literal('product'), id: z.string().min(1) }),
  z.object({ kind: z.literal('support-request'), id: z.string().min(1) }),
  z.object({ kind: z.literal('kyc-case'), id: z.string().min(1) }),
]);

const eventSchema = z.object({
  id: z.string().min(1),
  at: z.number().int().nonnegative(),
  actorRole: z.enum(ROLES),
  actorName: z.string().min(1),
  action: z.enum([
    'application.reviewed',
    'application.approved',
    'application.rejected',
    'product.change.proposed',
    'product.change.approved',
    'product.change.rejected',
    'support.status.changed',
    'kyc.case.reviewed',
  ]),
  subject: subjectSchema,
  summary: z.string().min(1),
  change: z.object({ field: z.string().min(1), from: z.string(), to: z.string() }).nullable(),
  isSimulated: z.boolean(),
});

const payloadSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  events: z.array(eventSchema),
});

const sessionSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  role: z.enum(ROLES),
});

/** Storage access, guarded — private browsing and policy can both throw. */
function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function write(events: readonly AdminAuditEvent[]): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(JOURNAL_KEY, JSON.stringify({ version: STORAGE_VERSION, events }));
  } catch {
    /* Quota or policy. The list is still correct for this render. */
  }
}

/**
 * Every event, newest first.
 *
 * An unreadable or invalid payload reads as an empty journal rather than being
 * partially trusted: a half-parsed audit log is not an audit log.
 *
 * **Not seeded.** An audit trail that arrives pre-populated with actions nobody
 * took is the one kind of demonstration data this module must not have — the
 * log's entire value is that every line in it happened.
 */
export function readJournal(): AdminAuditEvent[] {
  const storage = safeStorage();
  if (!storage) return [];

  let raw: string | null;
  try {
    raw = storage.getItem(JOURNAL_KEY);
  } catch {
    return [];
  }
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = payloadSchema.safeParse(parsed);
  if (!result.success) return [];

  return [...result.data.events].sort((a, b) => b.at - a.at);
}

/** What an action supplies. Note what it cannot: a timestamp or an id. */
export type NewAuditEvent = Omit<AdminAuditEvent, 'id' | 'at' | 'isSimulated'>;

/**
 * Records an action.
 *
 * The id and the clock are the journal's, and `isSimulated` is always true —
 * a caller that could set it false would be able to write an event claiming
 * something left the platform.
 */
export function appendEvent(event: NewAuditEvent, now: number = Date.now()): AdminAuditEvent[] {
  const existing = readJournal();

  const recorded: AdminAuditEvent = {
    ...event,
    id: `EVT-${String(now)}-${String(existing.length + 1)}`,
    at: now,
    isSimulated: true,
  };

  const next = [recorded, ...existing];
  write(next);
  return next;
}

/** Empties the journal. For tests and an explicit reset; never called by a screen. */
export function clearJournal(): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(JOURNAL_KEY, JSON.stringify({ version: STORAGE_VERSION, events: [] }));
  } catch {
    /* Already unreachable. */
  }
}

/**
 * The role currently being demonstrated.
 *
 * Persisted so switching role survives navigation and a refresh, which is what
 * makes the permission demonstration coherent. It is **not** a session: there is
 * no authentication, and choosing a role here grants nothing beyond what the
 * screens choose to render.
 */
export function readAdminRole(): AdminRole {
  const storage = safeStorage();
  if (!storage) return 'operations';

  try {
    const raw = storage.getItem(SESSION_KEY);
    if (raw === null) return 'operations';

    const result = sessionSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data.role : 'operations';
  } catch {
    return 'operations';
  }
}

export function writeAdminRole(role: AdminRole): AdminRole {
  const storage = safeStorage();
  if (!storage) return role;

  try {
    storage.setItem(SESSION_KEY, JSON.stringify({ version: STORAGE_VERSION, role }));
  } catch {
    /* Quota or policy. The choice still applies for this render. */
  }

  return role;
}

export const ADMIN_JOURNAL_KEY = JOURNAL_KEY;
export const ADMIN_SESSION_KEY = SESSION_KEY;
