import { Calculator, Database, ListChecks, MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';

import { DataProvenanceNote } from '@/components/business';

/**
 * TrustStrip — what this platform actually does for you, above the footer.
 *
 * ## What this strip used to say, and why none of it survived
 *
 * | Was | Why it went |
 * |---|---|
 * | "RBI regulated — every partner bank is licensed and regulated by the RBI" | The platform has verified no bank's licence. The catalogue is a fixture. |
 * | "Secure and encrypted — bank-grade encryption" | There is no encryption claim this build can support, and none is needed: no credential is ever collected. |
 * | "No hidden charges — the rate you see is the rate you get, always" | "Always" is a guarantee about a bank's rate card the platform does not control. |
 * | "Support when you need it — reach a real person" | No person is reachable. Support requests in this build are simulated and say so. |
 *
 * Each was a claim about the world. What replaced them are four statements
 * about **this product's own behaviour**, every one of which is checkable by
 * using it: the terms are shown, the arithmetic is shown, the comparison is
 * like-for-like, and the questions go to a help centre that is honest about
 * being a demonstration.
 *
 * ## Why the strip was kept at all
 *
 * Deleting it would have been easier and worse. A customer deciding where to
 * put money is entitled to know what a platform does and does not do for them,
 * and an empty space says nothing. Reassurance is not the problem; unearned
 * reassurance is.
 *
 * Static content, no data dependency, server-rendered.
 */
const ITEMS: { id: string; title: string; description: string; icon: ReactNode }[] = [
  {
    id: 'terms',
    title: 'Terms before you commit',
    description: 'Rate, tenure, payout and minimum are on screen before any booking step.',
    icon: <ListChecks className="size-5" />,
  },
  {
    id: 'workings',
    title: 'The arithmetic is shown',
    description: 'Every maturity figure is calculated from the deposit’s own terms, not quoted.',
    icon: <Calculator className="size-5" />,
  },
  {
    id: 'comparable',
    title: 'Compared like for like',
    description:
      'The same amount and tenure across every deposit, so the difference is the deposit.',
    icon: <Database className="size-5" />,
  },
  {
    id: 'questions',
    title: 'Questions answered in the open',
    description: 'A help centre that says which parts of this build are a demonstration.',
    icon: <MessageSquare className="size-5" />,
  },
];

export function TrustStrip() {
  return (
    <section
      aria-labelledby="home-trust-title"
      className="border-border-default flex flex-col gap-8 border-t pt-12"
    >
      <h2 id="home-trust-title" className="sr-only">
        What this platform does
      </h2>
      <ul className="grid list-none grid-cols-1 gap-8 md:grid-cols-4">
        {ITEMS.map((item) => (
          <li key={item.id} className="flex min-w-0 flex-col gap-2">
            <span aria-hidden="true" className="text-content-brand inline-flex">
              {item.icon}
            </span>
            <h3 className="text-body text-content font-medium">{item.title}</h3>
            <p className="text-caption text-content-muted">{item.description}</p>
          </li>
        ))}
      </ul>

      {/*
        Said once, at the foot of the page the catalogue is on. The hero states
        it for someone who reads no further; this is for someone who scrolled
        the whole listing and is about to choose.
      */}
      <DataProvenanceNote />
    </section>
  );
}
