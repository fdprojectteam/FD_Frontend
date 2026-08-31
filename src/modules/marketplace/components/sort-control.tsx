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
 *
 * ## Why the width is not `w-48` any more
 *
 * ⚠ This was the Home page's 320px horizontal overflow. The select was a flat
 * `w-48` — **192px that cannot shrink** — and the row it sits in
 * (`SectionHeading`) is a `flex … justify-between` with no wrapping. So the
 * row's minimum width was the "Fixed Deposits" heading plus its gap plus a
 * fixed 192px, which comes to roughly 340px against the 288px a 320px viewport
 * leaves after the container gutters. The row could not fit, and a flex row
 * that cannot fit pushes the document wider — the horizontal scrollbar the
 * review found.
 *
 * The control now takes the full width it is given below `md` and returns to
 * the approved fixed width from there, where the heading row genuinely has room
 * for both. `min-w-0` lets it shrink rather than overflow at every width in
 * between. Nothing is hidden and the approved desktop appearance is unchanged.
 */
const LABEL_ID = 'product-sort-label';

export interface SortControlProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
      <span id={LABEL_ID} className="text-caption text-content-muted shrink-0 font-medium">
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
        className="w-full min-w-0 md:w-48"
      />
    </div>
  );
}
