'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Select — platform dropdown (T1.6), hand-assembled on @radix-ui/react-select
 * (registry unavailable; canonical shadcn structure, 100% token re-skin).
 *
 * Purpose: every dropdown in the platform — tenure pickers (search bar,
 * calculator), future filters and settings. Completely domain-agnostic.
 *
 * Sizes: `md` 44px / `lg` 48px (--ds-input-md/lg — mirrors Input exactly).
 * One visual variant; states: default, hover, focus (token ring), open
 * (strong border), selected item (brand text + check), disabled, loading
 * (spinner replaces chevron + aria-busy), invalid (error border +
 * aria-invalid).
 *
 * Accessibility: all behavior is unmodified Radix — combobox/listbox ARIA,
 * ArrowUp/Down, Enter, Escape, Home/End, typeahead, focus restoration,
 * announcements. Icons are decorative (aria-hidden). Consumers wire id +
 * <label htmlFor> and aria-describedby as with Input.
 */
const selectTriggerVariants = cva(
  'focus-ring border-border-default bg-surface-card text-content data-[placeholder]:text-content-placeholder data-[state=open]:border-border-strong flex w-full items-center justify-between gap-2 rounded-md border transition duration-fast ease-out disabled:pointer-events-none disabled:bg-surface-muted disabled:text-content-placeholder disabled:opacity-70',
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

/* ------------------------------------------------------------------ */
/* Low-level styled parts (exported for future composed use cases)     */
/* ------------------------------------------------------------------ */

export const SelectRoot = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps
  extends
    ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  loading?: boolean;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, size, invalid, loading = false, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-busy={loading || undefined}
      className={cn(selectTriggerVariants({ size, invalid }), className)}
      {...props}
    >
      {children}
      {loading ? (
        <Loader2 aria-hidden="true" className="text-content-muted size-4 shrink-0 animate-spin" />
      ) : (
        <SelectPrimitive.Icon asChild>
          <ChevronDown aria-hidden="true" className="text-content-muted size-4 shrink-0" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  ),
);
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', sideOffset = 4, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={cn(
        // z-layer + overlay elevation from tokens; max height from Radix's
        // runtime measurement variable (not a design value).
        'border-border-default bg-surface-card shadow-elevation-overlay relative z-(--ds-z-dropdown) max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'text-body text-content data-[highlighted]:bg-surface-muted data-[state=checked]:text-content-brand data-[disabled]:text-content-placeholder relative flex cursor-default items-center justify-between gap-2 rounded-sm px-3 py-2 outline-none select-none data-[disabled]:pointer-events-none',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator>
      <Check aria-hidden="true" className="size-4" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/* ------------------------------------------------------------------ */
/* Simple options-based API (the documented platform surface)          */
/* ------------------------------------------------------------------ */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  loading?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Form integration (React Hook Form / native forms). */
  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Applied to the trigger (layout placement). */
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      placeholder,
      size,
      invalid = false,
      disabled = false,
      loading = false,
      value,
      defaultValue,
      onValueChange,
      name,
      className,
      ...triggerAria
    },
    ref,
  ) => (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled || loading}
    >
      <SelectTrigger
        ref={ref}
        size={size}
        invalid={invalid}
        loading={loading}
        className={className}
        {...triggerAria}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  ),
);
Select.displayName = 'Select';
