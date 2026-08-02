import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Input — platform text input (T1.2), following the Button (T1.1) lifecycle.
 *
 * Purpose: the single text control for the platform — search bar, deposit
 * amount, calculator fields, and all future forms (booking, auth, support).
 *
 * Sizes: `md` 44px (default — meets the 44px touch target, --ds-input-md),
 * `lg` 48px (hero search / calculator, --ds-input-lg). No other sizes exist
 * in the approved inventory (§10).
 *
 * Slots: `prefix` / `suffix` render inside the field (₹, %, search icons).
 * They are decorative and hidden from screen readers — meaning must come
 * from the label (Document 14 §11).
 *
 * States: default, focus (ring via focus-within on the wrapper), invalid
 * (aria-invalid + error border), disabled, read-only, loading (aria-busy,
 * spinner replaces suffix).
 *
 * Accessibility: forwardRef targets the native <input> (React Hook Form
 * ready). Consumers wire `id` + <label htmlFor>, and `aria-describedby`
 * for descriptions/errors — demonstrated in the gallery. Error styling is
 * never color-alone: pair with an error message (Document 14 §7).
 */
const inputWrapperVariants = cva(
  // Wrapper owns the visual field: surface, border, radius, focus ring
  // (focus-within so the ring wraps prefix/suffix), motion, and state styling.
  'border-border-default bg-surface-card flex items-center gap-2 rounded-md border transition duration-fast ease-out focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--ds-focus-ring-color) has-disabled:pointer-events-none has-disabled:bg-surface-muted has-disabled:opacity-70 has-read-only:bg-surface-muted',
  {
    variants: {
      size: {
        md: 'h-11 px-4 text-body', // 44px — --ds-input-md
        lg: 'h-12 px-4 text-body-lg', // 48px — --ds-input-lg
      },
      invalid: {
        true: 'border-error',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);

export interface InputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>,
    VariantProps<typeof inputWrapperVariants> {
  /** Marks the field invalid: error border + aria-invalid. Pair with a visible error message. */
  invalid?: boolean;
  /** Async state: spinner in the suffix slot + aria-busy. */
  loading?: boolean;
  /** Decorative leading slot (e.g. ₹, search icon). Hidden from screen readers. */
  prefix?: ReactNode;
  /** Decorative trailing slot (e.g. %, unit). Hidden from screen readers. */
  suffix?: ReactNode;
  /** Applied to the field wrapper (layout placement). */
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid = false, loading = false, prefix, suffix, ...props }, ref) => {
    return (
      <div className={cn(inputWrapperVariants({ size, invalid }), className)}>
        {prefix && (
          <span aria-hidden="true" className="text-content-muted inline-flex shrink-0 select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          aria-busy={loading || undefined}
          className="text-content placeholder:text-content-placeholder read-only:text-content-muted h-full w-full min-w-0 bg-transparent focus:outline-none disabled:cursor-not-allowed"
          {...props}
        />
        {loading ? (
          <Loader2 aria-hidden="true" className="text-content-muted size-4 shrink-0 animate-spin" />
        ) : (
          suffix && (
            <span
              aria-hidden="true"
              className="text-content-muted inline-flex shrink-0 select-none"
            >
              {suffix}
            </span>
          )
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { inputWrapperVariants };
