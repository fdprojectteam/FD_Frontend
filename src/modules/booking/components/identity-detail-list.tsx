'use client';

import { BadgeCheck } from 'lucide-react';

import type { InvestorIdentity } from '@/types/investor';
import { IDENTITY_FIELD_LABELS, type IdentityFieldId } from '@/utils/kyc/readiness';

/**
 * The details the platform already holds, laid out for reading.
 *
 * ## It is a review surface, not a form
 *
 * Every value here is one the investor does not have to type. Rendering them as
 * a description list rather than as disabled inputs is the whole point: a
 * disabled input still *looks* like work, and the message of this screen is that
 * the work is done.
 *
 * ## Readable at a glance, and out loud
 *
 * Labels are full words — "PAN", never "PAN No.", and no abbreviation the
 * screen has not already explained. Values are set at body size rather than
 * caption size because a large share of fixed-deposit customers are reading
 * this without their glasses on.
 */
const VALUE_BY_FIELD = (identity: InvestorIdentity, field: IdentityFieldId): string | null => {
  if (field === 'pan') return identity.pan.masked;
  return identity.profile[field];
};

export interface IdentityDetailListProps {
  identity: InvestorIdentity;
  fields: readonly IdentityFieldId[];
}

export function IdentityDetailList({ identity, fields }: IdentityDetailListProps) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
      {fields.map((field) => {
        const value = VALUE_BY_FIELD(identity, field);
        if (value === null) return null;

        return (
          <div key={field} className="flex min-w-0 flex-col gap-1">
            <dt className="text-caption text-content-muted">{IDENTITY_FIELD_LABELS[field]}</dt>
            <dd className="text-body text-content flex items-center gap-2 font-medium break-words">
              {value}
              {field === 'pan' && identity.pan.status === 'verified' ? (
                <>
                  <BadgeCheck aria-hidden="true" className="text-success size-4 shrink-0" />
                  <span className="sr-only">Verified</span>
                </>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
