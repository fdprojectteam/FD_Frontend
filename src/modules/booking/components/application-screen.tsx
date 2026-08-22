'use client';

import { CircleAlert, ExternalLink, FileCheck2, PenLine } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useInvestorIdentity } from '@/hooks/use-investor-identity';

import { ApplicationForm } from './application-form';
import { BookingStepActions } from './booking-step-actions';
import { BookingStepShell } from './booking-step-shell';
import { BookingSummaryRail } from './booking-summary-rail';
import { useBookingDraft } from '../hooks/use-booking-draft';
import { useBookingProduct } from '../hooks/use-booking-product';
import { useBookingStep } from '../hooks/use-booking-step';
import { createApplicationLibrary } from '../services/application-library';
import { resolveApplication } from '../utils/application-mapping';

/**
 * ApplicationScreen — the partner bank's FD application, prepared for the
 * customer rather than handed to them.
 *
 * ## What the customer experiences
 *
 * The application arrives **already filled in**. Name, date of birth and PAN
 * come from the identity they verified at Stage 3; amount, tenure and payout
 * from the deposit they configured; nominee and funding account from the two
 * steps before this one. Typically one field remains — and that is the only
 * control on the page.
 *
 * ## What it deliberately is not
 *
 * Not a bank PDF rendered as HTML, and not every field the template can hold.
 * Settled fields read as a scannable list of facts; only genuinely outstanding
 * ones become inputs. The institutional complexity stays behind the schema.
 *
 * ## The bank's own form is one tap away, and is not the UI
 *
 * Each template names the document it was transcribed from, and the screen
 * offers a quiet link to the original PDF. That is a **reference** for anyone
 * who wants to check what the bank actually asks — not the customer-facing
 * form, and not something any customer detail is ever written into.
 *
 * Where a template is still a stand-in, `isPlaceholder` makes the screen say
 * so, so nobody is shown a sample believing it is their bank's application.
 *
 * ## Nothing is duplicated
 *
 * The application is **derived on every render** from the deposit, the draft and
 * the investor's identity. Only answers to fields no canonical source can supply
 * are stored, alongside which declarations were accepted. There is no second
 * copy of a name, a nominee or an account number anywhere in this flow.
 */
export interface ApplicationScreenProps {
  productId: string;
}

