import { CURRENCY } from '@/constants/app';
import type { ExternalBankAccount } from '@/types/bank-account';
import type { InvestorIdentity } from '@/types/investor';
import { maskAccountNumber } from '@/utils/bank-account';
import { formatCurrency, formatTenure } from '@/utils/format';

import { resolveRate } from './tenure-rates';
import { PAYOUT_OPTION_LABELS } from '../constants/payout-options';
import type {
  ApplicationField,
  ApplicationFieldSource,
  ApplicationTemplate,
  ResolvedApplication,
  ResolvedApplicationField,
  ResolvedApplicationSection,
} from '../types/application';
import type { SelectedDeposit } from '../types/booking';
import type { BookingDraft } from '../types/draft';

/**
 * The application, resolved from everything the platform already knows.
 *
 * ## The rule
 *
 * > ASK ONCE → REUSE → VERIFY → ASK ONLY FOR WHAT IS MISSING
 *
 * A field declares its `source`; this fills it from that source. The only
 * fields that can ever reach the customer as something to type are the ones
 * whose source is `manual` — and a template that declared everything manual
 * would be a template that had learned nothing from the journey so far.
 *
 * ## Four canonical sources, no fifth store
 *
 * | Source | Owner |
 * |---|---|
 * | `identity` | `InvestorIdentity` — the platform Investor domain |
 * | `investment` | `BookingDraft.investment` |
 * | `nominee` | `BookingDraft.nominee` |
 * | `bank-account` | the vault account `BookingDraft.bankAccountId` refers to |
 * | `deposit` | the `SelectedDeposit` being booked |
 *
 * Nothing is copied into a new store on the way through. The application is
 * **derived on every render**, which is what stops it from disagreeing with the
 * booking it describes — the same reason a maturity figure is never persisted.
 *
 * ## Values are display strings
 *
 * A resolved field carries what the customer reads: `₹5,00,000`, not `500000`.
 * Formatting goes through the platform's own formatters so an application and a
 * summary panel cannot render the same amount differently.
 *
 * Pure and React-free.
 */

/**
 * Values the booking owns. The application states them and never asks for them:
 * they are chosen on Investment Details, and everything downstream is derived
 * from that one configuration.
 */
const BOOKING_MANAGED: readonly ApplicationFieldSource[] = ['investment', 'deposit'];

/** The nominee a single-nominee application refers to. */
function primaryNominee(draft: BookingDraft) {
  return draft.nominee.nominees[0];
}

function fromIdentity(fieldId: string, identity: InvestorIdentity | null): string | null {
  if (identity === null) return null;

  switch (fieldId) {
    case 'applicantName':
      return identity.profile.fullName;
    case 'dateOfBirth':
      return identity.profile.dateOfBirth;
    case 'mobile':
      return identity.profile.mobile;
    case 'email':
      return identity.profile.email;
    case 'address':
      return identity.profile.address;
    /*
      The masked value, never the number. `InvestorIdentity` has no field for a
      whole PAN, so an application physically cannot print one.
    */
    case 'pan':
      return identity.pan.masked;
    default:
      return null;
  }
}

function fromInvestment(
  fieldId: string,
  draft: BookingDraft,
  deposit: SelectedDeposit,
): string | null {
  const { amount, tenureMonths, payoutOption } = draft.investment;

  switch (fieldId) {
    /*
      The rate **actually applying to the chosen tenure**, through the single
      rate authority — never the headline. An application quoting one rate while
      the summary rail quoted another would be the exact defect the tenure→rate
      model exists to prevent.
    */
    case 'rateOfInterest': {
      if (tenureMonths === null) return null;
      const quote = resolveRate(deposit.terms, { tenureMonths });
      return quote === null ? null : `${String(quote.annualRate)}% p.a.`;
    }
    case 'depositAmount':
      return amount === null ? null : formatCurrency(amount);
    case 'tenure':
      return tenureMonths === null ? null : formatTenure(tenureMonths);
    case 'payoutOption':
      return payoutOption === null ? null : PAYOUT_OPTION_LABELS[payoutOption];
    default:
      return null;
  }
}

