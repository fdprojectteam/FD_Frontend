import { z } from 'zod';

import type { SupportCategory, SupportRequest, SupportSubject } from '@/types/support';

/**
 * Where support requests live.
 *
 * ## Support interaction only
 *
 * This store holds requests: a number, a category, a status, a message thread
 * and a reference to the entity the request is about. It holds **no financial
 * data** — no principal, no rate, no maturity value, no bank name, no account
 * digits — and `SupportRequest` has no field for any of them, so it could not
 * if a caller tried.
 *
 * ## `sessionStorage`, like every other client record here
 *
 * The same choice the booking draft, the holdings store and the account vault
 * make: this build has no server and no authentication, so a record that
 * outlived the tab would be an unowned one.
 *
 * ## Seeded, so the lifecycle is visible
 *
 * Two demonstration requests, both marked `isSimulated` and shown as demo
 * requests on screen. Without them the status model would be undemonstrable —
 * a newly created request can only ever be `open`, because there is nobody to
 * move it along. `clearRequests()` empties the store and the empty state is
 * exactly what a customer who has never contacted support sees.
 *
 * Neither seed refers to a deposit or an account. A seeded reference would
 * name an entity this investor does not hold, and a support request pointing at
 * a deposit that does not exist is a worse demonstration than one that points
 * at nothing.
 */

const STORAGE_VERSION = 1;
const STORAGE_KEY = `fd:support-requests:v${STORAGE_VERSION}`;

const subjectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('holding'), reference: z.string().min(1) }),
  z.object({ kind: z.literal('bank-account'), accountId: z.string().min(1) }),
]);

const messageSchema = z.object({
  id: z.string().min(1),
  author: z.enum(['customer', 'platform']),
  body: z.string().min(1),
  at: z.number().int().nonnegative(),
  isSimulated: z.boolean(),
});

const requestSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    'fd-booking',
    'payment',
    'verification',
    'bank-account',
    'maturity',
    'documents',
    'general',
  ]),
  status: z.enum(['open', 'in-progress', 'waiting-for-customer', 'resolved', 'closed']),
  subject: z.string().min(1),
  relatedTo: subjectSchema,
  messages: z.array(messageSchema),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  isSimulated: z.boolean(),
});

const payloadSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  requests: z.array(requestSchema),
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

/**
 * What the platform says back, immediately, on every request it records.
 *
 * Written once and used everywhere so no screen can soften it. It states what
 * actually happened — a record was created on this device — and what did not.
 */
export const DEMO_ACKNOWLEDGEMENT =
  'Your request has been recorded in this demonstration environment. No support team, bank or external system was contacted, and no email or message was sent. In a live build this is where a reply would appear.';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The demonstration requests.
 *
 * Fixed offsets from `now` rather than fixed dates, so the demonstration does
 * not age into "submitted two years ago".
 */
export function demoRequests(now: number): SupportRequest[] {
  return [
    {
      id: 'SUP-1042',
      category: 'fd-booking',
      status: 'in-progress',
      subject: 'My FD application is still being processed',
      relatedTo: { kind: 'none' },
      messages: [
        {
          id: 'SUP-1042-m1',
          author: 'customer',
          body: 'I submitted my application a few days ago and it still shows as processing.',
          at: now - 3 * DAY_MS,
          isSimulated: true,
        },
        {
          id: 'SUP-1042-m2',
          author: 'platform',
          body: DEMO_ACKNOWLEDGEMENT,
          at: now - 3 * DAY_MS,
          isSimulated: true,
        },
      ],
      createdAt: now - 3 * DAY_MS,
      updatedAt: now - 2 * DAY_MS,
      isSimulated: true,
    },
    {
      id: 'SUP-1038',
      category: 'bank-account',
      status: 'resolved',
      subject: 'How do I change which account funds my deposits?',
      relatedTo: { kind: 'none' },
      messages: [
        {
          id: 'SUP-1038-m1',
          author: 'customer',
          body: 'I want a different account to be used by default.',
          at: now - 9 * DAY_MS,
          isSimulated: true,
        },
        {
          id: 'SUP-1038-m2',
          author: 'platform',
          body: 'Open Bank accounts, choose the account you want, and select “Set as primary”. The primary account is the default for supported funding and payout flows.',
          at: now - 8 * DAY_MS,
          isSimulated: true,
        },
      ],
      createdAt: now - 9 * DAY_MS,
      updatedAt: now - 8 * DAY_MS,
      isSimulated: true,
    },
  ];
}

function write(requests: readonly SupportRequest[]): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, requests }));
  } catch {
    /* Quota or policy. The list is still correct for this render. */
  }
}

