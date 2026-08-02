import { CircleCheck, Headphones, Lock, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * TrustStrip — the four-item value strip above the footer (M2.3).
 *
 * This is a feature strip with headings and body copy, not the compact
 * badge treatment used by TrustIndicatorList — same tokens, different
 * composition. Static content from the approved UI; no data dependency.
 */
const ITEMS: { id: string; title: string; description: string; icon: ReactNode }[] = [
  {
    id: 'rbi',
    title: 'RBI regulated',
    description: 'Every partner bank is licensed and regulated by the RBI.',
    icon: <ShieldCheck className="size-5" />,
  },
  {
    id: 'secure',
    title: 'Secure and encrypted',
    description: 'Your data is protected with bank-grade encryption.',
    icon: <Lock className="size-5" />,
  },
  {
    id: 'no-charges',
    title: 'No hidden charges',
    description: 'The rate you see is the rate you get, always.',
    icon: <CircleCheck className="size-5" />,
  },
  {
    id: 'support',
    title: 'Support when you need it',
    description: 'Reach a real person for anything investment-related.',
    icon: <Headphones className="size-5" />,
  },
];

export function TrustStrip() {
  return (
    <section aria-labelledby="home-trust-title" className="border-border-default border-t pt-12">
      <h2 id="home-trust-title" className="sr-only">
        Why invest with us
      </h2>
      <ul className="grid list-none gap-8 md:grid-cols-4">
        {ITEMS.map((item) => (
          <li key={item.id} className="flex flex-col gap-2">
            <span aria-hidden="true" className="text-content-brand inline-flex">
              {item.icon}
            </span>
            <h3 className="text-body text-content font-medium">{item.title}</h3>
            <p className="text-caption text-content-muted">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
