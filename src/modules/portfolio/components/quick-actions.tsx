'use client';
import { ArrowRight, Compass, FileText, Target } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';

/**
 * What the investor can do from here.
 *
 * ## Only what the product actually does
 *
 * Two of these navigate to real screens. The third — a consolidated statement —
 * does not exist: there is no statement generator, and no booking record on a
 * server to build one from. It is shown as unavailable rather than omitted,
 * because a customer looking for their statement should learn that it is coming
 * rather than wonder where it is, and rather than click something that quietly
 * does nothing.
 *
 * That is the same treatment "Save for Later" and "Add New Bank Account" carry
 * elsewhere in this product.
 */
interface QuickAction {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  href?: Route;
  unavailable?: string;
}

const ACTIONS: QuickAction[] = [
  {
    id: 'explore',
    icon: <Compass aria-hidden="true" className="size-4" />,
    title: 'Explore FDs',
    description: 'Compare rates across partner banks',
    href: ROUTES.home,
  },
  {
    id: 'plan',
    icon: <Target aria-hidden="true" className="size-4" />,
    title: 'Plan by goal',
    description: 'Build an FD plan around what you are saving for',
    href: ROUTES.goalPlanner,
  },
  {
    id: 'statement',
    icon: <FileText aria-hidden="true" className="size-4" />,
    title: 'Download statement',
    description: 'Consolidated portfolio statement',
    unavailable: 'Not available yet',
  },
];

export function QuickActions() {
  return (
    <Card variant="outlined" className="flex flex-col gap-1 p-5 md:p-6">
      <h2 className="text-body-lg text-content mb-2 font-semibold">Quick actions</h2>

      <ul className="flex list-none flex-col">
        {ACTIONS.map((action) => {
          const body = (
            <span className="flex w-full items-center gap-3">
              <span className="bg-surface-brand-subtle text-content-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                {action.icon}
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body text-content font-medium">{action.title}</span>
                <span className="text-caption text-content-muted break-words">
                  {action.description}
                </span>
              </span>

              {action.href ? (
                <ArrowRight
                  aria-hidden="true"
                  className="text-content-muted motion-safe:duration-base size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              ) : (
                <span className="text-caption text-content-placeholder shrink-0">
                  {action.unavailable}
                </span>
              )}
            </span>
          );

          return (
            <li key={action.id} className="border-border-default/60 border-b last:border-b-0">
              {action.href ? (
                <Link
                  href={action.href}
                  className="focus-ring group hover:bg-surface-subtle -mx-2 flex rounded-lg px-2 py-3 transition-colors"
                >
                  {body}
                </Link>
              ) : (
                <span aria-disabled="true" className="-mx-2 flex px-2 py-3 opacity-70">
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
