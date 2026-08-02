'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { Chip } from '@/components/ui/chip';

/**
 * Dev-only interactive Chip demo for the gallery: live selection toggling
 * (aria-pressed flips), and removable active-filter tags. Not a platform
 * component — exists solely for visual/keyboard review.
 */
const FILTERS = ['Bank', 'Tenure', 'Interest Rate', 'Deposit Amount'] as const;

export function ChipDemo() {
  const [selected, setSelected] = useState<string[]>(['Tenure']);
  const [active, setActive] = useState<string[]>(['HDFC Bank', '12 months']);

  const toggle = (name: string) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((f) => f !== name) : [...current, name],
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          Filter chips — click or use Tab + Enter/Space (aria-pressed updates live)
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {FILTERS.map((name) => (
            <Chip key={name} selected={selected.includes(name)} onClick={() => toggle(name)}>
              {name}
            </Chip>
          ))}
          <Chip leftIcon={<SlidersHorizontal className="size-3" />}>More Filters</Chip>
          <Chip disabled>Unavailable</Chip>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          Removable active filters — X removes the tag
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {active.length > 0 ? (
            active.map((name) => (
              <Chip
                key={name}
                selected
                removable
                onRemove={() => setActive((current) => current.filter((f) => f !== name))}
              >
                {name}
              </Chip>
            ))
          ) : (
            <span className="text-caption text-content-muted">No active filters.</span>
          )}
        </div>
      </div>
    </div>
  );
}
