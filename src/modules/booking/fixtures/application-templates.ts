import type { ApplicationTemplate } from '../types/application';

/**
 * The partner banks' FD application requirements, transcribed from the forms
 * the client supplied.
 *
 * ## What a template is
 *
 * A **machine-readable statement of what a bank's paper form asks for** — not a
 * digitisation of it. The PDF is the source of truth and is kept beside the
 * template for reference; the customer never sees a rendered PDF, and the
 * orchestrator's job is to satisfy the requirement from data the platform
 * already holds so that only the genuinely unanswerable reaches them.
 *
 * Every field below was read off the corresponding form. Mandatory markers
 * follow the bank's own asterisks. Where a form marks something optional it is
 * `required: false` here, and where the bank fills it in itself the source is
 * `bank-only` — those are part of the requirement but are never asked of a
 * customer.
 *
 * ## What is deliberately not modelled
 *
 * **Signatures, thumb impressions and witnesses.** Both forms require the
 * applicant's signature and, for a thumb impression, two witnesses. Nothing in
 * this build can capture one, so `authorization` states the requirement and the
 * screen says where it is satisfied. A checkbox is not a signature and is not
 * presented as one.
 *
 * **SBI Part I (CIF creation).** Pages 1–2 are a full customer-information
 * sheet for opening a *relationship* with the bank — occupation, income,
 * religion, category, PEP status, proof-of-identity document numbers. It
 * applies when a customer is new to SBI, which is a condition this platform has
 * no signal for. Modelling it as unconditionally required would ask every
 * customer for twenty fields the bank would not ask most of them. The FD
 * requirement proper — Part II §4 and Form DA-1 — is what is transcribed.
 *
 * **No amount, rate, tenure or eligibility rule is invented.** Interest rates
 * come from the catalogue, never from a form.
 */

/**
 * State Bank of India — Account Opening Form for Resident Individual,
 * Parts I–II and Form DA-1 (`/bank-forms/sbi/sbi-term-deposit-form.pdf`).
 *
 * The FD requirement is Part II §1–§4 (type of account, mode of operation,
 * deposit details) plus the DA-1 nomination on page 4.
 */