function fromNominee(fieldId: string, draft: BookingDraft): string | null {
  const nominee = primaryNominee(draft);
  if (!nominee) return null;

  switch (fieldId) {
    case 'nomineeName':
      return nominee.fullName === '' ? null : nominee.fullName;
    case 'nomineeRelationship':
      return nominee.relationship === '' ? null : nominee.relationship;
    case 'nomineeShare':
      return nominee.sharePercent === '' ? null : `${nominee.sharePercent}%`;
    case 'nomineeDateOfBirth':
      return nominee.dateOfBirth === '' ? null : nominee.dateOfBirth;
    case 'nomineeGuardianName':
      return nominee.guardianName === '' ? null : nominee.guardianName;
    default:
      return null;
  }
}

/**
 * The funding account is **passed in**, not looked up.
 *
 * This function is pure and the vault is a runtime store, so reaching for it
 * here would have made the whole application resolution depend on a browser
 * API — and would have re-introduced the module-owned account list this
 * refactor removed. The caller reads the vault through the platform hook and
 * hands over the one account the booking refers to.
 */
function fromBankAccount(fieldId: string, account: ExternalBankAccount | null): string | null {
  if (account === null) return null;

  switch (fieldId) {
    case 'fundingBank':
      return account.institution.name;
    /* Masked, exactly as every other screen shows it. */
    case 'fundingAccount':
      return maskAccountNumber(account.lastFourDigits);
    case 'fundingIfsc':
      return account.ifsc;
    default:
      return null;
  }
}

function fromDeposit(fieldId: string, deposit: SelectedDeposit): string | null {
  switch (fieldId) {
    /*
      The currency the platform books in. A canonical fact about the deposit
      rather than a question: DBS's form offers seven currencies because DBS
      takes deposits in seven, and this platform places INR deposits. Asking the
      customer to choose the only currency on offer would be the paper form
      leaking through.
    */
    case 'currency':
      return CURRENCY;
    case 'institutionName':
      return deposit.bank.name;
    case 'productName':
      return deposit.productName;
    case 'depositType':
      return 'Fixed Deposit';
    default:
      return null;
  }
}

export interface ApplicationSources {
  deposit: SelectedDeposit;
  draft: BookingDraft;
  identity: InvestorIdentity | null;
  /** The vault account `draft.bankAccountId` refers to, or `null` if none does. */
  fundingAccount: ExternalBankAccount | null;
}

/** One field's value from its declared source, or `null`. */
export function resolveFieldValue(
  field: ApplicationField,
  sources: ApplicationSources,
): string | null {
  const bySource: Record<ApplicationFieldSource, () => string | null> = {
    identity: () => fromIdentity(field.id, sources.identity),
    investment: () => fromInvestment(field.id, sources.draft, sources.deposit),
    nominee: () => fromNominee(field.id, sources.draft),
    'bank-account': () => fromBankAccount(field.id, sources.fundingAccount),
    deposit: () => fromDeposit(field.id, sources.deposit),
    /*
      The bank fills these in. Nothing to resolve, and — crucially — never
      anything to ask: a customer does not know their branch code.
    */
    'bank-only': () => null,
    /* Only the customer can supply these, and only these are ever asked for. */
    manual: () => sources.draft.application.answers[field.id] ?? null,
  };

  /*
    **A customer's edit wins.**

    A field the platform prefilled is still the customer's to correct — the bank
    is asking *them*, and a nominee's address we hold may simply be out of date.
    So an answer they have typed overrides the sourced value for this
    application, and the sourced value is what they started from.

    Two sources are excluded, for different reasons. `bank-only` is not theirs
    to answer at all. `investment`/`deposit` are owned by Investment Details, and
    a second amount field inside the bank form would be a second investment
    configuration — the screen offers a way back to that step instead.
  */
  const overridable = field.source !== 'bank-only' && !BOOKING_MANAGED.includes(field.source);
  const typed = overridable ? sources.draft.application.answers[field.id] : undefined;

  const value = typed !== undefined && typed.trim() !== '' ? typed : bySource[field.source]();
  return value === null || value.trim() === '' ? null : value;
}

/**
 * The only value a ticked acknowledgement is stored as.
 *
 * A checkbox field answers a yes-or-no question a bank's form asks — will Form
 * 60 be submitted, will Form 15G/15H be. Answers are strings everywhere in this
 * module, so a ticked box is this exact string and an unticked one is absent.
 * Pinning it to one value is what lets the validator reject a checkbox
 * "answered" with arbitrary text, which is what a free-text control would have
 * allowed.
 */
