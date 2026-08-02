'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Dialog — platform modal foundation (T1.8), hand-assembled on
 * @radix-ui/react-dialog (registry unavailable; canonical shadcn
 * structure, 100% token re-skin).
 *
 * Purpose: every modal surface — future "Add another FD" (compare),
 * confirmations, auth flows, settings. Completely domain-agnostic;
 * standard Radix composition, no simplified API.
 *
 * Layers: overlay on --ds-z-overlay (inventory §16 scrim: gray-900 at
 * --ds-opacity-scrim), panel on --ds-z-modal. Both fade independently via
 * the generic ds-fade utilities on motion tokens; reduced-motion users get
 * an immediate state change through the global rule.
 *
 * Accessibility: unmodified Radix — focus trap + restoration, Escape and
 * overlay-click close, role="dialog" + aria-modal, aria-labelledby /
 * aria-describedby wired to DialogTitle / DialogDescription (always
 * include both; use sr-only if visually undesired), body scroll lock.
 * The built-in close button has a real accessible name.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // overlay-scrim resolves gray-900 at --ds-opacity-scrim (inventory §16)
      'overlay-scrim data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in fixed inset-0 z-(--ds-z-overlay)',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'border-border-default bg-surface-card rounded-card shadow-elevation-overlay overlay-viewport-height overlay-viewport-width data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in fixed top-1/2 left-1/2 z-(--ds-z-modal) flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border p-6',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="focus-ring text-content-muted hover:bg-surface-muted duration-fast absolute top-4 right-4 rounded-md p-1 transition ease-out">
        <X aria-hidden="true" className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

/** Layout-only header region. */
export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  // pr-8 reserves room for the absolutely-positioned close button.
  return <div className={cn('flex flex-col gap-1 pr-8 text-left', className)} {...props} />;
}

/** Layout-only action region: stacked on mobile, horizontal from 768px. */
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-3 md:flex-row md:justify-end', className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-h3 text-content', className)} {...props} />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-body text-content-muted', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
