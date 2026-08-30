import type {
  DocumentDescriptor,
  DocumentIssuer,
  DocumentKind,
  DocumentSubject,
} from '@/types/document';
import type { MaturityEntry, MaturitySchedule } from '@/utils/portfolio';
import type { PortfolioSummary } from '@/utils/portfolio';

/**
 * Which documents exist for this investor, and which do not.
 *
 * ## A catalogue, not a store
 *
 * Nothing here is written down. The catalogue is **derived on every read** from
 * the same holdings the dashboard and the maturity screen use, so a document
 * cannot describe a deposit that has changed underneath it, and a deposit that
 * was never confirmed cannot have a statement. Reports are a projection —
 * `Portfolio / Booking / Maturity → canonical data → report projection` — and
 * this file is the projection step.
 *
 * ## Availability is decided here, once
 *
 * Whether a document can be produced is a property of the data, not of the
 * screen: a maturity advice needs a maturity date, and a deposit whose term the
 * bank publishes in days has none. Deciding it here means the list, the
 * document view and the print action all get the same answer, and none of them
 * can offer an action the platform cannot honour.
 *
 * ## Bank documents are listed, never produced
 *
 * The deposit advice a bank issues is the document an investor is most likely
 * to be looking for, so hiding it would answer their question with silence.
 * It is listed with its real issuer and an honest reason it is not here —
 * there is no connection to any bank's document system in this build — and the
 * type system makes it impossible for it to carry a file name or a generated
 * date.
 *
 * Pure and React-free; the caller supplies `now`.
 */

/** The consolidated sheet has one subject: the portfolio itself. */
export const PORTFOLIO_SUBJECT_ID = 'portfolio';

/**
 * `fd-statement--FD-2026-0001`.
 *
 * Two segments joined by a double dash: the kind, then the subject. Readable in
 * a URL, stable across reads, and unambiguous — a bank reference may contain a
 * single dash, so a single-dash separator would be guesswork.
 */
const SEPARATOR = '--';

export function documentId(kind: DocumentKind, subjectId: string): string {
  return kind === 'portfolio-statement' ? kind : `${kind}${SEPARATOR}${subjectId}`;
}

export interface ParsedDocumentId {
  kind: DocumentKind;
  subjectId: string;
}

const KINDS: readonly DocumentKind[] = [
  'portfolio-statement',
  'fd-statement',
  'booking-confirmation',
  'maturity-advice',
  'bank-deposit-advice',
];

/**
 * The reverse, fail-closed.
 *
 * An id that names no known kind returns `null` rather than a guess, so an
 * unknown or hand-edited URL reaches the "no such document" state instead of
 * rendering an empty sheet that looks official.
 */
export function parseDocumentId(id: string): ParsedDocumentId | null {
  if (id === 'portfolio-statement')
    return { kind: 'portfolio-statement', subjectId: PORTFOLIO_SUBJECT_ID };

  const index = id.indexOf(SEPARATOR);
  if (index <= 0) return null;

  const kind = id.slice(0, index);
  const subjectId = id.slice(index + SEPARATOR.length);

  if (subjectId === '') return null;
  if (!KINDS.includes(kind as DocumentKind)) return null;
  if (kind === 'portfolio-statement') return null;

  return { kind: kind as DocumentKind, subjectId };
}

/** Safe for a file name on every platform, and still readable. */
function slug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

/** `2026-08-27` — sortable, unambiguous, and the same in every locale. */
function isoDay(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}

function holdingSubject(reference: string): DocumentSubject {
  return { kind: 'holding', id: reference };
}

interface AvailableInput {
  kind: DocumentKind;
  title: string;
  description: string;
  subject: DocumentSubject;
  fileName: string;
  now: number;
}

function available({
  kind,
  title,
  description,
  subject,
  fileName,
  now,
}: AvailableInput): DocumentDescriptor {
  return {
    id: documentId(kind, subject.id),
    kind,
    title,
    description,
    issuer: 'platform',
    subject,
    availability: { status: 'available', origin: 'platform-derived', generatedAt: now, fileName },
  };
}

interface UnavailableInput {
  kind: DocumentKind;
  title: string;
  description: string;
  subject: DocumentSubject;
  issuer: DocumentIssuer;
  reason: string;
}

function unavailable({
  kind,
  title,
  description,
  subject,
  issuer,
  reason,
}: UnavailableInput): DocumentDescriptor {
  return {
    id: documentId(kind, subject.id),
    kind,
    title,
    description,
    issuer,
    subject,
    availability: { status: 'unavailable', reason },
  };
}

/**
 * The reason no bank document is here.
 *
 * Written once and used everywhere, so no screen can soften it. It states the
 * cause — no integration — rather than promising a date nobody has committed
 * to.
 */
