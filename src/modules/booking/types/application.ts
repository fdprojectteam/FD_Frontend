import type { KycMethodId } from '@/types/investor';

/**
 * The bank's own FD application, as a **schema** rather than as a screen.
 *
 * ## Why a schema and not a component per bank
 *
 * Every partner bank asks for a slightly different set of things. Expressed as
 * components that would be one file per institution, and the twentieth would be
 * a copy of the first with three fields moved. Expressed as data, a new bank is
 * a new template and the renderer is untouched — which is the whole point, and
 * the reason the renderer must contain no `if (bank === …)` anywhere.
 *
 * ## Why it lives inside the Booking module
 *
 * The application is a step of a booking: it reads the deposit being booked, the
 * draft being filled in and the journey's navigation, all of which belong to
 * Booking. A sibling module could not import any of them — the boundary forbids
 * module → module — so a separate module would mean either duplicating booking
 * state or weakening the boundary. It is a cohesive sub-domain here instead:
 * `types/application.ts`, `fixtures/application-templates.ts`,
 * `services/application-library.ts`, `utils/application-*.ts`.
 *
 * The **investor identity** it prefills from is platform-level (`@/types/investor`),
 * so nothing about identity is duplicated to make this work.
 */

/** The input kinds a template may ask for. Closed, so the renderer is exhaustive. */
export type ApplicationFieldType = 'text' | 'date' | 'currency' | 'select' | 'checkbox';

/**
 * Where a field's value comes from.
 *
 * This is what makes "ask once, reuse" mechanical rather than aspirational: a
 * field declares its source, the mapping engine fills it from that source, and
 * only `manual` fields can ever reach the customer as something to type.
 */
export type ApplicationFieldSource =
  /** The investor's verified identity (name, date of birth, mobile, PAN). */
  | 'identity'
  /** The configured deposit — amount, tenure, payout. */
  | 'investment'
  /** The nominee section of the booking draft. */
  | 'nominee'
  /** The funding account chosen at the Bank Account step. */
  | 'bank-account'
  /** The deposit itself — bank name, product, rate. */
  | 'deposit'
  /** Nothing on the platform can supply it; the customer must. */
  | 'manual'
  /**
   * The bank fills this in, not the customer.
   *
   * Real forms are full of them — customer id, account number, branch code,
   * product code, employee code, sourcing-staff signature. They are part of the
   * bank's requirement and belong in the schema, but asking a customer for a
   * branch code would be the PDF-digitisation mistake this module exists to
   * avoid. They are never outstanding and never rendered as fields.
   */
  | 'bank-only';

/** One option of a `select` field. */
export interface ApplicationFieldOption {
  value: string;
  label: string;
}

export interface ApplicationField {
  id: string;
  /** Plain words, as the customer reads them. Never the bank's internal code. */
  label: string;
  type: ApplicationFieldType;
  source: ApplicationFieldSource;
  /** A template may require a field the platform cannot supply — that is the point. */
  required: boolean;
  /**
   * Whether the customer may change a value the platform supplied.
   *
   * Defaults to read-only for sourced fields: a name that came from a verified
   * identity record is not something to retype on an application screen. A
   * template can open a field where the bank genuinely allows a different value.
   */
  editable?: boolean;
  /** Shown beneath the field. One short sentence, never a paragraph of legalese. */
  hint?: string;
  options?: readonly ApplicationFieldOption[];
  /** Optional regular expression the value must match, for `text` fields. */
  pattern?: string;
}

export interface ApplicationSection {
  id: string;
  title: string;
  /** One line saying what the section is for. Optional. */
  description?: string;
  fields: readonly ApplicationField[];
}

/**
 * A statement the customer must accept.
 *
 * ⚠ **Until the client supplies the real forms, these are product-level
 * confirmations only.** Nothing here is presented as a bank's or a regulator's
 * declaration, because inventing one would be inventing a legal requirement.
 */
export interface ApplicationDeclaration {
  id: string;
  text: string;
  required: boolean;
}

/**
 * How a completed application would reach the bank.
 *
 * Declared now so the integration is a matter of supplying an adapter rather
 * than reshaping the journey. **No real integration exists**; every POC
 * template uses `poc`.
 */
export type ApplicationSubmissionMethod =
  /** A bank API the platform calls directly. */
  | 'api'
  /** A bank-provided SDK or hosted widget. */
  | 'sdk'
  /** A form posted to the bank, digitally or otherwise. */
  | 'form'
  /** Handed to an operations team to complete with the bank. */
  | 'assisted'
  /** No route configured for this institution yet. */
  | 'unavailable'
  /** This build only: the application is prepared and nothing is sent. */
  | 'poc';

export interface ApplicationSubmission {
  method: ApplicationSubmissionMethod;
  /** Shown to the customer where the method affects what happens next. */
  note?: string;
}

/**
 * The bank's own document this template was transcribed from.
 *
 * A template is a **machine-readable statement of a bank's requirement**, and a
 * requirement with no provenance is an assertion. This names the document, its
 * version where the bank prints one, and where the original can be read.
 *
 * ⚠ The PDF is a **reference**, not the customer-facing form, and nothing about
 * a customer is ever written into it or into `public/`.
 */
