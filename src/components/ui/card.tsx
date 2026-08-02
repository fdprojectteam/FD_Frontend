import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Card — platform surface component (T1.3).
 *
 * Purpose: the core content surface of the platform (Document 06 §6 "Card
 * Philosophy": white surface, 20px radius, soft elevation, minimal borders).
 * Product cards, key-info panels, compare columns, and dashboards all
 * compose from this family.
 *
 * Variants: `default` (border + elevation-1 — standard resting card),
 * `elevated` (elevation-2 — featured/raised surfaces), `outlined` (border
 * only, no shadow — dense informational contexts like comparison panels).
 *
 * Structure: Card → CardHeader (CardTitle + CardDescription) → CardContent
 * → CardFooter (layout-only). Sections own their spacing (space-6 padding
 * rhythm); Card itself has no padding.
 *
 * Accessibility: semantic, non-interactive regions. CardTitle renders a
 * real <h3> to keep document heading hierarchy meaningful; interactive
 * behavior belongs to child components (Button, links), never to the Card.
 */
const cardVariants = cva('bg-surface-card rounded-card text-content', {
  variants: {
    variant: {
      default: 'border-border-default shadow-elevation-1 border',
      elevated: 'border-border-default shadow-elevation-2 border',
      outlined: 'border-border-default border shadow-none',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-h3 text-content', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-body text-content-muted', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

/** Layout-only action region: horizontal, token gap, section padding. */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { cardVariants };
