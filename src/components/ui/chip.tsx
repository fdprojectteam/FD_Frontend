import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Chip — interactive filter pill (T1.5).
 *
 * Purpose: the toggling filter control of the approved UI (Bank / Tenure /
 * Interest Rate / Amount chips on Marketplace Home; "+ More Filters" and
 * removable filter tags on the design-system poster). Badge (T1.4) is its
 * display-only sibling — if it doesn't toggle, it isn't a Chip.
 *
 * States (Component Token Mapping §2e): default (card surface, default
 * border, muted text), hover (muted fill), selected (brand border, brand
 * text, brand-subtle fill), focus-visible (token ring), disabled (layered
 * muted palette — same pattern as Button/Input).
 *
 * Accessibility: semantic <button type="button"> with `aria-pressed`
 * reflecting selection; Enter/Space via native behavior; decorative icons
 * aria-hidden. `removable` renders a chip *group* (a styled span containing
 * the toggle button and a separate remove button) because nesting buttons
 * is invalid HTML — each button keeps its own focus ring, and the remove
 * button gets an explicit aria-label.
 */
const chipVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-2 rounded-full border font-medium whitespace-nowrap transition duration-fast ease-out select-none',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-caption', // 32px — --ds-button-sm (mapping §2e)
        md: 'h-10 px-4 text-body', // 40px — --ds-button-md
      },
      selected: {
        true: 'border-border-primary bg-surface-brand-subtle text-content-brand',
        false: 'border-border-default bg-surface-card text-content-muted hover:bg-surface-muted',
      },
      disabled: {
        true: 'border-border-default bg-surface-muted text-content-placeholder pointer-events-none opacity-70',
        false: '',
      },
    },
    defaultVariants: {
      size: 'sm',
      selected: false,
      disabled: false,
    },
  },
);

export interface ChipProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    Omit<VariantProps<typeof chipVariants>, 'selected' | 'disabled'> {
  /** Selection state — exposed to assistive tech via aria-pressed. */
  selected?: boolean;
  disabled?: boolean;
  /** Decorative leading icon — hidden from screen readers. */
  leftIcon?: ReactNode;
  /** Decorative trailing icon — hidden from screen readers. */
  rightIcon?: ReactNode;
  /** Renders a separate remove affordance next to the toggle. */
  removable?: boolean;
  /** Called when the remove affordance is activated. */
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      size,
      selected = false,
      disabled = false,
      leftIcon,
      rightIcon,
      removable = false,
      onRemove,
      children,
      ...props
    },
    ref,
  ) => {
    const iconSpan = (icon: ReactNode) => (
      <span aria-hidden="true" className="inline-flex shrink-0">
        {icon}
      </span>
    );

    if (removable) {
      // Chip group: styling lives on the wrapper; the toggle and remove
      // controls are sibling buttons (buttons must never nest).
      return (
        <span className={cn(chipVariants({ size, selected, disabled }), 'gap-1 pr-2', className)}>
          <button
            ref={ref}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-transparent text-inherit"
            {...props}
          >
            {leftIcon && iconSpan(leftIcon)}
            {children}
            {rightIcon && iconSpan(rightIcon)}
          </button>
          <button
            type="button"
            aria-label="Remove filter"
            disabled={disabled}
            onClick={onRemove}
            className="focus-ring hover:bg-surface-muted inline-flex shrink-0 items-center justify-center rounded-full p-1 text-inherit"
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        className={cn(chipVariants({ size, selected, disabled }), 'focus-ring', className)}
        {...props}
      >
        {leftIcon && iconSpan(leftIcon)}
        {children}
        {rightIcon && iconSpan(rightIcon)}
      </button>
    );
  },
);
Chip.displayName = 'Chip';

export { chipVariants };
