'use client';

import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useSupportRequests } from '@/hooks/use-support-requests';
import { HELP_ARTICLES, HELP_CATEGORY_LABEL, HELP_CATEGORY_SUMMARY } from '@/services/support';
import type { SupportCategory } from '@/types/support';

import { RequestStatusBadge } from './request-status-badge';
import { articlesInCategory, searchHelp } from '../utils/search-help';

/**
 * Help & support.
 *
 * ## Self-service first, contact second
 *
 * The search field is the first thing on the page and the contact action is the
 * last. Most support questions in a product like this are *"where is the thing
 * I am looking for"*, and answering that in place is faster for the customer
 * than any ticket could be. Contacting support stays one click away for
 * everything else.
 *
 * ## Search, not an assistant
 *
 * Typing filters the help content by title, keywords and category. There is no
 * model behind it, and nothing on screen implies one: no chat bubble, no
 * typing indicator, no generated answer. Pretending otherwise would mean
 * showing the customer sentences nobody wrote.
 *
 * ## Requests are shown, not buried
 *
 * A customer who has contacted support before is usually coming back to check
 * on it. Recent requests sit beside the help content on a wide screen and
 * directly under it on a phone — not behind a tab.
 */
const TOPICS: readonly SupportCategory[] = [
  'fd-booking',
  'payment',
  'verification',
  'bank-account',
  'documents',
  'maturity',
];

export function SupportHomeScreen() {
  const { requests, isLoaded } = useSupportRequests();

  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<SupportCategory | null>(null);

  const results = useMemo(() => searchHelp(query, HELP_ARTICLES), [query]);
  const isSearching = query.trim().length >= 2;

  const listed = useMemo(
    () =>
      isSearching
        ? results.map((result) => result.article)
        : topic === null
          ? []
          : articlesInCategory(topic, HELP_ARTICLES),
    [isSearching, results, topic],
  );

  return (
    <div className="container-page flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-h1 text-content">How can we help?</h1>
        <p className="text-body-lg text-content-muted">
          Search the help content, or send us a request about a specific deposit or account.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        {/* ---- Help and search ---- */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="support-search" className="sr-only">
              Search help
            </label>
            <Input
              id="support-search"
              size="lg"
              type="search"
              placeholder="Where is my FD?"
              value={query}
              prefix={<Search aria-hidden="true" className="size-4" />}
              aria-describedby="support-search-hint"
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
            <p id="support-search-hint" className="text-caption text-content-muted">
              Searches help articles by title and topic. This is a search, not an assistant — no
              answers are generated.
            </p>
          </div>

          {/* Topics double as filters. A chip row, not six large cards. */}
          <div className="flex flex-col gap-3">
            <h2 className="text-h3 text-content">Popular topics</h2>

            <div role="group" aria-label="Help topics" className="flex flex-wrap gap-2">
              {TOPICS.map((category) => (
                <Chip
                  key={category}
                  selected={topic === category}
                  onClick={() => {
                    setTopic((current) => (current === category ? null : category));
                    setQuery('');
                  }}
                >
                  {HELP_CATEGORY_LABEL[category]}
                </Chip>
              ))}
            </div>

            {topic === null || isSearching ? null : (
              <p className="text-caption text-content-muted">{HELP_CATEGORY_SUMMARY[topic]}</p>
            )}
          </div>

          {/* ---- Results ---- */}
          <section aria-labelledby="support-results-title" className="flex flex-col gap-3">
            <h2 id="support-results-title" className="sr-only">
              Help articles
            </h2>

            <p role="status" className="sr-only">
              {isSearching
                ? `${String(results.length)} help ${results.length === 1 ? 'article' : 'articles'} matched.`
                : ''}
            </p>

            {isSearching && results.length === 0 ? (
              <Card variant="outlined" className="flex flex-col items-start gap-3 p-5 md:p-6">
                <p className="text-body text-content">No help articles matched your search.</p>
                <p className="text-caption text-content-muted">
                  Try a shorter word — “maturity”, “statement”, “IFSC” — or send us a request and
                  describe it in your own words.
                </p>
                <Button asChild variant="secondary">
                  <Link href={ROUTES.supportNew()}>Contact support</Link>
                </Button>
              </Card>
            ) : listed.length === 0 ? (
              <Card variant="outlined" className="p-5 md:p-6">
                <p className="text-body text-content-muted">
                  Choose a topic above, or search for what you need.
                </p>
              </Card>
            ) : (
              <Card variant="outlined" className="px-5 md:px-6">
                <ul className="divide-border-default/60 flex list-none flex-col divide-y">
                  {listed.map((article) => (
                    <li key={article.id} className="flex flex-col gap-1.5 py-4">
                      <h3 className="text-body text-content font-medium">{article.title}</h3>
                      <p className="text-caption text-content-muted">{article.body}</p>

                      {article.route === null ? null : (
                        <Link
                          href={article.route}
                          className="focus-ring text-caption text-content-brand group inline-flex w-fit items-center gap-1 rounded-md font-medium"
                        >
                          Take me there
                          <ArrowRight
                            aria-hidden="true"
                            className="motion-safe:duration-base size-3.5 transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        {/* ---- Requests ---- */}
        <section aria-labelledby="support-requests-title" className="flex flex-col gap-3">
          <h2 id="support-requests-title" className="text-h3 text-content">
            Your requests
          </h2>

          <Card variant="outlined" className="flex flex-col px-5 md:px-6">
            {!isLoaded ? (
              <p className="text-caption text-content-muted py-4">Loading your requests…</p>
            ) : requests.length === 0 ? (
              <p className="text-body text-content-muted py-4">
                You haven&apos;t contacted support yet.
              </p>
            ) : (
              <ul className="divide-border-default/60 flex list-none flex-col divide-y">
                {requests.slice(0, 5).map((request) => (
                  <li key={request.id}>
                    <Link
                      href={ROUTES.supportRequest(request.id)}
                      className="focus-ring group -mx-2 flex flex-col gap-1 rounded-lg px-2 py-4"
                    >
                      <span className="text-caption text-content-muted tabular-nums">
                        {request.id}
                      </span>
                      <span className="text-body text-content font-medium">{request.subject}</span>
                      <RequestStatusBadge status={request.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Button asChild>
            <Link href={ROUTES.supportNew()}>Contact support</Link>
          </Button>

          <p className="text-caption text-content-muted">
            Demonstration build: requests are recorded on this device only. No support team, bank or
            external system receives them, and nothing is emailed or texted.
          </p>
        </section>
      </div>
    </div>
  );
}
