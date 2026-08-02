'use client';

import { Select } from '@/components/ui/select';

import { SORT_OPTIONS } from '../constants/filters';
import type { SortOption } from '../types/filters';

/**
 * SortControl — the approved "Sort: Highest rate" control (M2.4).
 *
 * Presentation-only: it reports the chosen option and never touches the
 * router (invariant I2a — HomeScreen owns URL mutations).
 *
 * The Select trigger is a <button>, which is not a labelable element, so
 * the visible "Sort" text is associated with aria-labelledby rather than
 * <label htmlFor> — the latter would not produce an accessible name.
 */
const LABEL_ID = 'product-sort-label';

export interface SortControlProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-3">
      <span id={LABEL_ID} className="text-caption text-content-muted font-medium">
        Sort
      </span>
      <Select
        aria-labelledby={LABEL_ID}
        value={value.id}
        onValueChange={(id) => {
          const option = SORT_OPTIONS.find((item) => item.id === id);
          if (option) onChange(option);
        }}
        options={SORT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
        className="w-48"
      />
    </div>
  );
}
