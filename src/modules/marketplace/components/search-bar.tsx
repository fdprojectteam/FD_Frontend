'use client';

import { Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

import { TENURE_OPTIONS } from '../constants/filters';
import type { MarketplaceSearchValues } from '../types/filters';

/**
 * SearchBar — the approved Home search panel (M2.3, made presentation-only
 * in the M2.4 audit).
 *
 * Presentation-only (invariants I2a and I3): the committed values arrive as
 * props and the submit is reported upward. It imports no URL-state hook, no
 * service, and no router — HomeScreen owns every Marketplace URL mutation.
 *
 * The one piece of state it does own is the in-progress input text, which is
 * transient UI state and deliberately not URL state (invariant I6): a
 * half-typed query is not something a colleague opening the link should see.
 * The approved UI commits on an explicit Search button; debounced live
 * filtering arrives in M2.5.
 */
export interface SearchBarProps {
  /** The committed search state, owned by the URL. */
  values: MarketplaceSearchValues;
  onSubmit: (values: MarketplaceSearchValues) => void;
}

export function SearchBar({ values, onSubmit }: SearchBarProps) {
  const [draft, setDraft] = useState(values);
  const { q, amount, tenure } = values;

  // Keep inputs in step with the committed values (deep links, back/forward).
  // Depends on the primitives rather than the containing object: a
  // state-setting effect must never key on an object identity it does not
  // control, or it cannot converge (M2.4 audit, defect C1).
  useEffect(() => {
    setDraft({ q, amount, tenure });
  }, [q, amount, tenure]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(draft);
  };

  return (
    <form
      role="search"
      aria-label="Search fixed deposits"
      onSubmit={handleSubmit}
      className="border-border-default bg-surface-card rounded-card shadow-elevation-1 grid gap-4 border p-6 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="home-search-query" className="text-caption text-content-muted font-medium">
          Search bank or product
        </label>
        <Input
          id="home-search-query"
          type="search"
          placeholder="e.g. HDFC, 12 months…"
          prefix={<Search className="size-4" />}
          value={draft.q}
          onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="home-search-amount" className="text-caption text-content-muted font-medium">
          Amount
        </label>
        <Input
          id="home-search-amount"
          inputMode="numeric"
          prefix="₹"
          placeholder="1,00,000"
          value={draft.amount}
          onChange={(event) =>
            setDraft((current) => ({ ...current, amount: event.target.value.replace(/\D/g, '') }))
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="home-search-tenure" className="text-caption text-content-muted font-medium">
          Tenure
        </label>
        <Select
          /*
            Remounted when tenure goes from set to unset. Radix treats a
            `value` of undefined as "uncontrolled" and keeps whatever was
            last chosen, so clearing the filter from the chip row left this
            trigger still reading "24 months" while the URL, the chips, and
            the listing all said otherwise (M2.5 verification, F1).
            Changing between two real tenures keeps the same key and stays
            controlled.
          */
          key={draft.tenure ? 'tenure-set' : 'tenure-empty'}
          id="home-search-tenure"
          placeholder="Any tenure"
          value={draft.tenure || undefined}
          onValueChange={(tenure) => setDraft((current) => ({ ...current, tenure }))}
          options={TENURE_OPTIONS.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
        />
      </div>

      <Button type="submit" size="lg">
        Search
      </Button>
    </form>
  );
}
