'use client';

import { ArrowRight, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils';

import type { FamilyMemberPosition } from '../utils/family-overview';

/**
 * One family member, at the level of detail a family view is entitled to.
 *
 * ## What is shown, and what never is
 *
 * A name, a relationship, how many deposits and how much is invested. There is
 * no PAN, no date of birth, no bank account and no KYC record here — the member
 * type has no field for any of them, so this component could not render one.
 * Family membership is not consent to read somebody's identity documents.
 *
 * The one status shown is the **primary member's own** verification state,
 * because that is the investor looking at the screen reading their own record.
 * Nothing is claimed about anyone else's.
 *
 * ## Demonstration members say so
 *
 * On the card, not in a footnote. A figure a customer might mistake for their
 * own family's money is exactly the wrong place for a quiet disclaimer.
 */
export interface FamilyMemberCardProps {
  position: FamilyMemberPosition;
  /**
   * The primary member's identity status, in one phrase, or `null` when it is
   * not known or the member is not the primary one.
   */
  verificationStatus: string | null;
}

export function FamilyMemberCard({ position, verificationStatus }: FamilyMemberCardProps) {
  const { member, activeCount, totalPrincipal } = position;
  const isPrimary = member.role === 'primary';

  return (
    <Card variant="outlined" className="flex flex-col gap-3 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-lg text-content font-semibold">{member.displayName}</span>
          <span className="text-caption text-content-muted">
            {isPrimary ? 'Primary member' : 'Demonstration member'}
          </span>
        </div>

        {member.isDemo ? (
          <Badge variant="neutral" size="sm">
            Demo data
          </Badge>
        ) : null}
      </div>

      <p className="text-body text-content tabular-nums">
        {activeCount === 0
          ? 'No deposits yet'
          : `${String(activeCount)} ${activeCount === 1 ? 'FD' : 'FDs'} · ${formatCurrency(totalPrincipal)}`}
      </p>

      {verificationStatus === null ? null : (
        <p className="text-caption text-success inline-flex items-center gap-1.5">
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          {verificationStatus}
        </p>
      )}

      {/*
        Only the primary member has somewhere real to go: the portfolio is the
        investor's own. A demonstration member has no portfolio route, and a
        link to one would be a dead end dressed as a feature.
      */}
      {isPrimary ? (
        <Link
          href={ROUTES.portfolio}
          className="focus-ring text-caption text-content-brand group inline-flex w-fit items-center gap-1 rounded-md font-medium"
        >
          View portfolio
          <ArrowRight
            aria-hidden="true"
            className="motion-safe:duration-base size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <p className="text-caption text-content-muted">
          Shown to demonstrate a family view. This member has not signed in, and no data of theirs
          is held by the platform.
        </p>
      )}
    </Card>
  );
}
