'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Accordion — platform disclosure component (T1.7), hand-assembled on
 * @radix-ui/react-accordion (registry unavailable; canonical shadcn
 * structure, 100% token re-skin).
 *
 * Purpose: expandable sections platform-wide — Product Details, Interest
 * Breakdown, FAQs, Terms & Conditions, future Portfolio sections. Fully
 * domain-agnostic; standard Radix composition (no simplified API).
 *
 * Motion: smooth height expand/collapse via the generic ds-expand
 * keyframes (globals.css), driven by Radix's measured content height and
 * the motion tokens (--ds-duration-base / --ds-ease-out). Reduced-motion
 * users get an immediate state change through the global rule.
 *
 * Accessibility: unmodified Radix — Enter/Space toggle, ArrowUp/Down +
 * Home/End roving focus, aria-expanded/aria-controls on triggers,
 * labelled region content, real <h3> heading per item (Radix Header).
 */
export const Accordion = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root ref={ref} className={cn('flex flex-col gap-3', className)} {...props} />
));
Accordion.displayName = 'Accordion';

export const AccordionItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      'border-border-default bg-surface-card data-[disabled]:bg-surface-muted rounded-md border data-[disabled]:opacity-70',
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'focus-ring text-body text-content hover:bg-surface-muted data-[disabled]:text-content-placeholder duration-fast flex w-full items-center justify-between gap-4 rounded-md px-4 py-3 text-left font-medium transition ease-out data-[disabled]:pointer-events-none [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className="text-content-muted duration-base size-4 shrink-0 transition-transform ease-out"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    // The animating element: overflow-hidden prevents paint outside the
    // measured height; padding lives on the inner div so the measured
    // height matches the rendered content exactly (no end-of-animation jump).
    className="data-[state=closed]:animate-collapse-up data-[state=open]:animate-expand-down overflow-hidden [--ds-expand-height:var(--radix-accordion-content-height)]"
    {...props}
  >
    <div
      className={cn(
        'border-divider text-body text-content-muted border-t px-4 pt-3 pb-4',
        className,
      )}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';
