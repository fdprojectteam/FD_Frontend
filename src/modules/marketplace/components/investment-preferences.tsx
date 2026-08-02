import type { ReactNode } from 'react';

/**
 * InvestmentPreferences — the inputs the comparison is calculated *from*
 * (change request, 2026-08-02).
 *
 * **The section, not the field.** The brief is explicit that this must be
 * "reusable as Investment Preferences, not just a single Deposit Amount input",
 * and names what is coming: Tenure, Interest Payout, Senior Citizen, Tax Saver.
 * So the deposit amount is passed *in* rather than rendered here, and adding the
 * next preference is one more child — no change to this file, no change to the
 * page, and no change to either comparison view.
 *
 * **Why it earns a section of its own** rather than sitting in the header row
 * beside "Add another FD", which is where the deposit amount lived until now.
 * Those two controls answer different questions. The Add button changes *what*
 * is being compared; these fields change *what the comparison assumes*. Once
 * there are five of them, a header row cannot hold them, and a section
 * introduced later would be a redesign — which is the outcome the brief asks to
 * avoid. A heading and a rule underneath also give the figures below an
 * explanation: the table is not showing generic returns, it is showing returns
 * on the amount stated directly above it.
 *
 * **Layout scales by wrapping, not by breakpoint.** The grid is column-count
 * driven, so a second and third field flow into the row and then onto the next
 * one at every width. Nothing here is sized for "one field", which is the way
 * this component would otherwise quietly acquire a redesign at field number two.
 *
 * **Presentation-only** (I3), like every other section on this route: no state,
 * no fetching, no calculation. It receives rendered fields and arranges them.
 */
export interface InvestmentPreferencesProps {
  /**
   * The preference fields, in display order. Typed as `ReactNode` because this
   * section arranges controls without knowing what they are — the moment it
   * knew, adding Tenure would mean editing it.
   */
  children: ReactNode;
  /** Optional supporting line, e.g. a note about which figures are affected. */
  description?: string;
  /**
   * Optional row beneath the fields — the section's own status and actions
   * (Comparison Experience Refinement, 2026-08-02).
   *
   * A slot rather than built-in behaviour, and typed as `ReactNode` for the same
   * reason `children` is: once preferences are drafted and applied rather than
   * applied live, a section needs somewhere to say so, and that "somewhere" must
   * not become a second thing this file knows about the fields above it. A
   * section whose preferences apply immediately passes nothing and renders
   * exactly as before.
   */
  action?: ReactNode;
}

export function InvestmentPreferences({
  children,
  description,
  action,
}: InvestmentPreferencesProps) {
  return (
    /*
      A labelled `<section>`, so the preferences are a landmark a screen-reader
      user can jump to rather than a run of loose inputs above a table. The
      heading is `h2`: the page's single `h1` is "Comparing 3 of 4", and this
      sits beneath it.
    */
    <section aria-labelledby="investment-preferences-heading" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2
          id="investment-preferences-heading"
          className="text-heading-sm text-content font-semibold"
        >
          Investment Preferences
        </h2>

        {description ? <p className="text-body text-content-muted">{description}</p> : null}
      </div>

      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>

      {/*
        Between the fields and the rule, so the section reads top-down: what you
        can change, whether it has taken effect, then the boundary after which
        the results begin.
      */}
      {action}

      {/*
        Decorative: it separates the inputs from the results the brief shows
        below them, and the `<section>` boundary already carries that meaning to
        assistive technology. An `<hr>` here would announce a second, redundant
        break.
      */}
      <div aria-hidden="true" className="border-border-default/60 border-t" />
    </section>
  );
}
