'use client';

import { CircleCheck, CircleDot, CircleDashed, CircleHelp } from 'lucide-react';

import type { SupportStatus } from '@/types/support';

import { STATUS_PRESENTATION } from '../utils/request-context';

/**
 * Where a request has got to, said in words and shown with a shape.
 *
 * ## Never colour alone
 *
 * Each status carries an icon whose *shape* differs, and the label is always
 * rendered. A customer who cannot distinguish the green from the amber still
 * reads "Resolved" and sees a different mark — which is the accessibility
 * requirement and also just clearer.
 */
const STATUS_META: Record<SupportStatus, { icon: typeof CircleDot; tone: string }> = {
  open: { icon: CircleDashed, tone: 'text-content-muted' },
  'in-progress': { icon: CircleDot, tone: 'text-content-brand' },
  'waiting-for-customer': { icon: CircleHelp, tone: 'text-warning' },
  resolved: { icon: CircleCheck, tone: 'text-success' },
  closed: { icon: CircleCheck, tone: 'text-content-muted' },
};

export interface RequestStatusBadgeProps {
  status: SupportStatus;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span className={`text-caption inline-flex items-center gap-1.5 ${meta.tone}`}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {STATUS_PRESENTATION[status].label}
    </span>
  );
}
