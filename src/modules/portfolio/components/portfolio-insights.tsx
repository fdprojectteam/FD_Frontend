'use client';

import { Card } from '@/components/ui/card';

import { AllocationRing } from './allocation-ring';
import type { PortfolioSummary } from '../utils/portfolio-summary';

/**
 * How the portfolio is spread — by bank, and by how long the money is committed.
 *
 * ## Two questions, both real
 *
 * *Am I too concentrated with one bank* matters because deposit insurance is per
 * bank. *How long is my money tied up* matters because it decides what the
 * investor can reach. Both are answerable from data the platform actually holds,
 * which is the test for whether an insight belongs here at all.
 *
 * ## It disappears when there is nothing to compare
 *
 * With a single bank and a single term band there is no allocation — a ring of
 * one segment is decoration. Diversification is information only once there is
 * something to diversify across.
 *
 * Presentation only; every share arrives computed.
 */
export function PortfolioInsights({ summary }: { summary: PortfolioSummary }) {
  const showBanks = summary.byBank.length > 1;
  const showMaturity = summary.byMaturity.length > 1;

  if (!showBanks && !showMaturity) return null;

  return (
    <section aria-labelledby="portfolio-insights-title" className="flex flex-col gap-4">
      <h2 id="portfolio-insights-title" className="text-h2 text-content">
        Portfolio insights
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {showBanks ? (
          <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-body-lg text-content font-semibold">By bank</h3>
              <p className="text-caption text-content-muted">
                Deposit insurance applies per depositor, per bank.
              </p>
            </div>

            <AllocationRing
              caption={summary.byBank.length === 1 ? 'bank' : 'banks'}
              total={summary.totalPrincipal}
              segments={summary.byBank.map((entry) => ({
                id: entry.bankId,
                label: entry.bankName,
                principal: entry.principal,
                sharePercent: entry.sharePercent,
              }))}
            />
          </Card>
        ) : null}

        {showMaturity ? (
          <Card variant="outlined" className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-body-lg text-content font-semibold">By term</h3>
              <p className="text-caption text-content-muted">
                How long each part of your money is committed for.
              </p>
            </div>

            <AllocationRing
              caption={summary.byMaturity.length === 1 ? 'band' : 'bands'}
              total={summary.totalPrincipal}
              segments={summary.byMaturity.map((entry) => ({
                id: entry.id,
                label: entry.label,
                principal: entry.principal,
                sharePercent: entry.sharePercent,
              }))}
            />
          </Card>
        ) : null}
      </div>
    </section>
  );
}
