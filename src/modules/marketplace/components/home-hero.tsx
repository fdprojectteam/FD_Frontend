import { ArrowRight, ShieldCheck, Star } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { HeroSpotlightCard } from './hero-spotlight-card';
import type { ProductSummary } from '../types/product';

/**
 * HomeHero — the approved Marketplace hero (M2.3).
 *
 * Copy, CTAs, and trust line on the left; the rate spotlight on the right
 * (desktop only, decision D1). Presentation-only: the spotlight product is
 * selected by HomeScreen.
 *
 * "Explore Fixed Deposits" jumps to the product listing, which exists as
 * of M2.4 — it is a real in-page anchor, retiring the M2.3 placeholder.
 * "How it works" has no destination yet, so it keeps the approved T1.13
 * pattern: visually identical, aria-disabled, no href.
 *
 * Rendering the anchor through Button `asChild` keeps a single button
 * implementation; `asChild` bypasses icon composition, so the trailing
 * icon is composed here exactly as Button composes `rightIcon`.
 */
const TRUST_LINE: { id: string; label: string; icon: ReactNode }[] = [
  { id: 'rbi', label: 'RBI regulated', icon: <ShieldCheck className="size-4" /> },
  { id: 'dicgc', label: '₹5L DICGC insured', icon: <ShieldCheck className="size-4" /> },
  { id: 'partners', label: '50+ partner banks', icon: <Star className="size-4" /> },
];

export interface HomeHeroProps {
  spotlightProduct?: ProductSummary;
}

export function HomeHero({ spotlightProduct }: HomeHeroProps) {
  return (
    <section
      aria-labelledby="home-hero-title"
      className="grid gap-8 md:grid-cols-2 md:items-center"
    >
      <div className="flex flex-col gap-6">
        <span className="text-caption text-content-brand font-semibold tracking-wide uppercase">
          Fixed deposits, simplified
        </span>

        <h1 id="home-hero-title" className="text-h1 text-content max-w-xl">
          Grow your savings with India&apos;s most trusted banks
        </h1>

        <p className="text-body-lg text-content-muted max-w-xl">
          Compare Fixed Deposits from 50+ RBI-regulated banks in one place — transparent rates, no
          hidden terms.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" asChild>
            <a href="#products">
              Explore Fixed Deposits
              <span aria-hidden="true" className="inline-flex shrink-0">
                <ArrowRight className="size-4" />
              </span>
            </a>
          </Button>
          <Button size="lg" variant="secondary" aria-disabled="true">
            How it works
          </Button>
        </div>

        <ul className="flex list-none flex-wrap items-center gap-6">
          {TRUST_LINE.map((item) => (
            <li key={item.id} className="text-caption text-content-muted flex items-center gap-2">
              <span aria-hidden="true" className="text-success inline-flex">
                {item.icon}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {spotlightProduct ? <HeroSpotlightCard product={spotlightProduct} /> : null}
    </section>
  );
}
