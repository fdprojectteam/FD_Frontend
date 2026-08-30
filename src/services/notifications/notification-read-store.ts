import { z } from 'zod';

/**
 * Which notifications the investor has already seen.
 *
 * ## The only state this module owns
 *
 * Notifications themselves are derived from holdings and identity on every
 * read, so there is nothing to persist about them. What cannot be derived is
 * whether a person has looked at one — so that, and only that, is stored.
 *
 * A set of ids. No titles, no amounts, no bank names, no reference numbers
 * beyond the ids that are already the investor's own. Nothing here is PII, and
 * losing the file costs a few "unread" dots.
 *
 * ## `sessionStorage`, like everything else in this build
 *
 * The same posture the booking draft and the holdings store take: Document 19
 * treats this as operational data, and a shared machine must not carry one
 * person's state into the next. A real implementation reads this from the
 * investor's account.
 *
 * Reading is a parse, not a cast — an unrecognised payload yields "nothing
 * read", which is the safe direction: at worst the investor sees a notification
 * they had already dismissed.
 */
const STORAGE_VERSION = 1;
const STORAGE_KEY = `fd:notifications-read:v${STORAGE_VERSION}`;

const payloadSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  readIds: z.array(z.string().min(1)),
});

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readReadIds(): string[] {
  const storage = safeStorage();
  if (!storage) return [];

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = payloadSchema.safeParse(parsed);
  return result.success ? result.data.readIds : [];
}

/** Marks ids as read and returns the full set. Idempotent. */
export function markRead(ids: readonly string[]): string[] {
  const next = [...new Set([...readReadIds(), ...ids])];

  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, readIds: next }));
    } catch {
      /* Quota or policy. The set is still correct for this render. */
    }
  }

  return next;
}

export function clearReadIds(): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* Already unreachable. */
  }
}

export const NOTIFICATIONS_READ_STORAGE_KEY = STORAGE_KEY;