export const SBI_FD_TEMPLATE: ApplicationTemplate = {
  id: 'sbi-fd-v1',
  institutionId: 'sbi',
  productType: 'fixed-deposit',
  version: 1,
  /* The transcription is complete for the FD sections; see the note on Part I. */
  isPlaceholder: false,
  title: 'Term Deposit application',
  sourceDocument: {
    name: 'Account Opening Form for Resident Individual (Parts I–II) and Form DA-1',
    version: null,
    path: '/bank-forms/sbi/sbi-term-deposit-form.pdf',
    pageCount: 9,
  },
  sections: [
    {
      id: 'applicant',
      title: 'Applicant',
      description: 'From the identity you verified earlier.',
      fields: [
        { id: 'applicantName', label: 'Name', type: 'text', source: 'identity', required: true },
        {
          id: 'dateOfBirth',
          label: 'Date of birth',
          type: 'date',
          source: 'identity',
          required: true,
        },
        { id: 'mobile', label: 'Mobile number', type: 'text', source: 'identity', required: true },
        { id: 'email', label: 'Email address', type: 'text', source: 'identity', required: false },
        { id: 'pan', label: 'PAN', type: 'text', source: 'identity', required: true },
        { id: 'address', label: 'Address', type: 'text', source: 'identity', required: true },
      ],
    },
    {
      id: 'deposit',
      title: 'Deposit details',
      description: 'Part II, section 4 of the bank’s form.',
      fields: [
        {
          id: 'depositAmount',
          label: 'Amount',
          type: 'currency',
          source: 'investment',
          required: true,
        },
        {
          id: 'tenure',
          label: 'Period of deposit',
          type: 'text',
          source: 'investment',
          required: true,
        },
        {
          id: 'payoutOption',
          label: 'Interest payable',
          type: 'text',
          source: 'investment',
          required: true,
        },
        {
          id: 'depositScheme',
          label: 'Deposit scheme',
          type: 'select',
          source: 'manual',
          required: true,
          hint: 'Reinvestment adds the interest back to the deposit each period.',
          options: [
            { value: 'term-deposit', label: 'Term Deposit' },
            { value: 'term-deposit-reinvestment', label: 'Term Deposit (Reinvestment)' },
          ],
        },
        {
          id: 'modeOfOperation',
          label: 'Mode of operation',
          type: 'select',
          source: 'manual',
          required: true,
          hint: 'Who can operate this deposit.',
          options: [
            { value: 'self', label: 'Self' },
            { value: 'either-or-survivor', label: 'Either or Survivor' },
            { value: 'former-or-survivor', label: 'Former or Survivor' },
            { value: 'jointly', label: 'Jointly operated' },
          ],
        },
        {
          id: 'maturityInstruction',
          label: 'On maturity',
          type: 'select',
          source: 'manual',
          required: true,
          hint: 'Auto-renewal uses the rate prevailing on the renewal date.',
          options: [
            {
              value: 'renew-principal-payback-interest',
              label: 'Auto-renew principal, pay back interest',
            },
            { value: 'renew-principal-and-interest', label: 'Auto-renew principal and interest' },
            { value: 'pay-principal-and-interest', label: 'Pay principal and interest' },
          ],
        },
      ],
    },
    {
      id: 'payment-instruction',
      title: 'Payment instruction',
      description: 'Where the bank sends the maturity proceeds.',
      fields: [
        { id: 'fundingBank', label: 'Bank', type: 'text', source: 'bank-account', required: true },
        {
          id: 'fundingAccount',
          label: 'Account number',
          type: 'text',
          source: 'bank-account',
          required: true,
        },
        {
          id: 'paymentInstruction',
          label: 'Pay proceeds by',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'credit-to-account', label: 'Credit to my bank account' },
            { value: 'bankers-cheque', label: "Banker's cheque or draft" },
          ],
        },
      ],
    },
    {
      id: 'nomination',
      title: 'Nomination (Form DA-1)',
      description: 'Under section 45ZA of the Banking Regulation Act, 1949.',
      fields: [
        {
          id: 'nomineeName',
          label: 'Nominee name',
          type: 'text',
          source: 'nominee',
          required: true,
        },
        {
          id: 'nomineeRelationship',
          label: 'Relationship with the depositor',
          type: 'text',
          source: 'nominee',
          required: true,
        },
        {
          id: 'nomineeDateOfBirth',
          label: 'Nominee date of birth',
          type: 'date',
          source: 'nominee',
          required: false,
        },
        {
          id: 'nomineeMobile',
          label: 'Nominee’s mobile number',
          type: 'text',
          source: 'manual',
          required: false,
        },
      ],
    },
    {
      id: 'bank-use',
      title: 'Completed by the bank',
      fields: [
        {
          id: 'customerId',
          label: 'Customer ID',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'accountNumber',
          label: 'Account number',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'branchName',
          label: 'Branch name',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'branchCode',
          label: 'Branch code',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
      ],
    },
  ],
  declarations: [
    {
      id: 'terms-accepted',
      /* Part II §8, condensed to the statement the customer is actually making. */
      text: 'I have read and accept the bank’s terms and conditions for opening this deposit.',
      required: true,
    },
    {
      id: 'details-accurate',
      text: 'The details in this application are correct to the best of my knowledge.',
      required: true,
    },
  ],
  authorization: {
    requiresApplicantSignature: true,
    requiresWitness: 'if-thumb-impression',
    note: 'The bank requires your signature on the deposit form. You will complete that step with the bank; nothing here replaces it.',
  },
  submission: {
    method: 'poc',
    note: 'Your application is prepared on the platform. No submission route to the bank is connected yet.',
  },
};

/**
 * AU Small Finance Bank — Term Deposit Form, Version 5.1 (Oct 2025)
 * (`/bank-forms/au-small/au-term-deposit-form.pdf`).
 *
 * Note the difference from SBI that the schema captures: AU's Form DA-1 marks
 * the nominee's **full postal address, city, state, PIN, country and mobile**
 * mandatory. SBI's does not. The orchestrator therefore asks an AU customer for
 * more, from the same platform data — which is the schema doing its job rather
 * than two forms being made to look alike.
 */