export function ApplicationScreen({ productId }: ApplicationScreenProps) {
  const { deposit } = useBookingProduct();
  const { draft, setApplicationAnswer, setApplicationDeclaration, prepareApplication } =
    useBookingDraft();
  const { isReady, continueTo, goToStep } = useBookingStep('application', productId);
  const { identity } = useInvestorIdentity();

  const library = useMemo(() => createApplicationLibrary(), []);
  const template = useMemo(
    () => library.findTemplate(deposit.bank.id, 'fixed-deposit'),
    [library, deposit.bank.id],
  );

  const application = useMemo(
    () => (template === null ? null : resolveApplication(template, { deposit, draft, identity })),
    [template, deposit, draft, identity],
  );

  /*
    Stamp the application as prepared once the customer has actually seen it,
    carrying the verification route recorded at the identity step. Idempotent in
    the draft, so re-entering the step does not restamp it.
  */
  useEffect(() => {
    if (!isReady || application === null) return;
    prepareApplication(draft.identity.method);
  }, [isReady, application, draft.identity.method, prepareApplication]);

  const outstandingCount = application?.outstanding.length ?? 0;

  return (
    <BookingStepShell
      stepId="application"
      title={
        template === null
          ? 'Application not available yet'
          : `Your ${deposit.bank.name} application`
      }
      isReady={isReady}
      description={
        template === null
          ? `We're preparing ${deposit.bank.name}'s application form. You can continue with your booking and complete it shortly.`
          : outstandingCount === 0
            ? "We've prepared this application using the details you've already provided."
            : `We've prepared this application using the details you've already provided. ${String(outstandingCount)} ${outstandingCount === 1 ? 'field still needs' : 'fields still need'} your input.`
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
        <div className="flex flex-col gap-6 md:col-span-2">
          {template === null || application === null ? (
            /*
              No template for this institution. Stated plainly, and the booking
              is not blocked: the customer keeps everything they have entered and
              the journey continues. Better than a generic form standing in for a
              bank's actual application.
            */
            <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
              <p className="text-body-lg text-content flex items-center gap-2 font-semibold">
                <CircleAlert aria-hidden="true" className="text-content-muted size-5" />
                This bank&apos;s application isn&apos;t ready
              </p>
              <p className="text-body text-content-muted">
                Nothing you have entered has been lost. You can carry on and we will complete{' '}
                {deposit.bank.name}&apos;s application with you before the deposit is opened.
              </p>
            </Card>
          ) : (
            <>
              <Card variant="outlined" className="flex flex-wrap items-center gap-3 p-5 md:p-6">
                <span className="bg-surface-brand-subtle text-content-brand flex size-11 shrink-0 items-center justify-center rounded-full">
                  <FileCheck2 aria-hidden="true" className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-body-lg text-content font-semibold">
                    {deposit.bank.name} — {template.title}
                  </p>
                  <p className="text-caption text-content-muted">
                    We&apos;ve prepared this bank application using the information you&apos;ve
                    already provided.
                  </p>
                </div>
                {template.isPlaceholder ? (
                  <Badge size="sm" className="ml-auto">
                    Sample form
                  </Badge>
                ) : null}
              </Card>

              {template.isPlaceholder ? (
                <p
                  role="note"
                  className="text-caption text-content-muted border-border-default rounded-card border border-dashed p-3"
                >
                  This is a sample application used while we finalise {deposit.bank.name}&apos;s own
                  form. The details you confirm here carry over.
                </p>
              ) : null}

              <ApplicationForm
                application={application}
                onAnswer={setApplicationAnswer}
                onEditInvestment={() => {
                  goToStep('investment');
                }}
              />

              {template.declarations.length > 0 ? (
                <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
                  <h3 className="text-body-lg text-content font-semibold">Before you continue</h3>
                  {template.declarations.map((declaration) => (
                    <label
                      key={declaration.id}
                      className="text-body text-content flex cursor-pointer items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={draft.application.acceptedDeclarations.includes(declaration.id)}
                        onChange={(event) => {
                          setApplicationDeclaration(declaration.id, event.target.checked);
                        }}
                        className="accent-content-brand mt-1 size-4 shrink-0"
                      />
                      {declaration.text}
                    </label>
                  ))}
                </Card>
              ) : null}

              {/*
                What the bank requires by way of signature, stated rather than
                simulated. A checkbox is not a signature and this does not
                pretend otherwise.
              */}
              {template.authorization.requiresApplicantSignature ? (
                <p className="text-caption text-content-muted flex items-start gap-2">
                  <PenLine aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  {template.authorization.note}
                </p>
              ) : null}

              {template.submission.note ? (
                <p className="text-caption text-content-muted">{template.submission.note}</p>
              ) : null}

              {/*
                The source document. Quiet by design — most customers will never
                need it, and the ones who do should not have to ask.
              */}
              <a
                href={template.sourceDocument.path}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                View {deposit.bank.name}&apos;s original form
                <span className="sr-only">
                  , {template.sourceDocument.name}, {template.sourceDocument.pageCount} pages, opens
                  in a new tab
                </span>
              </a>
            </>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <BookingSummaryRail deposit={deposit} investment={draft.investment} />
        </div>
      </div>

      <BookingStepActions
        backHref={ROUTES.bookingBankAccount(productId)}
        backLabel="Back"
        continueLabel="Continue"
        /*
          A missing template must not trap the customer — they continue, and the
          application is completed with them later. A template that *is* present
          gates on its own schema: every required field satisfied, every required
          declaration accepted.
        */
        continueDisabled={application !== null && !application.isComplete}
        onContinue={continueTo}
      />
    </BookingStepShell>
  );
}
