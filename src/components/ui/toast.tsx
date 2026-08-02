'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Toast — platform transient feedback primitive (T1.9), hand-assembled on
 * @radix-ui/react-toast (registry unavailable; canonical shadcn structure,
 * 100% token re-skin).
 *
 * Purpose: success confirmations, error notifications, and informational
 * messages platform-wide. Domain-agnostic; standard Radix composition.
 * No application-wide toast manager exists yet — consumers render
 * ToastProvider/Viewport where needed (a platform provider arrives in its
 * own approved task).
 *
 * Variants: `success`, `error`, `info` — identical panel styling with a
 * semantic left accent from existing tokens. Motion: the generic fade
 * utilities (T1.8); no slide, no new keyframes. Reduced motion is handled
 * by the global rule.
 *
 * Accessibility: unmodified Radix — polite live-region announcement,
 * auto-dismiss with pause on hover and focus, keyboard dismissal, F8 to
 * jump into the viewport, swipe-to-dismiss. Icons are decorative
 * (aria-hidden); the close button carries a real accessible name.
 */
const toastVariants = cva(
  'border-border-default bg-surface-card rounded-card shadow-elevation-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in data-[swipe=end]:animate-fade-out flex w-full items-start gap-3 border border-l-4 p-4',
  {
    variants: {
      variant: {
        success: 'border-l-success',
        error: 'border-l-error',
        info: 'border-l-primary',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
);

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = forwardRef<
  HTMLOListElement,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      // Stacking + inset from the spacing scale; top layer token (§13).
      'overlay-viewport-width fixed right-0 bottom-0 z-(--ds-z-toast) flex w-full max-w-sm list-none flex-col gap-3 p-4',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

export interface ToastProps
  extends
    ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

export const Toast = forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  ),
);
Toast.displayName = 'Toast';

export const ToastTitle = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-body text-content font-medium', className)}
    {...props}
  />
));
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-caption text-content-muted', className)}
    {...props}
  />
));
ToastDescription.displayName = 'ToastDescription';

/**
 * Action slot — composes the platform Button via asChild:
 * <ToastAction altText="…"><Button variant="secondary" size="sm">…</Button></ToastAction>
 */
export const ToastAction = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action ref={ref} className={cn('shrink-0', className)} {...props} />
));
ToastAction.displayName = 'ToastAction';

export const ToastClose = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'focus-ring text-content-muted hover:bg-surface-muted duration-fast shrink-0 rounded-md p-1 transition ease-out',
      className,
    )}
    {...props}
  >
    <X aria-hidden="true" className="size-4" />
    <span className="sr-only">Close</span>
  </ToastPrimitive.Close>
));
ToastClose.displayName = 'ToastClose';

export { toastVariants };
