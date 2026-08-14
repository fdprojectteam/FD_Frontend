'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

import { RadioCardGroup } from '@/components/ui/radio-card-group';
import { Slider } from '@/components/ui/slider';

/**
 * Dev-only interactive demo for the two T3.2.3 primitives: live value binding,
 * keyboard operation, and the disabled and single-value edge cases. Not
 * platform components — this exists solely for visual and keyboard review.
 */
const PAYOUT_OPTIONS = [
  {
    id: 'at-maturity',
    title: 'At Maturity',
    description: 'Get full interest along with principal at maturity.',
    icon: <CalendarDays className="size-4" />,
  },
  {
    id: 'monthly',
    title: 'Monthly',
    description: 'Receive interest every month.',
    icon: <CalendarDays className="size-4" />,
  },
  {
    id: 'quarterly',
    title: 'Quarterly',
    description: 'Receive interest every quarter.',
    icon: <CalendarDays className="size-4" />,
  },
] as const;

export function SliderDemo() {
  const [months, setMonths] = useState(24);
  const [amount, setAmount] = useState(500_000);
  const [payout, setPayout] = useState<string | null>('at-maturity');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          Slider — drag, or Tab then use arrows / Home / End. `aria-valuetext` announces the unit.
        </span>
        <Slider
          label="Tenure"
          value={months}
          min={1}
          max={120}
          step={1}
          valueText={`${months} ${months === 1 ? 'month' : 'months'}`}
          caption={`${months} Months`}
          onChange={(event) => setMonths(Number(event.target.value))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          Coarse step, currency value text
        </span>
        <Slider
          label="Deposit amount"
          value={amount}
          min={100_000}
          max={2_000_000}
          step={50_000}
          valueText={`${amount.toLocaleString('en-IN')} rupees`}
          caption={`₹${amount.toLocaleString('en-IN')}`}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="text-caption text-content-muted font-medium">Disabled</span>
          <Slider label="Locked tenure" value={36} min={1} max={120} disabled readOnly />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-caption text-content-muted font-medium">
            Single-value domain (min === max) — must not divide by zero
          </span>
          <Slider label="Only tenure offered" value={12} min={12} max={12} readOnly />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          RadioCardGroup — one Tab stop, arrows move within the group
        </span>
        <RadioCardGroup
          label="Interest Payout Options"
          options={PAYOUT_OPTIONS}
          value={payout}
          onChange={setPayout}
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption text-content-muted font-medium">
          With a disabled option and no icons
        </span>
        <RadioCardGroup
          label="Renewal preference"
          options={[
            { id: 'auto', title: 'Auto renew', description: 'Renew at the prevailing rate.' },
            { id: 'payout', title: 'Pay out', description: 'Credit to my bank account.' },
            {
              id: 'ladder',
              title: 'Add to ladder',
              description: 'Unavailable for this product.',
              disabled: true,
            },
          ]}
          value="auto"
          onChange={() => undefined}
        />
      </div>
    </div>
  );
}