export const AU_FD_TEMPLATE: ApplicationTemplate = {
  id: 'au-small-finance-fd-v1',
  institutionId: 'au-small-finance',
  productType: 'fixed-deposit',
  version: 1,
  isPlaceholder: false,
  title: 'Term Deposit application',
  sourceDocument: {
    name: 'Term Deposit Form, including Nomination Form DA-1',
    version: '5.1 (Oct 2025)',
    path: '/bank-forms/au-small/au-term-deposit-form.pdf',
    pageCount: 2,
  },
  sections: [
    {
      id: 'applicant',
      title: 'Applicant',
      description: 'From the identity you verified earlier.',
      fields: [
        {
          id: 'customerId',
          label: 'Customer ID',
          type: 'text',
          source: 'manual',
          required: false,
          hint: 'From your welcome kit, cheque book or passbook, if you have one.',
        },
        { id: 'applicantName', label: 'Name', type: 'text', source: 'identity', required: true },
        {
          id: 'pan',
          label: 'PAN',
          type: 'text',
          source: 'identity',
          required: true,
          hint: 'The bank requires PAN for deposits of ₹50,000 and above.',
        },
        {
          id: 'seniorCitizen',
          label: 'Senior citizen',
          type: 'select',
          source: 'manual',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
      ],
    },
    {
      id: 'deposit',
      title: 'Details of instruction',
      fields: [
        {
          id: 'depositAmount',
          label: 'Amount',
          type: 'currency',
          source: 'investment',
          required: true,
        },
        {
          id: 'depositType',
          label: 'Deposit type',
          type: 'text',
          source: 'deposit',
          required: true,
        },
        {
          id: 'tenure',
          label: 'Duration of deposit',
          type: 'text',
          source: 'investment',
          required: true,
        },
        {
          id: 'payoutOption',
          label: 'Interest payment frequency',
          type: 'text',
          source: 'investment',
          required: true,
        },
        {
          id: 'rateOfInterest',
          label: 'Rate of interest',
          type: 'text',
          source: 'investment',
          required: true,
        },
        {
          id: 'operatingInstructions',
          label: 'Operating instructions',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'single', label: 'Single' },
            { value: 'either-or-survivor', label: 'Either or Survivor' },
            { value: 'former-or-survivor', label: 'Former or Survivor' },
            { value: 'jointly', label: 'Jointly' },
          ],
        },
        {
          id: 'maturityInstruction',
          label: 'On maturity',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'renew-principal-and-interest', label: 'Renew principal and interest' },
            { value: 'repay-principal-and-interest', label: 'Repay principal and interest' },
            { value: 'renew-principal-repay-interest', label: 'Renew principal, repay interest' },
          ],
        },
        {
          id: 'maturityRepaymentMode',
          label: 'How proceeds should reach you',
          type: 'select',
          source: 'manual',
          required: true,
          hint: 'Only applies if you chose to be repaid at maturity.',
          options: [
            { value: 'credit-au-account', label: 'Credit to my AU Bank account' },
            { value: 'credit-other-bank', label: 'Credit to my other bank account (NEFT/RTGS)' },
            { value: 'demand-draft', label: 'Demand draft to my registered address' },
          ],
        },
        {
          id: 'sweepIn',
          label: 'Sweep-in facility',
          type: 'select',
          source: 'manual',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
      ],
    },
    {
      id: 'funding',
      title: 'Funding instructions',
      fields: [
        {
          id: 'fundingAccount',
          label: 'Debit account number',
          type: 'text',
          source: 'bank-account',
          required: true,
        },
        { id: 'fundingIfsc', label: 'IFSC', type: 'text', source: 'bank-account', required: true },
      ],
    },
    {
      id: 'nomination',
      title: 'Nomination (Form DA-1)',
      description: 'The bank marks every detail below as required.',
      fields: [
        {
          id: 'nomineeName',
          label: 'Nominee name',
          type: 'text',
          source: 'nominee',
          required: true,
        },
        {
          id: 'nomineeRelationship',
          label: 'Relationship with the depositor',
          type: 'text',
          source: 'nominee',
          required: true,
        },
        {
          id: 'nomineeDateOfBirth',
          label: 'Nominee date of birth',
          type: 'date',
          source: 'nominee',
          required: false,
        },
        {
          id: 'nomineeAddressLine1',
          label: 'Nominee’s address',
          type: 'text',
          source: 'manual',
          required: true,
        },
        {
          id: 'nomineeCity',
          label: 'Nominee’s city',
          type: 'text',
          source: 'manual',
          required: true,
        },
        {
          id: 'nomineeState',
          label: 'Nominee’s state',
          type: 'text',
          source: 'manual',
          required: true,
        },
        {
          id: 'nomineePin',
          label: 'Nominee’s PIN code',
          type: 'text',
          source: 'manual',
          required: true,
          pattern: '^\\d{6}$',
        },
        {
          id: 'nomineeMobile',
          label: 'Nominee’s mobile number',
          type: 'text',
          source: 'manual',
          required: true,
        },
        {
          id: 'nomineeNameOnDeliverables',
          label: 'Print the nominee’s name on statements',
          type: 'select',
          source: 'manual',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
      ],
    },
    {
      id: 'bank-use',
      title: 'Completed by the bank',
      fields: [
        {
          id: 'depositAccountNumber',
          label: 'Deposit account number',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'branchName',
          label: 'Branch name',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'branchCode',
          label: 'Branch code',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'productCode',
          label: 'Product code',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'leadNumber',
          label: 'Lead number',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
      ],
    },
  ],
  declarations: [
    {
      id: 'details-accurate',
      /* The form's own confirmation, condensed. */
      text: 'I have read and understood the declaration, and the details on this form are correct.',
      required: true,
    },
    {
      id: 'nomination-explained',
      text: 'The benefits of making a nomination have been explained to me.',
      required: true,
    },
  ],
  authorization: {
    requiresApplicantSignature: true,
    requiresWitness: 'if-thumb-impression',
    note: 'The bank requires your signature on the deposit form. You will complete that step with the bank; nothing here replaces it.',
  },
  submission: {
    method: 'poc',
    note: 'Your application is prepared on the platform. No submission route to the bank is connected yet.',
  },
};

