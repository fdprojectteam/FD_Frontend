'use client';

import { CalendarClock, CalendarDays, Coins, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { formatMaturityDate } from '@/utils/finance';
import { formatCurrency } from '@/utils/format';
import type { MaturitySchedule } from '@/utils/portfolio';

/**
 * The four figures that answer "what is coming".
 *
 * Every one is countable from the schedule — a date, an amount, a count, a sum.
 * No percentage change and no projection: there is nothing to compare a
 * maturity against, and a figure invented to fill a fourth tile is exactly the
 * decoration this screen must not carry.
 *
 * Presentation only.
 */
export function MaturityOverview({ schedule }: { schedule: MaturitySchedule }) {
  const next = schedule.next;

  const tiles: { id: string; icon: ReactNode; label: string; value: string; context: string }[] = [
    {
      id: 'next',
      icon: <CalendarClock aria-hidden="true" className="size-4" />,
      label: 'Next maturity',
      value:
        next?.view.maturesOn === undefined || next?.view.maturesOn === null
          ? 'None scheduled'
          : formatMaturityDate(next.view.maturesOn),
      context: next === null ? 'Nothing upcoming' : next.view.holding.bank.name,
    },
    {
      id: 'next-amount',
      icon: <Wallet aria-hidden="true" className="size-4" />,
      label: 'Expected at that maturity',
      value: next === null ? 'Not available' : formatCurrency(next.view.maturityValue),
      context:
        next === null
          ? 'Nothing upcoming'
          : next.daysRemaining === null
            ? 'Date not published'
            : `In ${String(next.daysRemaining)} ${next.daysRemaining === 1 ? 'day' : 'days'}`,
    },
    {
      id: 'this-year',
      icon: <CalendarDays aria-hidden="true" className="size-4" />,
      label: 'Maturing this year',
      value: String(schedule.maturingThisYear),
      context: schedule.maturingThisYear === 1 ? 'deposit' : 'deposits',
    },
    {
      id: 'total',
      icon: <Coins aria-hidden="true" className="size-4" />,
      label: 'Total upcoming value',
      value: formatCurrency(schedule.totalUpcomingValue),
      context: `Across ${String(schedule.upcoming.length)} ${schedule.upcoming.length === 1 ? 'deposit' : 'deposits'}`,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {tiles.map((tile) => (
        <Card key={tile.id} variant="outlined" className="flex flex-col gap-2 p-4 md:p-5">
          <dt className="text-caption text-content-muted flex items-center gap-1.5">
            <span className="text-content-brand">{tile.icon}</span>
            {tile.label}
          </dt>
          <dd className="flex flex-col gap-0.5">
            <span className="text-h3 text-content font-semibold break-words tabular-nums">
              {tile.value}
            </span>
            <span className="text-caption text-content-muted break-words">{tile.context}</span>
          </dd>
        </Card>
      ))}
    </dl>
  );
}
