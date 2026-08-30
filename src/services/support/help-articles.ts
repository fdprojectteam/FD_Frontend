import type { Route } from 'next';

import { ROUTES } from '@/constants/routes';
import type { SupportCategory } from '@/types/support';

/**
 * The help content.
 *
 * ## Only about things that exist
 *
 * Every article describes a screen or an action this build actually has, and
 * links to it. There is no article about closing a deposit early, changing a
 * nominee or disputing a transaction, because none of those exist here — an
 * article explaining how to do something the product cannot do is worse than no
 * article, since the customer will go looking for it.
 *
 * ## No policy, no regulation, no advice
 *
 * Nothing here states a bank's terms, a rate rule, a tax treatment or a
 * regulatory position. Those are the partner bank's or the regulator's to
 * state, and this platform has no source for them. Where a question needs an
 * answer the product cannot give, the article says so and points at contacting
 * support.
 *
 * ## A fixture with one reader
 *
 * Shaped as a content service response would be and read through the search
 * function, so a real help CMS replaces this file's body and nothing else.
 */

export interface HelpArticle {
  id: string;
  title: string;
  /** One line, shown in results. */
  summary: string;
  /** Two or three sentences. Long enough to answer, short enough to read. */
  body: string;
  category: SupportCategory;
  /** Extra words a customer might search for. Never shown. */
  keywords: readonly string[];
  /** Where the answer happens, when it is a screen in this product. */
  route: Route | null;
}

export const HELP_CATEGORY_LABEL: Record<SupportCategory, string> = {
  'fd-booking': 'My FD',
  payment: 'Payment',
  verification: 'Verification',
  'bank-account': 'Bank account',
  documents: 'Documents',
  maturity: 'Maturity',
  general: 'General',
};

export const HELP_CATEGORY_SUMMARY: Record<SupportCategory, string> = {
  'fd-booking': 'Booking, application and confirmation',
  payment: 'Payment status and funding',
  verification: 'Identity and verification',
  'bank-account': 'Adding and verifying accounts',
  documents: 'Statements and confirmations',
  maturity: 'Maturity dates and instructions',
  general: 'Everything else',
};

