'use client';

import { FileUp, Landmark, PenLine } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useBanks } from '@/hooks/use-banks';
import {
  CONNECTED_HOLDING_PROVIDER,
  IMPORTED_HOLDING_PROVIDER,
  type ExternalFDInput,
} from '@/services/portfolio';

import { ExternalHoldingReview } from './external-holding-review';

const EMPTY_BANKS = [] as const;

function opaqueId(prefix: string): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${String(Date.now())}`;
}

export function AddExistingFdScreen() {
  const [demoInput, setDemoInput] = useState<ExternalFDInput | null>(null);
  const banksQuery = useBanks();
  const banks = banksQuery.data ?? EMPTY_BANKS;

  const fallbackBank = banks[0];

  if (demoInput) {
    return (
      <ExternalHoldingReview
        input={demoInput}
        backHref={ROUTES.portfolioAddFd}
        onBack={() => setDemoInput(null)}
      />
    );
  }

  const connectedBank = banks.find((bank) => bank.id === 'dbs') ?? fallbackBank;
  const importedBank = banks.find((bank) => bank.id === 'icici') ?? fallbackBank;

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-h1 text-content">Bring your existing FDs</h1>
        <p className="text-body-lg text-content-muted">
          Already have fixed deposits with other banks? Add them here and manage everything in one
          place.
        </p>
      </header>
      <section aria-labelledby="add-fd-method-title" className="flex max-w-2xl flex-col gap-4">
        <h2 id="add-fd-method-title" className="text-h2 text-content">
          How would you like to add your FD?
        </h2>
        <Card
          variant="outlined"
          className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6"
        >
          <div className="flex gap-4">
            <Landmark aria-hidden="true" className="text-content-brand mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-body-lg text-content font-semibold">Connect accounts</p>
              <p className="text-body text-content-muted">Find eligible deposits automatically.</p>
              <p className="text-caption text-content-muted mt-1">
                Simulated demo — no bank or Account Aggregator connection is made.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              connectedBank &&
              setDemoInput(
                CONNECTED_HOLDING_PROVIDER.createDemoInput(connectedBank, opaqueId('connected')),
              )
            }
            disabled={!connectedBank}
          >
            Try simulated connection
          </Button>
        </Card>
        <Card
          variant="outlined"
          className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6"
        >
          <div className="flex gap-4">
            <FileUp aria-hidden="true" className="text-content-brand mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-body-lg text-content font-semibold">Upload FD document</p>
              <p className="text-body text-content-muted">
                Add details from your FD advice or statement.
              </p>
              <p className="text-caption text-content-muted mt-1">
                Simulated demo — no file is uploaded, stored, or read with OCR.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              importedBank &&
              setDemoInput(
                IMPORTED_HOLDING_PROVIDER.createDemoInput(importedBank, opaqueId('imported')),
              )
            }
            disabled={!importedBank}
          >
            Try simulated upload
          </Button>
        </Card>
        <Card
          variant="outlined"
          className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6"
        >
          <div className="flex gap-4">
            <PenLine aria-hidden="true" className="text-content-brand mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-body-lg text-content font-semibold">Add manually</p>
              <p className="text-body text-content-muted">Enter the FD details yourself.</p>
              <p className="text-caption text-content-muted mt-1">
                Your entered details are used to organize this portfolio record.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={ROUTES.portfolioAddFdManual}>Add manually</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
