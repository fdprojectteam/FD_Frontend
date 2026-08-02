import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Button — Design System reference implementation (T1.1).
 *
 * Purpose: the single button for the entire platform. Every action in the
 * approved UI (Invest Now, View details, Compare, Search, Calculate,
 * Continue to Booking) is a configuration of this component.
 *
 * Variants: `primary` (brand surface — Invest Now / booking CTAs),
 * `secondary` (card surface + default border — View details / Compare),
 * `outline` (brand border + brand text — poster "Compare FD" style),
 * `ghost` (no surface and no border until hover — icon-only and low-emphasis
 * controls: remove, carousel arrows).
 * Sizes: `sm` 32px (pointer-dense desktop contexts only), `md` **44px below
 * `md`, 40px from `md` up** (default), `lg` 48px (hero / booking CTAs),
 * `icon` 44px square (for a control whose label is its icon).
 *
 * The default size is responsive because 40px is below the platform's own
 * `--ds-touch-target-min` (44px, Document 14 §10) and every card action on
 * Marketplace Home is a default-size button. Held in the primitive rather than
 * overridden per call site: one rule, one owner, every 40px control repaired
 * at once. Desktop is unchanged.
 *
 * `ghost` was specified in the Phase 0 blueprint §9 and omitted from T1.1;
 * `icon` is its companion, because a variant with no surface still needs a
 * hit area. They are implemented together at T2.7.8a, where three icon-only
 * controls were found passing both values to a Button that declared neither —
 * cva drops an unknown variant silently, so those controls had been rendering
 * with no size at all (16–20px targets).
 *
 * Accessibility: native <button> semantics; visible focus ring via the
 * `focus-ring` token utility; `disabled` uses real disabled semantics;
 * `loading` sets `aria-busy`, disables interaction, and hides the spinner
 * from screen readers. All styling resolves to design tokens — no raw
 * palette classes, hex values, or arbitrary values.
 */
const buttonVariants = cva(
  // Base: layout, typography (weight-medium per inventory §4), token radius,
  // token motion (default transition includes box-shadow so hover elevation
  // animates smoothly). Disabled combines an explicit muted palette with
  // opacity-70 (= --ds-opacity-muted) rather than relying on opacity alone.
  'focus-ring inline-flex select-none items-center justify-center gap-2 rounded-md text-body font-medium whitespace-nowrap transition duration-fast ease-out disabled:pointer-events-none disabled:opacity-70 disabled:shadow-none',
  {
    variants: {
      variant: {
        primary:
          'bg-surface-brand text-content-on-brand hover:shadow-elevation-1 active:shadow-none disabled:bg-surface-muted disabled:text-content-placeholder',
        secondary:
          'border-border-strong bg-surface-card text-content hover:bg-surface-muted border active:bg-surface-muted disabled:border-border-default disabled:bg-surface-muted disabled:text-content-placeholder',
        outline:
          'border-border-primary text-content-brand hover:bg-surface-brand-subtle active:bg-surface-brand-subtle border bg-transparent font-semibold disabled:border-border-default disabled:bg-transparent disabled:text-content-placeholder',
        ghost:
          'text-content-muted hover:bg-surface-muted active:bg-surface-muted bg-transparent disabled:bg-transparent disabled:text-content-placeholder',
      },
      size: {
        sm: 'h-8 px-3 text-caption', // 32px — --ds-button-sm
        md: 'h-11 px-4 md:h-10', // 44px touch (--ds-touch-target-min) → 40px from md (--ds-button-md)
        lg: 'h-12 px-6 text-body-lg', // 48px — --ds-button-lg
        icon: 'size-11 p-0', // 44px square — --ds-touch-target-min
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a <Link>) while keeping button styling. */
  asChild?: boolean;
  /** Shows a spinner, sets aria-busy, and disables interaction. */
  loading?: boolean;
  /** Icon rendered before the label (decorative — hidden from screen readers). */
  leftIcon?: ReactNode;
  /** Icon rendered after the label (decorative — hidden from screen readers). */
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    // gap-3 (= --ds-space-3) gives the spinner more breathing room than the
    // default icon gap while staying on the approved spacing scale.
    const classes = cn(buttonVariants({ variant, size }), loading && 'gap-3', className);

    // asChild delegates rendering to the child (single-element contract of
    // Slot); loading/icon composition applies only to real buttons.
    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          leftIcon && (
            <span aria-hidden="true" className="inline-flex shrink-0">
              {leftIcon}
            </span>
          )
        )}
        {children}
        {rightIcon && !loading && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
