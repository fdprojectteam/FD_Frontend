import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * What a new investor sees.
 *
 * ## Not a dashboard full of zeroes
 *
 * Rendering the overview with ₹0 in every tile would be technically accurate
 * and completely wrong: it makes an empty portfolio look like a broken one, and
 * it puts four meaningless figures in front of someone who has not yet made a
 * decision. What they need is to understand what will appear here, and one way
 * to begin.
 *
 * Server-rendered — it holds no state and reads nothing.
 */
export function PortfolioEmptyState() {
  return (
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
        <h1 className="text-h1 text-content">Your FD portfolio is empty</h1>
        <p className="text-body-lg text-content-muted">
          Already have FDs elsewhere? Bring them here to manage every fixed deposit, maturity date
          and expected return in one place.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={ROUTES.portfolioAddFd}>Bring my FDs</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href={ROUTES.home}>
            Explore FDs
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
