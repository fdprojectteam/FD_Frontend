'use client';

import { Card } from '@/components/ui/card';

import { ApplicationFieldControl } from './application-field-control';
import type { ResolvedApplication } from '../types/application';

/**
 * The bank's application, rendered from its schema as a digital form.
 *
 * ## Field order is the template's, and never changes
 *
 * Fields used to be split into "settled" and "outstanding" groups rendered in
 * two different containers. A field that gained a value moved between those
 * containers mid-typing, so React unmounted the input and remounted it
 * elsewhere — the customer lost focus after a keystroke, and combined with the
 * control's own read-only switch, editing one nominee field appeared to lock
 * the next.
 *
 * Each section now renders its fields **once, in template order**, in a stable
 * two-column grid. Nothing moves as values are entered, so focus is never
 * stolen and every field stays independently editable.
 *
 * ## Bank-only fields are separated, not interleaved
 *
 * A branch code among the customer's own questions makes the form look like the
 * paper one. They are grouped at the end of their section, plainly labelled.
 *
 * ## No institution appears in this file
 *
 * It draws whatever template it is given. That property is what makes a third
 * bank a data change rather than a code change, and an invariant asserts it.
 */
export interface ApplicationFormProps {
  application: ResolvedApplication;
  onAnswer: (fieldId: string, value: string) => void;
  /** Sends the customer to the step that owns amount, tenure and rate. */
  onEditInvestment?: () => void;
}

export function ApplicationForm({ application, onAnswer, onEditInvestment }: ApplicationFormProps) {
  return (
    <div className="flex flex-col gap-5">
      {application.sections.map(({ section, fields }) => {
        const customerFields = fields.filter((entry) => entry.source !== 'bank-only');
        const bankFields = fields.filter((entry) => entry.source === 'bank-only');

        return (
          <Card key={section.id} variant="outlined" className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-body-lg text-content font-semibold">{section.title}</h3>
              {section.description ? (
                <p className="text-caption text-content-muted">{section.description}</p>
              ) : null}
            </div>

            {customerFields.length > 0 ? (
              /*
                One grid, one order. `min-w-0` on the children (set inside the
                control) is what keeps a long value from forcing the column
                wider than the viewport on a narrow screen.
              */
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                {customerFields.map((entry) => (
                  <ApplicationFieldControl
                    key={entry.field.id}
                    entry={entry}
                    onEditInvestment={onEditInvestment}
                    onChange={(value) => {
                      onAnswer(entry.field.id, value);
                    }}
                  />
                ))}
              </div>
            ) : null}

            {bankFields.length > 0 ? (
              <div className="border-border-default flex flex-col gap-4 border-t pt-4">
                <p className="text-caption text-content-muted">Completed by the bank</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {bankFields.map((entry) => (
                    <ApplicationFieldControl
                      key={entry.field.id}
                      entry={entry}
                      onChange={(value) => {
                        onAnswer(entry.field.id, value);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
