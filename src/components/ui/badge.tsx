import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Badge — display-only status/label pill (T1.4).
 *
 * Purpose: the platform's non-interactive tag. In the approved UI: trust
 * badges (RBI Regulated, ₹5L DICGC Insured, AAA Rating), highlight flags
 * (Highest Rate, Short-Term), benefit tags (Senior citizen +0.5%,
 * Auto-renewal), and numeric labels.
 *
 * Variants (all sampled from the approved screens):
 * `brand` — purple-tint fill + brand text ("Highest Rate" flag),
 * `success` — card surface + border + success text (trust badges),
 * `neutral` — muted fill + muted text (inset informational tags),
 * `outline` — card surface + border + muted text (benefit chips, static).
 *
 * Sizes: `sm`, `md` — both on the caption type token; padding steps from
 * the approved spacing scale only.
 *
 * Accessibility: semantic <span>, no ARIA, no keyboard behavior — Badge is
 * never interactive (interactive pills are Chip, a separate component).
 * Icons are decorative and aria-hidden; meaning must be in the text.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full font-medium whitespace-nowrap select-none',
  {
    variants: {
      variant: {
        brand: 'bg-surface-brand-subtle text-content-brand',
        success: 'border-border-default bg-surface-card text-success border',
        neutral: 'bg-surface-muted text-content-muted',
        outline: 'border-border-default bg-surface-card text-content-muted border',
      },
      size: {
        // Both sizes stay on the approved 4px-base spacing scale (§5).
        sm: 'text-caption px-2 py-1',
        md: 'text-caption px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Decorative leading icon — hidden from screen readers. */
  leftIcon?: ReactNode;
  /** Decorative trailing icon — hidden from screen readers. */
  rightIcon?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, leftIcon, rightIcon, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {leftIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {rightIcon}
        </span>
      )}
    </span>
  ),
);
Badge.displayName = 'Badge';

export { badgeVariants };
