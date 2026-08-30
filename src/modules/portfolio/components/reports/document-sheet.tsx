'use client';

import { Badge } from '@/components/ui/badge';
import type { DocumentContent, DocumentField } from '@/types/document';

/**
 * The document itself — the part that is printed.
 *
 * ## A sheet, not a dashboard
 *
 * No cards inside cards, no icons on rows, no charts. A statement is read
 * top-to-bottom and its authority comes from being plain: a heading, who it is
 * for, labelled values in sections, and the provenance at the foot. Everything
 * decorative was left out on purpose, and everything interactive lives outside
 * this component so the printed page is exactly what is on screen.
 *
 * ## An absent value is a row, not a gap
 *
 * A field the platform does not hold prints as "Not recorded" with the reason
 * beside it. Dropping the row would make the sheet look complete when it is
 * not, and filling it with a default would state something about someone's
 * money that nobody told the platform.
 */
export interface DocumentSheetProps {
  content: DocumentContent;
}

function FieldRow({ field }: { field: DocumentField }) {
  const missing = field.value === null;

  return (
    <div className="border-border-default/50 flex flex-col gap-0.5 border-b py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      {field.label === '' ? null : (
        <dt className="text-caption text-content-muted shrink-0">{field.label}</dt>
      )}

      <dd
        className={
          missing
            ? 'text-body text-content-placeholder min-w-0 sm:text-right'
            : 'text-body text-content min-w-0 font-medium sm:text-right'
        }
      >
        {missing ? 'Not recorded' : field.value}

        {field.hint === undefined || (missing && field.hint === 'Not recorded') ? null : (
          <span className="text-caption text-content-muted block font-normal">{field.hint}</span>
        )}
      </dd>
    </div>
  );
}

export function DocumentSheet({ content }: DocumentSheetProps) {
  const { descriptor, issuedTo, sections, table, notes } = content;
  const generatedAt =
    descriptor.availability.status === 'available' ? descriptor.availability.generatedAt : null;

  return (
    <article
      /* The printed page: white, bordered on screen, borderless on paper. */
      className="bg-surface-card border-border-default rounded-card border p-6 md:p-10 print:rounded-none print:border-0 print:p-0"
      aria-labelledby="document-title"
    >
      <header className="border-border-default flex flex-col gap-4 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 id="document-title" className="text-h2 text-content">
              {descriptor.title}
            </h1>
            <p className="text-body text-content-muted break-words">{descriptor.description}</p>
          </div>

          <Badge variant={descriptor.issuer === 'bank' ? 'neutral' : 'brand'} size="md">
            {descriptor.issuer === 'bank' ? 'Bank document' : 'Platform-generated'}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {issuedTo.map((field) => (
            <FieldRow key={field.label} field={field} />
          ))}
        </dl>
      </header>

      {sections.map((section) => (
        <section key={section.id} className="border-border-default border-b py-6 last:border-b-0">
          <h2 className="text-caption text-content-muted mb-2 font-semibold tracking-wide uppercase">
            {section.title}
          </h2>

          <dl className="flex flex-col">
            {section.fields.map((field, index) => (
              <FieldRow key={`${section.id}-${String(index)}`} field={field} />
            ))}
          </dl>
        </section>
      ))}

      {table === null ? null : (
        <section className="border-border-default border-b py-6">
          <h2 className="text-caption text-content-muted mb-3 font-semibold tracking-wide uppercase">
            Deposits
          </h2>

          {/* Scrolls on a narrow screen rather than shrinking the figures. */}
          <div className="-mx-2 overflow-x-auto px-2">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr className="border-border-default border-b">
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="text-caption text-content-muted py-2 pr-4 font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.join('|')} className="border-border-default/50 border-b">
                    {row.map((cell, index) => (
                      <td
                        key={`${row.join('|')}-${String(index)}`}
                        className="text-body text-content py-3 pr-4"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {table.totals === null ? null : (
                <tfoot>
                  <tr>
                    {table.totals.map((cell, index) => (
                      <td
                        key={`totals-${String(index)}`}
                        className="text-body text-content py-3 pr-4 font-semibold"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      )}

      <footer className="flex flex-col gap-2 pt-6">
        {notes.map((note) => (
          <p key={note} className="text-caption text-content-muted">
            {note}
          </p>
        ))}

        {generatedAt === null ? null : (
          <p className="text-caption text-content-placeholder">
            Reference: {descriptor.id} · generated{' '}
            {new Date(generatedAt).toISOString().replace('T', ' ').slice(0, 16)} UTC
          </p>
        )}
      </footer>
    </article>
  );
}
