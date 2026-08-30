/**
 * A conversation with support — and nothing about the customer's money.
 *
 * ## What Support owns
 *
 * The **interaction**: what was asked, when, about which entity, and where it
 * has got to. That is all. A support request refers to a deposit by its bank
 * reference and to an account by its vault id; it never carries the principal,
 * the rate, the maturity value, the bank name, four digits of an account
 * number, or anything from the identity record.
 *
 * ```
 * SupportRequest ──refers to──▶ holding reference   (Portfolio is authoritative)
 *                └─refers to──▶ bank account id     (the vault is authoritative)
 * ```
 *
 * The reason is not tidiness. A copied figure goes stale, and a support screen
 * is the last place a customer should be shown a number that disagrees with
 * their portfolio. Every financial value the support screens display is read
 * from the canonical domain at render time.
 *
 * ## Nobody is on the other end
 *
 * There is no support desk, no agent, no ticketing system and no email in this
 * build. `SupportMessage.author` therefore has **no `agent` member**: a message
 * is either the customer's or the platform's own automated acknowledgement, and
 * `isSimulated` is on every record. A type that cannot represent an agent
 * cannot accidentally imply one replied.
 *
 * ## The seams this leaves
 *
 * `SupportSubjectKind` gains a member when a domain gains a support entry point
 * — a booking, a document, a family member. `SupportChannel` gains one when a
 * real channel exists. Neither is a relabelling of what is here.
 */

/** What the request is about. FD-first, and open to more. */
export type SupportCategory =
  'fd-booking' | 'payment' | 'verification' | 'bank-account' | 'maturity' | 'documents' | 'general';

/**
 * Where a request has got to.
 *
 * Five states, each of which this build can genuinely reach:
 * - `open` — recorded, nothing has happened to it yet.
 * - `in-progress` — being looked at.
 * - `waiting-for-customer` — the customer has something to do.
 * - `resolved` — an answer was given.
 * - `closed` — finished, with no further action.
 *
 * No `escalated`, no `sla-breached`, no priority ladder: this build has no
 * process behind any of them.
 */
export type SupportStatus = 'open' | 'in-progress' | 'waiting-for-customer' | 'resolved' | 'closed';

/** What the request is attached to, by reference. */
export type SupportSubject =
  /** No particular entity — general help. */
  | { kind: 'none' }
  /** A deposit the investor holds, by its bank reference. */
  | { kind: 'holding'; reference: string }
  /** An account in the vault, by its opaque id. */
  | { kind: 'bank-account'; accountId: string };

export type SupportSubjectKind = SupportSubject['kind'];

/**
 * Who wrote a message.
 *
 * `platform` is this application acknowledging something automatically. It is
 * **not** a person, and the wording it produces never implies one.
 */
export type SupportMessageAuthor = 'customer' | 'platform';

export interface SupportMessage {
  id: string;
  author: SupportMessageAuthor;
  body: string;
  at: number;
  /** True for anything the platform generated rather than a person writing it. */
  isSimulated: boolean;
}

export interface SupportRequest {
  /** `SUP-1042` — the number the customer quotes. Carries no personal data. */
  id: string;
  category: SupportCategory;
  status: SupportStatus;
  /** One line, written by the customer or chosen from a topic. */
  subject: string;
  /** What the request is attached to. A reference, never a copy. */
  relatedTo: SupportSubject;
  messages: readonly SupportMessage[];
  createdAt: number;
  updatedAt: number;
  /**
   * True for every request in this build.
   *
   * Nothing was sent anywhere: no support desk received it, no bank was
   * contacted, no email or message was delivered. The screens say so, and this
   * flag is what they read.
   */
  isSimulated: boolean;
}
