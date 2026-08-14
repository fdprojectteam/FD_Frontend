import { ArrowRight, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

import { HeroSpotlightCard } from './hero-spotlight-card';
import type { ProductSummary } from '../types/product';

/**
 * HomeHero — the approved Marketplace hero (M2.3).
 *
 * Copy, CTAs, and trust line on the left; the rate spotlight on the right
 * (desktop only, decision D1). Presentation-only: the spotlight product is
 * selected by HomeScreen.
 *
 * ## CTA hierarchy — guided first (decision A1)
 *
 * The primary action is **"Find my FD"**, into the goal planner. A new customer
 * arriving here usually cannot answer "which deposit?", and the previous primary
 * ("Explore Fixed Deposits") handed them a 24-product list and left them to it.
 * Browsing is still one click away as the secondary — customers who already know
 * what they want lose nothing.
 *
 * This also retires "How it works", which had been `aria-disabled` with no
 * destination since M2.3. A dead control was occupying the second-most valuable
 * position on the page.
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
          Compare Fixed Deposits from 50+ RBI-regulated banks — transparent rates, no hidden terms,
          and a planner that matches deposits to your goal.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" asChild>
            <Link href={ROUTES.goalPlanner}>
              Find my FD
              <span aria-hidden="true" className="inline-flex shrink-0">
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="#products">Browse all FDs</a>
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