export const BANK_DOCUMENT_REASON =
  'Issued by the bank. This platform has no connection to bank document systems, so the original cannot be shown here — ask the bank for a copy.';

/** Documents for one deposit, in the order an investor would look for them. */
export function documentsForHolding(entry: MaturityEntry, now: number): DocumentDescriptor[] {
  const { holding } = entry.view;
  const subject = holdingSubject(holding.reference);
  const bankSlug = slug(holding.bank.name);
  const day = isoDay(now);

  const documents: DocumentDescriptor[] = [
    available({
      kind: 'fd-statement',
      title: 'Fixed deposit statement',
      description: 'The terms of this deposit and what it is expected to pay.',
      subject,
      fileName: `fd-statement-${bankSlug}-${slug(holding.reference)}-${day}`,
      now,
    }),
    available({
      kind: 'booking-confirmation',
      title: 'Booking confirmation',
      description: 'The platform’s record of this booking, with its reference.',
      subject,
      fileName: `booking-confirmation-${bankSlug}-${slug(holding.reference)}-${day}`,
      now,
    }),
  ];

  /*
    A maturity advice is a statement about a date. Without one there is nothing
    to advise, and saying "shortly" for a 91-day deposit would be inventing the
    very figure the platform has refused to approximate everywhere else.
  */
  documents.push(
    entry.stage === 'undated'
      ? unavailable({
          kind: 'maturity-advice',
          title: 'Maturity advice',
          description: 'When this deposit matures and the instruction that applies.',
          subject,
          issuer: 'platform',
          reason:
            'This deposit’s term is published in days, so the platform has no maturity date to state.',
        })
      : available({
          kind: 'maturity-advice',
          title: 'Maturity advice',
          description: 'When this deposit matures and the instruction that applies.',
          subject,
          fileName: `maturity-advice-${bankSlug}-${slug(holding.reference)}-${day}`,
          now,
        }),
  );

  documents.push(
    unavailable({
      kind: 'bank-deposit-advice',
      title: 'Bank deposit advice',
      description: `${holding.bank.name}’s own confirmation of this deposit.`,
      subject,
      issuer: 'bank',
      reason: BANK_DOCUMENT_REASON,
    }),
  );

  return documents;
}

/** One deposit and every document that belongs to it. */
export interface HoldingDocumentGroup {
  entry: MaturityEntry;
  documents: readonly DocumentDescriptor[];
}

export interface ReportCatalogue {
  /** The consolidated sheet, or `null` when there is nothing to consolidate. */
  portfolioStatement: DocumentDescriptor | null;
  byHolding: readonly HoldingDocumentGroup[];
  /** Every descriptor, flattened — the lookup the document route uses. */
  all: readonly DocumentDescriptor[];
  availableCount: number;
  generatedAt: number;
}

/**
 * Everything available to this investor.
 *
 * Takes the summary and the schedule rather than raw holdings, so the figures a
 * document prints and the figures the dashboard shows come from one derivation
 * — there is no second calculation of a maturity date or a maturity value
 * anywhere in this module.
 */
export function buildReportCatalogue(
  summary: PortfolioSummary,
  schedule: MaturitySchedule,
  now: number = Date.now(),
): ReportCatalogue {
  /*
    Every deposit that has a schedule position, in the order the maturity screen
    presents them: what is coming, then what has passed, then what has no date.
  */
  const entries: MaturityEntry[] = [...schedule.upcoming, ...schedule.matured, ...schedule.undated];

  const byHolding: HoldingDocumentGroup[] = entries.map((entry) => ({
    entry,
    documents: documentsForHolding(entry, now),
  }));

  const portfolioStatement =
    entries.length === 0
      ? null
      : available({
          kind: 'portfolio-statement',
          title: 'Portfolio statement',
          description: 'Every deposit you hold on one sheet, with totals.',
          subject: { kind: 'portfolio', id: PORTFOLIO_SUBJECT_ID },
          fileName: `portfolio-statement-${isoDay(now)}`,
          now,
        });

  const all = [
    ...(portfolioStatement === null ? [] : [portfolioStatement]),
    ...byHolding.flatMap((group) => group.documents),
  ];

  return {
    portfolioStatement,
    byHolding,
    all,
    availableCount: all.filter((entry) => entry.availability.status === 'available').length,
    generatedAt: summary.generatedAt,
  };
}

/** The descriptor for one id, or `null` when this investor has no such document. */
export function findDocument(
  catalogue: ReportCatalogue,
  id: string,
): DocumentDescriptor | undefined {
  return catalogue.all.find((entry) => entry.id === id);
}