/**
 * DBS Bank India — Fixed/Recurring Deposit form, TDA_AOF/001/July25
 * (`/bank-forms/dbs/dbs-fixed-deposite-form.pdf`).
 *
 * ## What makes this form different, and why the schema shows it
 *
 * SBI's and AU's forms open an account *and* a deposit, so both ask for the
 * applicant's name, date of birth, PAN, address and mobile. **DBS's does
 * not.** It asks for none of them: identity is carried by the CIF ID the bank
 * fills in, and the only applicant detail on the form is a name beside the
 * signature. The form is written for someone who is already a DBS customer —
 * *"Debit existing DBS A/C No."*.
 *
 * The template says exactly that. It does not borrow SBI's identity block to
 * look consistent, because a field that a bank does not ask for is a field this
 * platform must not ask for.
 *
 * ## What it asks that the others do not
 *
 * Customer type, currency, whether TDS applies, whether PAN applies, payment
 * mode, number of receipts, and — on maturity — a choice of four settlement
 * routes. Those are DBS's, they live here, and none of them touches the
 * booking draft.
 *
 * ## Conditional, as the form is
 *
 * Four questions branch, and the schema branches with them: Form 60 is asked
 * only when PAN does not apply, Form 15G/15H only when TDS does not, the
 * renewal term only when the customer renews principal and repays interest, and
 * the account and IFSC only when the proceeds leave by NEFT/RTGS. Rendering all
 * of them at once would be the scanned page, not a product.
 *
 * ## Recurring deposits are out of scope
 *
 * The form covers RD in sections 14–15 and pre-closure in section 11. This
 * platform books fixed deposits, so those sections are absent rather than
 * shown and disabled — an FD applicant is never asked about a recurring
 * deposit instalment.
 *
 * ## The rate
 *
 * The form publishes none — *"Please refer the latest interest rate chart at
 * the branch or visit www.dbsbank.com"*. The rate shown here is the platform's
 * demonstration figure, and the field says so where the customer reads it.
 */
