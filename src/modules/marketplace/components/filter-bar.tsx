'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';

import { Chip } from '@/components/ui/chip';
import type { Bank } from '@/types/finance';

import { AMOUNT_PRESETS, RATE_BANDS, TENURE_OPTIONS } from '../constants/filters';
import type { MarketplaceFilterValues } from '../types/filters';
import { facetLabel, facetValueLabel, type MarketplaceFilterKey } from '../utils/filter-labels';

/**
 * FilterBar — the approved chip row: Bank · Tenure · Interest Rate · Amount
 * (M2.5, T2.5.3).
 *
 * Presentation-only (invariants I3 and A3): values arrive as props, changes
 * are reported upward. It imports no query hook, no service, and no router —
 * `HomeScreen` owns every Marketplace URL write.
 *
 * Interaction. The approved screen shows four collapsed facet chips and no
 * open state, so each chip is a disclosure that reveals that facet's options
 * as a row of selectable chips beneath it. This keeps the collapsed row
 * pixel-faithful to the approved design and introduces **no new primitive** —
 * a popover or menu would have been both. One facet is open at a time.
 *
 * The facet chip carries `aria-expanded` (is the option list open) *and*
 * `aria-pressed` (is this filter applied). Both are true statements about the
 * same control and both are needed: without `aria-pressed` a screen-reader
 * user cannot tell an applied filter from an unapplied one while the panel is
 * closed.
 *
 * Open/closed state is local by design — it is transient UI, not something a
 * colleague opening the link should replay (invariant I6).
 */
export interface FilterBarProps {
  values: MarketplaceFilterValues;
  /** Supplied by HomeScreen from the existing banks query — never fetched here (I5). */
  banks: Bank[];
  onChange: (patch: Partial<MarketplaceFilterValues>) => void;
  /** True while the banks query is still resolving. */
  isLoadingBanks?: boolean;
}

type FacetKey = Extract<MarketplaceFilterKey, 'bank' | 'tenure' | 'minRate' | 'amount'>;

/** Approved chip order. */
const FACETS: readonly FacetKey[] = ['bank', 'tenure', 'minRate', 'amount'];

interface FacetOption {
  value: string;
  label: string;
}

function optionsFor(facet: FacetKey, banks: Bank[]): FacetOption[] {
  switch (facet) {
    case 'bank':
      return banks.map((bank) => ({ value: bank.id, label: bank.name }));
    case 'tenure':
      return TENURE_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }));
    case 'minRate':
      return RATE_BANDS.map((band) => ({ value: String(band.value), label: band.label }));
    case 'amount':
      return AMOUNT_PRESETS.map((preset) => ({
        value: String(preset.value),
        label: preset.label,
      }));
  }
}

export function FilterBar({ values, banks, onChange, isLoadingBanks = false }: FilterBarProps) {
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null);
  const panelBaseId = useId();

  const panelId = (facet: FacetKey) => `${panelBaseId}-${facet}`;

  const select = (facet: FacetKey, value: string) => {
    // Selecting the applied value again clears it, so every filter is
    // reversible from the control that set it.
    const patch: Partial<MarketplaceFilterValues> = {};
    patch[facet] = values[facet] === value ? '' : value;
    onChange(patch);
    setOpenFacet(null);
  };

  return (
    <div
      role="group"
      aria-label="Filter fixed deposits"
      className="flex flex-col gap-3"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && openFacet) {
          event.stopPropagation();
          setOpenFacet(null);
        }
      }}
    >
      {/* Below sm the row scrolls horizontally — the pattern already used by
          FeaturedBanks on the approved mobile screen. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FACETS.map((facet) => {
          const applied = values[facet] !== '';
          const disabled = facet === 'bank' && (isLoadingBanks || banks.length === 0);
          const shown = applied
            ? `${facetLabel(facet)}: ${facetValueLabel(facet, values[facet], banks)}`
            : facetLabel(facet);

          return (
            <Chip
              key={facet}
              selected={applied}
              disabled={disabled}
              aria-expanded={openFacet === facet}
              aria-controls={panelId(facet)}
              rightIcon={<ChevronDown className="size-3" />}
              onClick={() => setOpenFacet((current) => (current === facet ? null : facet))}
            >
              {shown}
            </Chip>
          );
        })}
      </div>

      {FACETS.map((facet) => {
        if (openFacet !== facet) return null;
        const options = optionsFor(facet, banks);

        return (
          <div
            key={facet}
            id={panelId(facet)}
            role="group"
            aria-label={`${facetLabel(facet)} options`}
            className="border-border-default bg-surface-card rounded-card flex flex-wrap gap-2 border p-4"
          >
            <Chip selected={values[facet] === ''} onClick={() => select(facet, '')}>
              {`Any ${facetLabel(facet).toLowerCase()}`}
            </Chip>
            {options.map((option) => (
              <Chip
                key={option.value}
                selected={values[facet] === option.value}
                onClick={() => select(facet, option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        );
      })}
    </div>
  );
}
