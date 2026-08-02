'use client';

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

/**
 * Dev-only Toast demo for the gallery. The queue state lives here, not in
 * the platform layer — no application-wide toast manager exists yet (T1.9
 * scope). Domain-neutral content.
 */
type Variant = 'success' | 'error' | 'info';

interface DemoToast {
  id: number;
  variant: Variant;
  title: string;
  description: string;
  withAction?: boolean;
}

const ICONS: Record<Variant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ICON_COLOR: Record<Variant, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-content-brand',
};

const PRESETS: Record<Variant, { title: string; description: string }> = {
  success: { title: 'Saved successfully', description: 'Your changes have been applied.' },
  error: { title: 'Something went wrong', description: 'Please try again in a moment.' },
  info: { title: 'Heads up', description: 'Rates are refreshed every few minutes.' },
};

export function ToastDemo() {
  const [toasts, setToasts] = useState<DemoToast[]>([]);
  const [nextId, setNextId] = useState(1);

  const push = (variant: Variant, withAction = false) => {
    setToasts((current) => [...current, { id: nextId, variant, ...PRESETS[variant], withAction }]);
    setNextId((id) => id + 1);
  };

  const pushQueue = () => {
    const variants: Variant[] = ['success', 'info', 'error'];
    setToasts((current) => [
      ...current,
      ...variants.map((variant, index) => ({
        id: nextId + index,
        variant,
        ...PRESETS[variant],
      })),
    ]);
    setNextId((id) => id + variants.length);
  };

  const remove = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  return (
    <ToastProvider>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onClick={() => push('success')}>
          Success toast
        </Button>
        <Button variant="secondary" onClick={() => push('error')}>
          Error toast
        </Button>
        <Button variant="secondary" onClick={() => push('info')}>
          Info toast
        </Button>
        <Button variant="secondary" onClick={() => push('info', true)}>
          With action
        </Button>
        <Button variant="outline" onClick={pushQueue}>
          Queue three toasts
        </Button>
      </div>

      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onOpenChange={(open) => {
              if (!open) remove(toast.id);
            }}
          >
            <Icon aria-hidden="true" className={`size-4 shrink-0 ${ICON_COLOR[toast.variant]}`} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
            {toast.withAction && (
              <ToastAction altText="Undo the last change" asChild>
                <Button variant="secondary" size="sm">
                  Undo
                </Button>
              </ToastAction>
            )}
            <ToastClose />
          </Toast>
        );
      })}

      <ToastViewport />
    </ToastProvider>
  );
}
