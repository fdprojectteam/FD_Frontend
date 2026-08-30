'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { usePortfolio } from '@/hooks/use-portfolio';
import { buildMaturitySchedule } from '@/utils/portfolio';
import { summarisePortfolio } from '@/utils/portfolio';

import { MaturingSoonBanner } from './maturing-soon-banner';
import { MaturityCard } from './maturity-card';
import { MaturityOverview } from './maturity-overview';
import { MaturityTimeline } from './maturity-timeline';

/**
 * Maturity Management — what is coming, and what decision it needs.
 *
 * ## Its relationship to the dashboard
 *
 * Portfolio answers *what do I own*; this answers *what happens next*. They
 * read the same holdings through the same hook and the same calculators — this
 * screen adds a schedule on top, and owns no data of its own. That is why it
 * lives beside the portfolio rather than in a module of its own: a maturity is
 * a question asked of a holding, not a second kind of thing.
 *
 * ## Order of the page
 *
 * Anything urgent first, then the four figures, then the deposits themselves,
 * then the shape of the years ahead, and finally what has already matured.
 * Someone with nothing close to maturity scrolls past an absent banner rather
 * than a reassuring one.
 *
 * ## Three states, kept distinct
 *
 * Loading is not emptiness. `isLoaded` is what the screen branches on, so the
 * empty state never flashes at an investor who holds deposits.
 */
export function MaturityScreen() {
  const { holdings, isLoaded } = usePortfolio();
  const [now] = useState(() => Date.now());

  /*
    One clock for the whole screen, so the banner's "in 24 days", each card's
    date and the timeline are all measured from the same instant.
  */
  const schedule = useMemo(
    () => buildMaturitySchedule(summarisePortfolio(holdings, now), now),
    [holdings, now],
  );

  if (!isLoaded) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="container-page flex flex-col gap-8 py-10 md:py-14"
      >
        <span className="sr-only">Loading your maturities…</span>
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasAnything =
    schedule.upcoming.length > 0 || schedule.matured.length > 0 || schedule.undated.length > 0;

  if (!hasAnything) {
    return (
      <div className="container-page py-10 md:py-14">
        <section className="flex flex-col items-center gap-6 py-10 text-center md:py-16">
          <Image
            src="/goal-based-icon.png"
            alt=""
            aria-hidden="true"
            width={160}
            height={160}
            className="h-auto w-32 object-contain md:w-40"
          />

          <div className="flex max-w-lg flex-col gap-3">
            <h1 className="text-h1 text-content">Your maturity calendar is empty</h1>
            <p className="text-body-lg text-content-muted">
              Once you invest in a fixed deposit, upcoming maturity dates and expected proceeds will
              appear here.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href={ROUTES.home}>
              Explore FDs
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-8 py-8 md:gap-10 md:py-12">
      <header className="flex flex-col gap-4">
        <Link
          href={ROUTES.portfolio}
          className="focus-ring text-body text-content-muted hover:text-content inline-flex w-fit items-center gap-1 rounded-md font-medium"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to portfolio
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-content">Your maturities</h1>
          <p className="text-body-lg text-content-muted">
            Stay ahead of your fixed deposit maturities and decide what happens next.
          </p>
        </div>
      </header>

      <MaturingSoonBanner entries={schedule.maturingSoon} />

      <MaturityOverview schedule={schedule} />

      {schedule.upcoming.length > 0 ? (
        <section aria-labelledby="maturity-upcoming-title" className="flex flex-col gap-4">
          <h2 id="maturity-upcoming-title" className="text-h2 text-content">
            Upcoming maturities{' '}
            <span className="text-content-muted font-normal">({schedule.upcoming.length})</span>
          </h2>

          <ul className="grid list-none grid-cols-1 gap-4 xl:grid-cols-2">
            {schedule.upcoming.map((entry) => (
              <li key={entry.view.holding.reference}>
                <MaturityCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MaturityTimeline schedule={schedule} />

      {/*
        Deposits whose term has run out are kept apart from what is still
        coming. The stage says the date has passed — it does not say the bank
        has settled, because nothing here knows that.
      */}
      {schedule.matured.length > 0 ? (
        <section aria-labelledby="maturity-matured-title" className="flex flex-col gap-4">
          <h2 id="maturity-matured-title" className="text-h2 text-content">
            Recently matured
          </h2>
          <ul className="grid list-none grid-cols-1 gap-4 xl:grid-cols-2">
            {schedule.matured.map((entry) => (
              <li key={entry.view.holding.reference}>
                <MaturityCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {schedule.undated.length > 0 ? (
        <section aria-labelledby="maturity-undated-title" className="flex flex-col gap-4">
          <h2 id="maturity-undated-title" className="text-h2 text-content">
            Awaiting a maturity date
          </h2>
          <ul className="grid list-none grid-cols-1 gap-4 xl:grid-cols-2">
            {schedule.undated.map((entry) => (
              <li key={entry.view.holding.reference}>
                <MaturityCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
