'use client';

import { RotateCw } from 'lucide-react';

/**
 * The page's title block, and a quiet statement of when the figures were made.
 *
 * ## Why "last updated" is deliberately small
 *
 * Every figure on this screen is derived on read, so it is always current — the
 * timestamp is reassurance, not news, and giving it visual weight would suggest
 * the portfolio goes stale between visits. It sits at the end of the row,
 * caption-sized, where it can be found and ignored in equal measure.
 *
 * The refresh control re-reads the store rather than calling anything: there is
 * no server to ask. It exists because a customer expects to be able to ask, and
 * it does the honest version of that.
 */
export interface PortfolioHeaderProps {
  generatedAt: number;
  onRefresh: () => void;
}

function formatStamp(at: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(at));
}

export function PortfolioHeader({ generatedAt, onRefresh }: PortfolioHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1 text-content">Your portfolio</h1>
        <p className="text-body-lg text-content-muted">
          Overview of your fixed deposits and returns
        </p>
      </div>

      <div className="text-caption text-content-muted flex items-center gap-2">
        <span className="tabular-nums">Last updated · {formatStamp(generatedAt)}</span>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh portfolio"
          className="focus-ring hover:text-content rounded-md p-1 transition-colors"
        >
          <RotateCw aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
