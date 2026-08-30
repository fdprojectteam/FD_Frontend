'use client';

import { ArrowRight, Building2, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import type { DocumentDescriptor } from '@/types/document';

/**
 * One document in the list.
 *
 * ## Available documents are links; unavailable ones are not
 *
 * This is the whole point of the row. A document the platform cannot produce
 * renders as plain text with the reason beside it — not a disabled button, not
 * a link to a page that apologises. Nothing here can be clicked unless clicking
 * it leads to a document that exists, which is the rule the descriptor's own
 * type already guarantees: an unavailable document has no file name to save and
 * no generation date to show.
 *
 * ## Provenance is on the row, not only on the document
 *
 * An investor scanning this list is deciding *where to get something official*.
 * "Bank" against a deposit advice answers that before they open anything, so
 * the badge sits on the row rather than waiting inside the document.
 */
export interface DocumentListItemProps {
  descriptor: DocumentDescriptor;
}

export function DocumentListItem({ descriptor }: DocumentListItemProps) {
  const isBank = descriptor.issuer === 'bank';
  const isAvailable = descriptor.availability.status === 'available';

  const body = (
    <>
      <span
        className={
          isBank
            ? 'bg-surface-muted text-content-muted flex size-9 shrink-0 items-center justify-center rounded-full'
            : 'bg-surface-brand-subtle text-content-brand flex size-9 shrink-0 items-center justify-center rounded-full'
        }
      >
        {isBank ? (
          <Building2 aria-hidden="true" className="size-4" />
        ) : (
          <FileText aria-hidden="true" className="size-4" />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-body text-content font-medium">{descriptor.title}</span>

          <Badge variant={isBank ? 'neutral' : 'brand'} size="sm">
            {isBank ? 'Bank document' : 'Platform-generated'}
          </Badge>
        </span>

        <span className="text-caption text-content-muted break-words">
          {descriptor.availability.status === 'unavailable'
            ? descriptor.availability.reason
            : descriptor.description}
        </span>
      </span>

      {isAvailable ? (
        <ArrowRight
          aria-hidden="true"
          className="text-content-muted motion-safe:duration-base mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      ) : (
        <span className="text-caption text-content-placeholder mt-1 flex shrink-0 items-center gap-1.5">
          <Lock aria-hidden="true" className="size-3.5" />
          Not available
        </span>
      )}
    </>
  );

  if (!isAvailable) {
    return (
      <li className="flex items-start gap-3 py-4">
        <span className="opacity-muted flex w-full items-start gap-3">{body}</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={ROUTES.report(descriptor.id)}
        className="focus-ring group -mx-2 flex items-start gap-3 rounded-lg px-2 py-4"
      >
        {body}
      </Link>
    </li>
  );
}
