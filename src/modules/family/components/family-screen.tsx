'use client';

import { ArrowRight, CalendarClock, FileText, Target } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useInvestorIdentity } from '@/hooks/use-investor-identity';
import { usePortfolio } from '@/hooks/use-portfolio';
import { demoHoldingsFor, readFamilyComposition } from '@/services/family';
import { formatCurrency } from '@/utils';
import { formatMaturityDate } from '@/utils/finance';

import { FamilyGoalRow } from './family-goal-row';
import { FamilyMemberCard } from './family-member-card';
import { buildFamilyOverview } from '../utils/family-overview';

/**
 * The Family Dashboard.
 *
 * ## The question it answers
 *
 * Not *what do I own* — Portfolio answers that — and not *what happens next*,
 * which Maturity Management answers. This answers **how the family's deposits
 * and goals are organised**: who holds what, what they are saving towards, and
 * what is coming up across all of them.
 *
 * ## It owns nothing
 *
 * The primary member's holdings come from the canonical portfolio hook; the
 * demonstration member's from the family fixture; every figure from
 * `summarisePortfolio` and `buildMaturitySchedule`, the platform's own
 * derivations. There is no family store, no family maturity engine and no
 * second goal calculator. Deleting this module would remove a view and no data.
 *
 * ## Demonstration data is labelled where it is shown
 *
 * A second family member has not signed in — nobody has, because this build has
 * no authentication. The overview says so directly beneath the totals it
 * affects, and each demonstration member's card says so again. A family total
 * that quietly mixed invented money into the investor's own would be the most
 * misleading thing this module could ship.
 *
 * ## Layout
 *
 * Overview, then investments beside members on a wide screen, then goals, then
 * what is coming. On a phone the same order, stacked. Nothing scrolls
 * sideways and no figure is drawn as a chart that a number states better.
 */