export const CHECKBOX_ACCEPTED = 'acknowledged';

/** Schema-driven validation. The template states the rule; this applies it. */
export function validateFieldValue(field: ApplicationField, value: string | null): string | null {
  /*
    A bank-only field is never the customer's problem, whatever the template
    says about it. Checked before `required` so a schema cannot accidentally
    put a branch code on the customer's to-do list.
  */
  if (field.source === 'bank-only') return null;

  if (value === null) {
    return field.required ? `${field.label} is needed to complete this application.` : null;
  }

  if (field.type === 'select' && field.options !== undefined) {
    const permitted = field.options.some((option) => option.value === value);
    if (!permitted) return `Choose one of the options for ${field.label.toLowerCase()}.`;
  }

  /* An acknowledgement is ticked or absent. Nothing else counts as answering it. */
  if (field.type === 'checkbox' && value !== CHECKBOX_ACCEPTED) {
    return `${field.label} needs to be confirmed.`;
  }

  if (field.pattern !== undefined && !new RegExp(field.pattern).test(value)) {
    return `${field.label} does not look right. Please check it.`;
  }

  return null;
}

/**
 * Whether a conditional field applies, given what every other field resolved to.
 *
 * Hidden means **absent**, not merely invisible: the field is dropped before
 * statuses are computed, so it cannot be rendered, cannot appear in Review and
 * can never block completion. A screen-level `if` would have hidden it while
 * leaving it outstanding, which is a form the customer cannot finish and cannot
 * see why.
 */
function isVisible(
  field: ApplicationField,
  resolvedValues: ReadonlyMap<string, string | null>,
): boolean {
  if (field.visibleWhen === undefined) return true;

  const governing = resolvedValues.get(field.visibleWhen.fieldId) ?? null;
  return governing !== null && field.visibleWhen.equals.includes(governing);
}

/**
 * The whole application, resolved.
 *
 * `outstanding` is what the screen renders as work: required fields the
 * platform could not supply. Everything else is shown as already done, and an
 * optional field that is absent is never presented as outstanding. A field
 * whose condition does not apply is absent altogether.
 */
export function resolveApplication(
  template: ApplicationTemplate,
  sources: ApplicationSources,
): ResolvedApplication {
  /*
    One pass over every field first, so a condition can read the value of a
    field declared after it. Conditions depend on values, never on statuses,
    which is what keeps this a single pass rather than a fixed point.
  */
  const resolvedValues = new Map<string, string | null>(
    template.sections.flatMap((section) =>
      section.fields.map((field) => [field.id, resolveFieldValue(field, sources)] as const),
    ),
  );

  const sections: ResolvedApplicationSection[] = template.sections.map((section) => ({
    section,
    fields: section.fields
      .filter((field) => isVisible(field, resolvedValues))
      .map<ResolvedApplicationField>((field) => {
        const value = resolveFieldValue(field, sources);
        const message = validateFieldValue(field, value);

        const status: ResolvedApplicationField['status'] =
          field.source === 'bank-only'
            ? 'optional'
            : value !== null && message !== null
              ? 'invalid'
              : value === null && field.required
                ? 'missing'
                : value === null
                  ? 'optional'
                  : field.editable === true
                    ? 'requires-confirmation'
                    : 'prefilled';

        return {
          field,
          value,
          source: field.source,
          status,
          ...(message !== null && value !== null ? { message } : {}),
        };
      }),
  }));

  const allFields = sections.flatMap((section) => section.fields);

  /*
    Outstanding means "the customer must supply this". A booking-managed value
    is never that: they cannot answer it here, and the step guard has already
    required a valid configuration before this screen can be reached. Leaving
    them in would make a product whose rate card does not price the chosen term
    block an application the customer has no way to unblock.
  */
  const outstanding = allFields.filter(
    (entry) =>
      !BOOKING_MANAGED.includes(entry.source) &&
      (entry.status === 'missing' || entry.status === 'invalid'),
  );
  const bankCompleted = allFields.filter((entry) => entry.source === 'bank-only');

  const declarationsAccepted = template.declarations
    .filter((declaration) => declaration.required)
    .every((declaration) =>
      sources.draft.application.acceptedDeclarations.includes(declaration.id),
    );

  return {
    template,
    sections,
    outstanding,
    bankCompleted,
    isComplete: outstanding.length === 0 && declarationsAccepted,
  };
}
