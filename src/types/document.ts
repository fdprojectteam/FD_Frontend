/**
 * What a document *is* on this platform — who issued it, whether it exists yet,
 * and what it is a document **about**.
 *
 * ## Why this is platform-level rather than Portfolio's
 *
 * A statement is a projection of a holding today. The same vocabulary has to
 * describe a bank's deposit advice, a tax certificate and, later, a reference
 * into a secure document store — none of which belong to the portfolio module.
 * Putting the model here keeps the *shape* of "a document" in one place while
 * each domain supplies its own projection, the same reasoning that put
 * `PortfolioHolding` and `AppNotification` here.
 *
 * ## The one rule this file exists to enforce
 *
 * **A document that does not exist cannot carry the properties of one that
 * does.** `DocumentAvailability` is a discriminated union rather than a status
 * field beside optional metadata: an unavailable document has no `generatedAt`,
 * no file name and no origin to read, because there is nothing to generate,
 * save or attribute. A boolean flag would have let a screen render a download
 * button for a bank certificate this build cannot produce — the exact failure
 * this module must not ship.
 *
 * ## The ladder this is built to climb
 *
 * ```
 * platform-derived  →  bank-issued  →  official bank document  →  external store
 * ```
 *
 * Only the first rung is implemented, and `DocumentOrigin` has exactly one
 * member for that reason. The next rung is a new member plus the retrieval that
 * justifies it — never a relabelling of a document the platform derived itself.
 */

/** The document types this product recognises. FD-only, deliberately. */
export type DocumentKind =
  /** Every holding on one sheet. */
  | 'portfolio-statement'
  /** One deposit: its terms, and what they are expected to produce. */
  | 'fd-statement'
  /** The platform's record of a completed booking. */
  | 'booking-confirmation'
  /** When a deposit matures and the instruction that applies. */
  | 'maturity-advice'
  /** The bank's own deposit advice. Recognised, not produced. */
  | 'bank-deposit-advice';

/**
 * Who stands behind the document.
 *
 * Kept separate from availability on purpose: the *issuer* of a deposit advice
 * is the bank whether or not the platform can obtain one, and the investor
 * needs to know where an official document comes from in order to go and ask
 * for it.
 */
export type DocumentIssuer = 'platform' | 'bank';

/**
 * How an available document came to exist.
 *
 * One member, because one is all this build can honestly claim. A document
 * derived from the platform's own records is not a bank document, and no code
 * path may describe it as one.
 */
export type DocumentOrigin = 'platform-derived';

export type DocumentAvailability =
  | {
      status: 'available';
      origin: DocumentOrigin;
      /** Epoch ms this projection was derived. Documents are not stored. */
      generatedAt: number;
      /** Suggested save name, without an extension. */
      fileName: string;
    }
  | {
      status: 'unavailable';
      /** Stated to the investor in full. Never "coming soon" alone. */
      reason: string;
    };

/** What the document is about — never the data it contains. */
export interface DocumentSubject {
  kind: 'portfolio' | 'holding';
  /** The holding's bank reference, or `portfolio` for the consolidated sheet. */
  id: string;
}

export interface DocumentDescriptor {
  /** Stable and subject-derived, so a document keeps its URL across reads. */
  id: string;
  kind: DocumentKind;
  title: string;
  /** One line saying what this document answers. */
  description: string;
  issuer: DocumentIssuer;
  subject: DocumentSubject;
  availability: DocumentAvailability;
}

/**
 * One labelled value on a document.
 *
 * `value` is `null` when the platform genuinely does not hold the figure — a
 * maturity date for a deposit whose term is published in days, an instruction
 * the bank's form never asked for. The document says so in that row rather than
 * omitting it silently or filling it with a default, because a statement that
 * quietly drops a field reads as complete when it is not.
 */
export interface DocumentField {
  label: string;
  value: string | null;
  /** Why the value is absent, or what it is derived from. */
  hint?: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  fields: readonly DocumentField[];
}

/** A tabular block — used by the consolidated statement, which lists deposits. */
export interface DocumentTable {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  /** Totals row, when every column can honestly be totalled. */
  totals: readonly string[] | null;
}

/**
 * A rendered document: the descriptor plus everything printed on the sheet.
 *
 * Built on read from canonical domain data and thrown away. Nothing here is
 * persisted — a stored statement is a figure that can disagree with the deposit
 * it describes, which is the one thing a statement must never do.
 */
export interface DocumentContent {
  descriptor: DocumentDescriptor;
  /** Who the document is for, as far as the identity record says. */
  issuedTo: DocumentField[];
  sections: readonly DocumentSection[];
  table: DocumentTable | null;
  /** Statements of provenance and derivation, printed at the foot. */
  notes: readonly string[];
}