export function FamilyScreen() {
  const { holdings, isLoaded } = usePortfolio();
  const { identity, readiness } = useInvestorIdentity();

  /* One clock for the page, so every date and figure is measured from one instant. */
  const [now] = useState(() => Date.now());

  const overview = useMemo(
    () =>
      buildFamilyOverview(
        {
          composition: readFamilyComposition(),
          primaryHoldings: holdings,
          demoHoldings: (memberId) => demoHoldingsFor(memberId, now),
        },
        now,
      ),
    [holdings, now],
  );

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-page flex flex-col gap-8 py-10 md:py-14"
      >
        <span className="sr-only">Loading your family overview…</span>
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  /*
    The investor's own identity status, in one phrase and nothing more. No PAN,
    no Aadhaar, no dates — a family view states that verification is settled or
    outstanding, never what it was settled with.
  */
  const verificationStatus =
    readiness === null || identity === null
      ? null
      : readiness.outcome === 'already-verified'
        ? 'Verification complete'
        : 'Verification outstanding';

  const hasInvestments = overview.totalPrincipal > 0;

  return (
    <div className="container-page flex flex-col gap-10 py-8 md:py-12">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-h1 text-content">Family financial overview</h1>
        <p className="text-body-lg text-content-muted">
          How your family&apos;s fixed deposits and goals are organised, in one place.
        </p>
      </header>

      {/* ---- Overview ---- */}
      <section aria-labelledby="family-overview-title" className="flex flex-col gap-3">
        <h2 id="family-overview-title" className="sr-only">
          Overview
        </h2>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Total FD investments',
              value: hasInvestments ? formatCurrency(overview.totalPrincipal) : '—',
            },
            { label: 'Active deposits', value: String(overview.activeDeposits) },
            { label: 'Family goals', value: String(overview.goalCount) },
            { label: 'Family members', value: String(overview.memberCount) },
          ].map((item) => (
            <Card key={item.label} variant="outlined" className="flex flex-col gap-1 p-4 md:p-5">
              <dt className="text-caption text-content-muted">{item.label}</dt>
              <dd className="text-h3 text-content tabular-nums">{item.value}</dd>
            </Card>
          ))}
        </dl>

        {overview.includesDemoData ? (
          <p className="text-caption text-content-muted">
            These totals include {formatCurrency(overview.demoPrincipal)} of demonstration data for
            family members other than you. Nobody else has signed in — this build has no family
            accounts — and your own portfolio is unaffected by anything shown here.
          </p>
        ) : null}
      </section>

      {/* ---- Investments beside members ---- */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        <section
          aria-labelledby="family-investments-title"
          className="flex flex-col gap-3 lg:col-span-2"
        >
          <h2 id="family-investments-title" className="text-h3 text-content">
            Family investments
          </h2>

          {hasInvestments ? (
            <Card variant="outlined" className="px-5 md:px-6">
              <ul className="divide-border-default/60 flex list-none flex-col divide-y">
                {overview.members.map((position) => (
                  <li
                    key={position.member.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
                  >
                    <span className="text-body text-content font-medium">
                      {position.member.displayName}
                      {position.isDemo ? (
                        <span className="text-caption text-content-muted"> · demo</span>
                      ) : null}
                    </span>

                    <span className="text-caption text-content-muted tabular-nums">
                      {position.activeCount === 0
                        ? 'No deposits'
                        : `${String(position.activeCount)} ${position.activeCount === 1 ? 'FD' : 'FDs'} · ${formatCurrency(position.totalPrincipal)}`}
                    </span>
                  </li>
                ))}

                <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4">
                  <span className="text-body text-content font-semibold">Total</span>
                  <span className="text-body text-content font-semibold tabular-nums">
                    {formatCurrency(overview.totalPrincipal)}
                  </span>
                </li>
              </ul>
            </Card>
          ) : (
            <Card variant="outlined" className="flex flex-col items-start gap-3 p-5 md:p-6">
              <p className="text-body text-content-muted">
                Nobody in the family holds a fixed deposit yet. Once one is confirmed it appears
                here, under the member who holds it.
              </p>
              <Button asChild variant="secondary">
                <Link href={ROUTES.home}>
                  Explore FDs
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </Card>
          )}
        </section>

        <section aria-labelledby="family-members-title" className="flex flex-col gap-3">
          <h2 id="family-members-title" className="text-h3 text-content">
            Your family
          </h2>

          {overview.members.map((position) => (
            <FamilyMemberCard
              key={position.member.id}
              position={position}
              verificationStatus={position.member.role === 'primary' ? verificationStatus : null}
            />
          ))}
        </section>
      </div>

      {/* ---- Goals ---- */}
      <section aria-labelledby="family-goals-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="family-goals-title" className="text-h3 text-content">
            Family goals
          </h2>

          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.goalPlanner}>
              <Target aria-hidden="true" className="size-4" />
              Plan a goal
            </Link>
          </Button>
        </div>

        <Card variant="outlined" className="px-5 md:px-6">
          <ul className="flex list-none flex-col">
            {overview.goals.map((progress) => (
              <FamilyGoalRow key={progress.goal.id} progress={progress} />
            ))}
          </ul>
        </Card>

        {/*
          The honest limitation, stated once. Attributing every deposit a member
          holds to whichever goal looked plausible would be the dashboard
          inventing a link the platform does not have.
        */}
        <p className="text-caption text-content-muted">
          Progress counts only deposits that are linked to a goal. Booking does not yet record which
          goal a deposit was opened for, so most deposits are not attributed to one.
        </p>
      </section>

      {/* ---- Upcoming maturities ---- */}
      <section aria-labelledby="family-maturities-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="family-maturities-title" className="text-h3 text-content">
            Upcoming family maturities
          </h2>

          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.maturities}>
              <CalendarClock aria-hidden="true" className="size-4" />
              View all maturities
            </Link>
          </Button>
        </div>

        {overview.upcomingMaturities.length === 0 ? (
          <Card variant="outlined" className="p-5 md:p-6">
            <p className="text-body text-content-muted">
              Nothing in the family is due to mature yet.
            </p>
          </Card>
        ) : (
          <Card variant="outlined" className="px-5 md:px-6">
            <ul className="divide-border-default/60 flex list-none flex-col divide-y">
              {overview.upcomingMaturities.slice(0, 5).map(({ member, entry }) => (
                <li
                  key={entry.view.holding.reference}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body text-content font-medium">
                      {entry.view.holding.bank.name}
                    </span>
                    <span className="text-caption text-content-muted">
                      {member.displayName}
                      {entry.view.maturesOn === null
                        ? ''
                        : ` · ${formatMaturityDate(entry.view.maturesOn)}`}
                    </span>
                  </span>

                  <span className="text-caption text-content-muted tabular-nums">
                    Expected maturity {formatCurrency(entry.view.maturityValue)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* ---- Where to go next. Every destination is a route that exists. ---- */}
      <section aria-labelledby="family-links-title" className="flex flex-col gap-3">
        <h2 id="family-links-title" className="sr-only">
          Related
        </h2>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href={ROUTES.portfolio}>Your portfolio</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.reports}>
              <FileText aria-hidden="true" className="size-4" />
              Reports &amp; statements
            </Link>
          </Button>
        </div>
      </section>

      <p className="text-caption text-content-muted">
        Family accounts, invitations and shared permissions are not part of this build. No family
        member other than you exists on the platform, and nothing here grants anyone access to your
        identity documents, bank accounts or statements.
      </p>
    </div>
  );
}
