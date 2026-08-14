'use client';

import { Users } from 'lucide-react';

import { RadioCardGroup } from '@/components/ui/radio-card-group';

import { NOMINATION_TYPES } from '../constants/nominee';
import type { NominationTypeId } from '../types/nominee';

/**
 * NominationTypeGroup — single or multiple nominees (T3.3.4).
 *
 * **Presentation-only**, and built on the platform primitive rather than a
 * second radio group: `RadioCardGroup` (T3.2.3) already gives a real
 * `<fieldset>` with real radios, so the group is one tab stop with arrow-key
 * movement and needs no `aria-*` attribute anywhere. The same component the
 * payout options use, which is why the two sections behave identically.
 *
 * The two options come from `NOMINATION_TYPES`, transcribed from the approved
 * artwork. No third type is invented — the artwork draws two.
 *
 * The icon is the same on both cards, as the artwork shows: what differs is
 * *how many*, not *what kind*, and giving each its own glyph would invent a
 * visual taxonomy the design does not have.
 */
export interface NominationTypeGroupProps {
  value: NominationTypeId;
  onChange: (value: NominationTypeId) => void;
}

export function NominationTypeGroup({ value, onChange }: NominationTypeGroupProps) {
  return (
    <RadioCardGroup<NominationTypeId>
      label="Nomination Type"
      labelHidden
      value={value}
      onChange={onChange}
      options={NOMINATION_TYPES.map((type) => ({
        id: type.id,
        title: type.title,
        description: type.description,
        icon: <Users className="size-4" />,
      }))}
    />
  );
}
