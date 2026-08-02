'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';

import type { ActiveFilterDescriptor, MarketplaceFilterKey } from '../utils/filter-labels';

/**
 * ActiveFilters — removable pills for everything currently applied, plus
 * "Clear all" (M2.5, T2.5.4).
 *
 * Presentation-only (invariants I3 and A3): the descriptors are computed
 * upstream and both callbacks are reported upward.
 *
 * Renders nothing when no filter is applied — an always-present empty row
 * would shift the listing down the first time a user filtered, and the
 * approved screen shows no such row in its default state.
 *
 * Accessible name. Each pill is named for what activating it *does*
 * ("Remove filter: Bank: HDFC Bank"), per the approved plan, and the name
 * contains the visible text verbatim so voice control still works
 * (WCAG 2.5.3). The Chip primitive's built-in `removable` mode is not used:
 * its remove button carries a fixed "Remove filter" label, which is ambiguous
 * once several pills are on screen, and the primitive is frozen.
 *
 * Known tension, recorded rather than hidden: Chip always emits
 * `aria-pressed`, so these action pills announce a pressed state as well as a
 * name. An `action` variant on Chip would resolve it, and that is a
 * component-library change, not a Marketplace one.
 */
export interface ActiveFiltersProps {
  filters: ActiveFilterDescriptor[];
  onRemove: (key: MarketplaceFilterKey) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div role="group" aria-label="Active filters" className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Chip
          key={filter.key}
          selected
          aria-label={`Remove filter: ${filter.facet}: ${filter.value}`}
          rightIcon={<X className="size-3" />}
          onClick={() => onRemove(filter.key)}
        >
          {`${filter.facet}: ${filter.value}`}
        </Chip>
      ))}

      <Button variant="secondary" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