export const DBS_FD_TEMPLATE: ApplicationTemplate = {
  id: 'dbs-fd-v1',
  institutionId: 'dbs',
  productType: 'fixed-deposit',
  version: 1,
  isPlaceholder: false,
  title: 'Fixed Deposit application',
  sourceDocument: {
    name: 'Fixed/Recurring Deposit form, including Nomination Form DA1',
    version: 'TDA_AOF/001/July25',
    path: '/bank-forms/dbs/dbs-fixed-deposite-form.pdf',
    pageCount: 4,
  },
  sections: [
    {
      id: 'request',
      title: 'Request',
      description: 'What you are opening, and who you are opening it as.',
      fields: [
        {
          id: 'depositType',
          label: 'Request type',
          type: 'text',
          source: 'deposit',
          required: true,
        },
        {
          id: 'customerType',
          label: 'Customer type',
          type: 'select',
          source: 'manual',
          required: true,
          hint: 'The category DBS opens the deposit under.',
          options: [
            { value: 'resident', label: 'Resident' },
            { value: 'senior-citizen', label: 'Senior Citizen (resident only)' },
            { value: 'staff', label: 'Staff (resident only)' },
            { value: 'nro', label: 'NRO' },
            { value: 'nre', label: 'NRE' },
            { value: 'fcnr', label: 'FCNR' },
            {
              value: 'golden-circle-senior',
              label: 'Golden Circle Senior Citizen (resident only)',
            },
          ],
        },
        {
          id: 'currency',
          label: 'Currency',
          type: 'text',
          source: 'deposit',
          required: true,
        },
      ],
    },
    {
      id: 'deposit',
      title: 'Deposit details',
      description: 'From the deposit you configured.',
      fields: [
        {
          id: 'depositAmount',
          label: 'Amount (in figures)',
          type: 'currency',
          source: 'investment',
          required: true,
        },
        {
          id: 'depositAmountInWords',
          label: 'Amount (in words)',
          type: 'text',
          source: 'manual',
          required: false,
          hint: 'The printed form asks for the amount in words. The platform does not write figures out for you.',
        },
        {
          id: 'tenure',
          label: 'Term deposit tenure',
          type: 'text',
          source: 'investment',
          required: true,
        },
        {
          id: 'rateOfInterest',
          label: 'Rate',
          type: 'text',
          source: 'investment',
          required: true,
          hint: 'A demonstration rate. DBS publishes its rates at its branches and on dbsbank.com; this platform has not obtained them.',
        },
        {
          id: 'payoutOption',
          label: 'Interest',
          type: 'text',
          source: 'investment',
          required: true,
          hint: 'DBS pays simple interest on deposits under six months and compounds quarterly at six months and above.',
        },
        {
          id: 'valueDate',
          label: 'Value date',
          type: 'date',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'numberOfReceipts',
          label: 'Number of receipts',
          type: 'select',
          source: 'manual',
          required: false,
          options: [
            { value: 'single', label: 'Single receipt' },
            { value: 'multiple', label: 'Multiple receipts' },
          ],
        },
      ],
    },
    {
      id: 'tax',
      title: 'Tax',
      description: 'What DBS needs to know before it opens the deposit.',
      fields: [
        {
          id: 'panApplicable',
          label: 'PAN applicable',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'form60Undertaking',
          label: 'Form 60 will be submitted',
          type: 'checkbox',
          source: 'manual',
          required: true,
          hint: 'The form requires a separate Form 60 where PAN does not apply.',
          visibleWhen: { fieldId: 'panApplicable', equals: ['no'] },
        },
        {
          id: 'tdsApplicable',
          label: 'TDS applicable',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'form15Undertaking',
          label: 'Form 15G or 15H will be submitted',
          type: 'checkbox',
          source: 'manual',
          required: true,
          hint: 'The form requires Form 15G/15H where TDS is not to be deducted.',
          visibleWhen: { fieldId: 'tdsApplicable', equals: ['no'] },
        },
      ],
    },
    {
      id: 'funding',
      title: 'Funding',
      description: 'The account this deposit is funded from.',
      fields: [
        {
          id: 'paymentMode',
          label: 'Payment mode',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'debit-account', label: 'Debit my account' },
            { value: 'remittance', label: 'Remittance / TT' },
          ],
        },
        { id: 'fundingBank', label: 'Bank', type: 'text', source: 'bank-account', required: true },
        {
          id: 'fundingAccount',
          label: 'Account number',
          type: 'text',
          source: 'bank-account',
          required: true,
          visibleWhen: { fieldId: 'paymentMode', equals: ['debit-account'] },
        },
        {
          id: 'modeOfOperation',
          label: 'Mode of operation',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'single', label: 'Single' },
            { value: 'jointly', label: 'Jointly' },
            { value: 'either-or-survivor', label: 'Either or Survivor' },
            { value: 'anyone-or-survivor', label: 'Anyone or Survivor' },
            { value: 'former-or-survivor', label: 'Former or Survivor' },
          ],
        },
      ],
    },
    {
      id: 'maturity',
      title: 'On maturity',
      description: 'What DBS does when the term ends.',
      fields: [
        {
          id: 'maturityInstruction',
          label: 'Maturity instruction',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            {
              value: 'renew-principal-and-interest',
              label: 'Auto-renew principal and interest for the same tenure',
            },
            {
              value: 'renew-principal-repay-interest',
              label: 'Renew principal and repay interest',
            },
            { value: 'repay-principal-and-interest', label: 'Repay principal and interest' },
          ],
        },
        {
          id: 'renewalTenure',
          label: 'Renew the principal for',
          type: 'text',
          source: 'manual',
          required: true,
          hint: 'The form asks for the renewal term in years, months or days.',
          visibleWhen: {
            fieldId: 'maturityInstruction',
            equals: ['renew-principal-repay-interest'],
          },
        },
        {
          id: 'maturityPaymentMode',
          label: 'Pay the proceeds by',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'credit-account', label: 'Credit to my account' },
            { value: 'pay-order', label: 'Pay order' },
            { value: 'neft-rtgs', label: 'NEFT / RTGS' },
          ],
        },
        {
          id: 'maturityAccount',
          label: 'Account number for the transfer',
          type: 'text',
          source: 'bank-account',
          required: true,
          visibleWhen: { fieldId: 'maturityPaymentMode', equals: ['neft-rtgs'] },
        },
        {
          id: 'fundingIfsc',
          label: 'IFSC',
          type: 'text',
          source: 'bank-account',
          required: true,
          visibleWhen: { fieldId: 'maturityPaymentMode', equals: ['neft-rtgs'] },
        },
      ],
    },
    {
      id: 'nomination',
      title: 'Nomination (Form DA1)',
      description: 'From the nominee you named earlier.',
      fields: [
        {
          id: 'nomineeName',
          label: 'Nominee name',
          type: 'text',
          source: 'nominee',
          required: true,
          editable: true,
        },
        {
          id: 'nomineeAddress',
          label: 'Nominee address',
          type: 'text',
          source: 'manual',
          required: true,
          hint: 'The bank’s nomination form asks for the nominee’s address.',
        },
        {
          id: 'nomineeRelationship',
          label: 'Relationship with depositor',
          type: 'text',
          source: 'nominee',
          required: false,
          editable: true,
          hint: 'The form marks this "if any".',
        },
        {
          id: 'nomineeDateOfBirth',
          label: 'Nominee date of birth',
          type: 'date',
          source: 'nominee',
          required: true,
          editable: true,
        },
        {
          id: 'nomineeNameOnAdvice',
          label: 'Print the nominee’s name on the deposit advice',
          type: 'select',
          source: 'manual',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'nomineeGuardianName',
          label: 'Guardian name',
          type: 'text',
          source: 'nominee',
          required: false,
          editable: true,
          hint: 'The form asks for a guardian where the nominee is a minor.',
        },
      ],
    },
    {
      id: 'applicant',
      title: 'Applicant',
      description:
        'DBS’s form does not ask for your PAN, date of birth, address or mobile — it identifies you by the CIF ID the bank fills in.',
      fields: [
        {
          id: 'applicantName',
          label: 'Name',
          type: 'text',
          source: 'identity',
          required: true,
        },
        {
          id: 'cifId',
          label: 'CIF ID',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
      ],
    },
    {
      id: 'bank-use',
      title: 'For bank use',
      description: 'DBS completes this section.',
      fields: [
        {
          id: 'branchName',
          label: 'Branch name',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'branchSolId',
          label: 'Branch / SOL id',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'rmName',
          label: 'RM / branch staff name',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        {
          id: 'employeeCode',
          label: 'Employee code',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        { id: 'bankId', label: '1bank id', type: 'text', source: 'bank-only', required: false },
        {
          id: 'csmName',
          label: 'Customer service manager',
          type: 'text',
          source: 'bank-only',
          required: false,
        },
        { id: 'csmCode', label: 'CSM code', type: 'text', source: 'bank-only', required: false },
      ],
    },
  ],
  declarations: [
    {
      id: 'customer-declaration',
      /* The form's own Customer Declaration, condensed. */
      text: 'I confirm that the information given in this application is true, correct and complete, and that I have read the terms and conditions applicable to the deposit.',
      required: true,
    },
    {
      id: 'premature-withdrawal-survivor',
      /* The form's separate, optional authorisation. Optional here because it is optional there. */
      text: 'I authorise DBS Bank India Limited to permit premature withdrawal of the deposit by the survivor(s) in the event of the death of a deposit holder before maturity.',
      required: false,
    },
  ],
  authorization: {
    requiresApplicantSignature: true,
    requiresWitness: 'if-thumb-impression',
    note: 'The bank requires your signature on the deposit form. You will complete that step with the bank; nothing here replaces it.',
  },
  submission: {
    method: 'poc',
    note: 'Your application is prepared on the platform. No submission route to the bank is connected yet.',
  },
};

export const APPLICATION_TEMPLATES: readonly ApplicationTemplate[] = [
  SBI_FD_TEMPLATE,
  AU_FD_TEMPLATE,
  DBS_FD_TEMPLATE,
] as const;