export const HELP_ARTICLES: readonly HelpArticle[] = [
  {
    id: 'where-is-my-fd',
    title: 'Where can I see my fixed deposits?',
    summary: 'Every confirmed deposit appears in your portfolio.',
    body: 'Your portfolio lists every deposit the platform has recorded as confirmed, with what you invested, the rate it earns and when it matures. A deposit appears there once its booking is confirmed — a booking you have started but not finished is not a deposit yet, and does not appear.',
    category: 'fd-booking',
    keywords: ['fd', 'deposit', 'portfolio', 'holdings', 'my investments', 'where'],
    route: ROUTES.portfolio,
  },
  {
    id: 'booking-not-finished',
    title: 'I started a booking but did not finish it',
    summary: 'An unfinished booking is kept for the tab you started it in.',
    body: 'A booking in progress is saved as you go and can be resumed from the same deposit. It is not an investment until it is confirmed, so it will not appear in your portfolio. Closing the browser tab ends the session and clears an unfinished booking.',
    category: 'fd-booking',
    keywords: ['booking', 'incomplete', 'resume', 'draft', 'unfinished'],
    route: ROUTES.home,
  },
  {
    id: 'application-form',
    title: 'Why am I shown the bank’s application form?',
    summary: 'Each partner bank has its own form, filled in from what you have already given.',
    body: 'Opening a deposit means completing that bank’s own application. The platform fills in everything it already holds — your details, the amount, the tenure, the nominee and the funding account — so that usually only a field or two is left for you. Fields marked as the bank’s are completed by the bank, not by you.',
    category: 'fd-booking',
    keywords: ['application', 'form', 'bank form', 'sbi', 'au', 'fields'],
    route: null,
  },
  {
    id: 'payment-status',
    title: 'How do I know my payment went through?',
    summary: 'A confirmed booking shows a reference and appears in your portfolio.',
    body: 'When a booking completes you are shown a reference for the deposit, and the deposit appears in your portfolio. If a booking did not reach that point, no deposit was created. This build has no live payment rail, so payment is demonstrated rather than processed.',
    category: 'payment',
    keywords: ['payment', 'paid', 'debit', 'money', 'transaction', 'status'],
    route: ROUTES.portfolio,
  },
  {
    id: 'which-account-funds',
    title: 'Which account is used to fund my deposits?',
    summary: 'The account you choose during booking, from your bank account vault.',
    body: 'You choose a funding account during booking, from the accounts saved in your vault. The account marked primary is offered first. Only an account whose ownership has been confirmed can fund a deposit.',
    category: 'payment',
    keywords: ['funding', 'debit account', 'which account', 'primary'],
    route: ROUTES.bankAccounts,
  },
  {
    id: 'verification-incomplete',
    title: 'Why is my verification incomplete?',
    summary: 'Some details still need confirming before a deposit can be opened.',
    body: 'Verification asks you to confirm the details the platform already holds about you, and to supply anything missing. Until that is done, a booking cannot be completed. The verification step during booking tells you exactly what is outstanding.',
    category: 'verification',
    keywords: ['kyc', 'verification', 'identity', 'incomplete', 'pending', 'verify'],
    route: null,
  },
  {
    id: 'add-bank-account',
    title: 'How do I add a bank account?',
    summary: 'Account number and IFSC — the bank and branch are identified for you.',
    body: 'Open Bank accounts and choose Add bank account. Enter the account number twice and the IFSC; the bank and branch are identified from the code, so you do not need to type them. A new account is saved as not verified, and cannot fund a deposit until its ownership is confirmed.',
    category: 'bank-account',
    keywords: ['add account', 'bank account', 'ifsc', 'new account', 'link account'],
    route: ROUTES.bankAccountNew,
  },
  {
    id: 'account-not-verified',
    title: 'Why does my account say it is not verified?',
    summary: 'Giving us the details is not the same as proving the account is yours.',
    body: 'Saving an account records what you told us. Confirming that the account belongs to you needs a verification provider, and none is connected in this build — so a newly added account stays unverified and cannot fund a deposit. Accounts marked “Demo verified” were confirmed by a simulated check, not by a bank.',
    category: 'bank-account',
    keywords: ['verified', 'unverified', 'ownership', 'penny drop', 'account verification'],
    route: ROUTES.bankAccounts,
  },
  {
    id: 'maturity-date',
    title: 'Where can I see my maturity date?',
    summary: 'On each deposit, and together on the maturity screen.',
    body: 'Every deposit shows the date its term ends, and the maturity screen lists them all in order with what each is expected to pay. A deposit whose term the bank publishes in days has no month-based maturity date, and the platform states that rather than estimating one.',
    category: 'maturity',
    keywords: ['maturity', 'matures', 'date', 'when', 'end of term'],
    route: ROUTES.maturities,
  },
  {
    id: 'maturity-instruction',
    title: 'Where is my maturity instruction shown?',
    summary: 'On the deposit and on the maturity screen — as recorded at booking.',
    body: 'The instruction you gave the bank at booking — renew, renew principal only, or pay out — is shown against each deposit. Where the bank’s form did not ask, no instruction is recorded and the platform says so rather than assuming one. Final handling at maturity is confirmed by the bank.',
    category: 'maturity',
    keywords: ['instruction', 'renew', 'auto renewal', 'payout', 'proceeds'],
    route: ROUTES.maturities,
  },
  {
    id: 'view-statement',
    title: 'How do I view or save my FD statement?',
    summary: 'Reports and statements, then print or save as PDF.',
    body: 'Reports and statements holds a statement, a booking record and a maturity advice for each deposit, plus a consolidated portfolio statement. Open one and use “Print or save as PDF”. These are generated by the platform from your own records — they are not bank certificates.',
    category: 'documents',
    keywords: ['statement', 'download', 'pdf', 'document', 'report', 'certificate'],
    route: ROUTES.reports,
  },
  {
    id: 'bank-certificate',
    title: 'Can I get the bank’s own deposit certificate?',
    summary: 'Not from here — the bank issues it.',
    body: 'A deposit advice or interest certificate is issued by the bank that holds your deposit. This platform has no connection to bank document systems, so the original cannot be shown here; ask the bank for a copy. The statements produced here are clearly marked as platform-generated.',
    category: 'documents',
    keywords: ['certificate', 'advice', 'official', 'bank document', 'interest certificate'],
    route: ROUTES.reports,
  },
  {
    id: 'notifications',
    title: 'Do you email or message me about my deposits?',
    summary: 'No. Updates appear in the app only.',
    body: 'Updates about bookings, verification and maturities appear in the notification centre in this app. Nothing is emailed, texted or pushed in this build, and no notification claims otherwise.',
    category: 'general',
    keywords: ['email', 'sms', 'notification', 'alert', 'message', 'push'],
    route: ROUTES.notifications,
  },
  {
    id: 'data-privacy',
    title: 'What does the platform store about me?',
    summary: 'The minimum it needs, and not your full account number.',
    body: 'Your deposits, bookings and support requests are kept for this browser session. Bank accounts are stored with only the last four digits of the number — never the whole number — and you are never asked for an internet banking password, UPI PIN or any other banking credential.',
    category: 'general',
    keywords: ['privacy', 'data', 'security', 'store', 'account number', 'password'],
    route: null,
  },
];