export interface ApplicationSourceDocument {
  /** The bank's own title for the form. */
  name: string;
  /** As printed on the form, or `null` where the bank prints none. */
  version: string | null;
  /** Public path to the original, e.g. `/bank-forms/sbi/…pdf`. */
  path: string;
  /** Page count, so the screen can set expectations before opening it. */
  pageCount: number;
}

/**
 * What the bank requires by way of authorization.
 *
 * Both real forms require the applicant's signature, and witnesses only where a
 * thumb impression is used. **Neither can be captured in this build**, so the
 * template states the requirement and the screen says where it is satisfied
 * rather than pretending a digital tick is a signature.
 */
export interface ApplicationAuthorization {
  requiresApplicantSignature: boolean;
  /** Real forms require witnesses only for a thumb impression. */
  requiresWitness: 'never' | 'if-thumb-impression';
  /** One plain sentence telling the customer what happens about it. */
  note: string;
}

export interface ApplicationTemplate {
  id: string;
  /** Matches `Bank.id` — the existing institution identity, not a second one. */
  institutionId: string;
  /** FD only, today. A discriminant so a second product type is a real branch. */
  productType: 'fixed-deposit';
  /** Bumped when the bank changes its form. Resolution prefers the highest. */
  version: number;
  /**
   * ⚠ `true` while this stands in for a form the client has not yet supplied.
   *
   * Surfaced to the customer, so nobody is shown a placeholder believing it is
   * their bank's actual application.
   */
  isPlaceholder: boolean;
  title: string;
  /** The bank document this was transcribed from. */
  sourceDocument: ApplicationSourceDocument;
  sections: readonly ApplicationSection[];
  declarations: readonly ApplicationDeclaration[];
  authorization: ApplicationAuthorization;
  submission: ApplicationSubmission;
}

/** Whether a resolved field is ready, or what is wrong with it. */
export type ApplicationFieldStatus =
  /** Supplied from an existing canonical source. Nothing to do. */
  | 'prefilled'
  /** Required, and nothing on the platform can supply it. Ask for this one. */
  | 'missing'
  /** Supplied, but the customer must actively confirm it. */
  | 'requires-confirmation'
  /** Not required and not supplied. Never shown as outstanding. */
  | 'optional'
  /** Supplied or entered, but it does not satisfy the field. */
  | 'invalid';

/** One field, resolved against everything the platform knows. */
export interface ResolvedApplicationField {
  field: ApplicationField;
  /** `null` when nothing could be resolved. Always a display-ready string. */
  value: string | null;
  source: ApplicationFieldSource;
  status: ApplicationFieldStatus;
  /** Present only for `invalid`. Plain English, actionable. */
  message?: string;
}

export interface ResolvedApplicationSection {
  section: ApplicationSection;
  fields: readonly ResolvedApplicationField[];
}

/** The whole application, resolved and ready to render. */
export interface ResolvedApplication {
  template: ApplicationTemplate;
  sections: readonly ResolvedApplicationSection[];
  /** Fields the customer must supply. Empty means nothing is being asked. */
  outstanding: readonly ResolvedApplicationField[];
  /** Fields the bank completes. Counted for the customer, never rendered as work. */
  bankCompleted: readonly ResolvedApplicationField[];
  /** True when every required field is satisfied and declarations are accepted. */
  isComplete: boolean;
}

/**
 * What the booking stores about the application.
 *
 * **Only what nothing else owns.** Answers to `manual` fields, and which
 * declarations were accepted. The applicant's name, date of birth, PAN, nominee
 * and funding account are *not* here — they belong to the Investor domain and
 * the booking draft, and are read from those every time the application is
 * resolved. Copying them here would be a third customer-data store and would
 * put identity into `sessionStorage`.
 */
export interface ApplicationConfiguration {
  /**
   * `fieldId → value`, for `manual` fields only — **in memory, never persisted.**
   *
   * A real bank form asks manual questions about third parties: AU's Form DA-1
   * marks the nominee's postal address, city, PIN and mobile mandatory. Writing
   * those to `sessionStorage` would route straight around the rule that already
   * keeps `nominee` out of storage — same data, same person who consented to
   * nothing, arriving by a different door.
   *
   * So answers follow the nominee's precedent exactly: held for the session,
   * omitted from the persisted shape at the type level, restored empty on read.
   * The visible consequence, stated plainly: **a refresh clears typed
   * application answers.** `acceptedDeclarations`, `preparedAt` and
   * `identityMethod` carry no third-party data and do persist.
   */
  answers: Record<string, string>;
  /** Ids of declarations the customer has accepted. */
  acceptedDeclarations: readonly string[];
  /** Epoch ms when the application was prepared, or `null`. */
  preparedAt: number | null;
  /** The verification route recorded at the identity step, carried for the bank. */
  identityMethod: KycMethodId | null;
}
