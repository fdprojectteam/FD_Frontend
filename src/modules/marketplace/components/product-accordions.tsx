'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type { ProductDetails } from '../types/product';

/**
 * ProductAccordions — Interest breakdown · FAQs · Terms and conditions
 * (M2.6, T2.6.6).
 *
 * Presentation-only: content arrives as props, and the only state is which
 * panel is open — transient UI, never the URL (invariant I6).
 *
 * Behaviour and accessibility are **unmodified Radix**, via the frozen
 * `Accordion` primitive: Enter/Space toggle, ArrowUp/Down and Home/End roving
 * focus, `aria-expanded` / `aria-controls` on each trigger, and a labelled
 * region for each panel. Each trigger sits inside a real `<h3>` (Radix
 * Header), which follows the screen's `<h2>` section headings without skipping
 * a level.
 *
 * `type="single" collapsible` — one panel at a time, and the open one can be
 * closed again. All three start closed, as the approved screen draws them.
 * The approved screens never show an **expanded** panel, so the content
 * layouts below are inferred from the data shapes and are recorded as
 * assumptions in the implementation report rather than presented as design.
 */
export interface ProductAccordionsProps {
  product: ProductDetails;
}

export function ProductAccordions({ product }: ProductAccordionsProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="interest-breakdown">
        <AccordionTrigger>Interest breakdown</AccordionTrigger>
        <AccordionContent>
          <p>{product.interestBreakdown}</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faqs">
        <AccordionTrigger>FAQs</AccordionTrigger>
        <AccordionContent>
          {/*
            A description list, not nested accordions: the design shows no
            second level of disclosure, and inventing one would add an
            interaction nobody approved.
          */}
          <dl className="flex flex-col gap-4">
            {product.faqs.map((faq) => (
              <div key={faq.question} className="flex flex-col gap-1">
                <dt className="text-content font-medium">{faq.question}</dt>
                <dd>{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="terms">
        <AccordionTrigger>Terms and conditions</AccordionTrigger>
        <AccordionContent>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {product.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