/**
 * Every request, newest first.
 *
 * A first read seeds the demonstration requests. An unreadable or invalid
 * payload reads as an empty list rather than being partially trusted.
 */
export function readRequests(now: number = Date.now()): SupportRequest[] {
  const storage = safeStorage();
  if (!storage) return demoRequests(now);

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return demoRequests(now);
  }

  if (raw === null) {
    const seeded = demoRequests(now);
    write(seeded);
    return seeded;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = payloadSchema.safeParse(parsed);
  if (!result.success) return [];

  return [...result.data.requests].sort((a, b) => b.createdAt - a.createdAt);
}

export function findRequest(id: string, now: number = Date.now()): SupportRequest | null {
  return readRequests(now).find((request) => request.id === id) ?? null;
}

/** What the contact form supplies. Note what it cannot: a status. */
export interface NewSupportRequest {
  category: SupportCategory;
  subject: string;
  message: string;
  relatedTo: SupportSubject;
}

/**
 * `SUP-1043` — sequential from the highest existing number.
 *
 * Readable, quotable, and carrying nothing personal. Deliberately not a random
 * id: a support number is something a customer reads out.
 */
function nextRequestId(existing: readonly SupportRequest[]): string {
  const highest = existing.reduce((max, request) => {
    const parsed = Number(/^SUP-(\d+)$/.exec(request.id)?.[1] ?? '0');
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 1000);

  return `SUP-${String(highest + 1)}`;
}

/**
 * Records a request.
 *
 * **Always `open`, always simulated, always acknowledged.** The caller cannot
 * choose a status — a caller that could would be able to create a request that
 * claimed somebody was already working on it. The platform's acknowledgement is
 * appended immediately, and it says plainly that nothing was sent anywhere.
 */
export function createRequest(input: NewSupportRequest, now: number = Date.now()): SupportRequest {
  const existing = readRequests(now);
  const id = nextRequestId(existing);

  const request: SupportRequest = {
    id,
    category: input.category,
    status: 'open',
    subject: input.subject.trim(),
    relatedTo: input.relatedTo,
    messages: [
      {
        id: `${id}-m1`,
        author: 'customer',
        body: input.message.trim(),
        at: now,
        isSimulated: false,
      },
      {
        id: `${id}-m2`,
        author: 'platform',
        body: DEMO_ACKNOWLEDGEMENT,
        at: now,
        isSimulated: true,
      },
    ],
    createdAt: now,
    updatedAt: now,
    isSimulated: true,
  };

  write([request, ...existing]);
  return request;
}

/**
 * Adds the customer's reply.
 *
 * A reply moves a request that was waiting on the customer back to
 * `in-progress`, because the customer has done their part. Nothing else about
 * the status changes: this build has nobody who could move it further.
 */
export function replyToRequest(
  id: string,
  body: string,
  now: number = Date.now(),
): SupportRequest[] {
  const existing = readRequests(now);

  const next = existing.map((request) => {
    if (request.id !== id) return request;

    return {
      ...request,
      status: request.status === 'waiting-for-customer' ? ('in-progress' as const) : request.status,
      messages: [
        ...request.messages,
        {
          id: `${id}-m${String(request.messages.length + 1)}`,
          author: 'customer' as const,
          body: body.trim(),
          at: now,
          isSimulated: false,
        },
      ],
      updatedAt: now,
    };
  });

  write(next);
  return next;
}

/**
 * Moves a request to another status, as an operator would.
 *
 * **The integration seam Admin needed** (Module 15). Support remains the single
 * owner of a request: the operations console calls this rather than keeping a
 * second copy of the queue, so a status the admin sets is the status the
 * customer sees. The change is recorded in the admin journal separately — that
 * records *who acted*, which is not something a support request should carry.
 *
 * A note may be appended with the change, attributed to the platform. There is
 * still no `agent` author to write as, because there is still no agent.
 */
export function setRequestStatus(
  id: string,
  status: SupportRequest['status'],
  note: string | null = null,
  now: number = Date.now(),
): SupportRequest[] {
  const existing = readRequests(now);

  const next = existing.map((request) => {
    if (request.id !== id) return request;

    return {
      ...request,
      status,
      messages:
        note === null
          ? request.messages
          : [
              ...request.messages,
              {
                id: `${id}-m${String(request.messages.length + 1)}`,
                author: 'platform' as const,
                body: note,
                at: now,
                isSimulated: true,
              },
            ],
      updatedAt: now,
    };
  });

  write(next);
  return next;
}

/** Empties the store. For tests and an explicit reset; never called by a screen. */
export function clearRequests(): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, requests: [] }));
  } catch {
    /* Already unreachable. */
  }
}

export const SUPPORT_STORAGE_KEY = STORAGE_KEY;
