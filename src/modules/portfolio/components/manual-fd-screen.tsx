'use client';

import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useBanks } from '@/hooks/use-banks';
import type { ExternalFDInput } from '@/services/portfolio';
import type { MaturityInstruction } from '@/types/portfolio';
import { maturityDate } from '@/utils/finance';

import { ExternalHoldingReview } from './external-holding-review';

type TermMode = 'maturity-date' | 'tenure';

const POPULAR_BANK_IDS = ['sbi', 'hdfc', 'icici', 'axis', 'dbs'];
const EMPTY_BANKS = [] as const;

const PAYOUT_OPTIONS = [
  { value: 'at-maturity', label: 'At maturity (cumulative)' },
  { value: 'monthly', label: 'Paid monthly' },
  { value: 'quarterly', label: 'Paid quarterly' },
];

const INSTRUCTION_OPTIONS = [
  { value: 'unknown', label: 'Not provided' },
  { value: 'renew-principal-and-interest', label: 'Renew principal and interest' },
  { value: 'renew-principal-only', label: 'Renew principal, pay out interest' },
  { value: 'pay-out', label: 'Pay out principal and interest' },
];

function localDateAtMidnight(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1] ?? '');
  const month = Number(match[2] ?? '');
  const day = Number(match[3] ?? '');
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date.getTime()
    : null;
}

/** Accept a maturity date only where the platform's established month model reproduces it exactly. */
function exactTenureFromDates(startedAt: number, maturesAt: number): number | null {
  const start = new Date(startedAt);
  const end = new Date(maturesAt);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months <= 0 || maturityDate(startedAt, months)?.getTime() !== maturesAt) return null;
  return months;
}

function opaqueId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : String(Date.now());
}

export function ManualFdScreen() {
  const banksQuery = useBanks();
  const banks = banksQuery.data ?? EMPTY_BANKS;
  const [bankId, setBankId] = useState('hdfc');
  const [bankSearch, setBankSearch] = useState('');
  const [productName, setProductName] = useState('Fixed Deposit');
  const [principal, setPrincipal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [termMode, setTermMode] = useState<TermMode>('maturity-date');
  const [maturity, setMaturity] = useState('');
  const [tenure, setTenure] = useState('');
  const [rate, setRate] = useState('');
  const [payout, setPayout] = useState('at-maturity');
  const [instruction, setInstruction] = useState('unknown');
  const [externalReference, setExternalReference] = useState('');
  const [submitted, setSubmitted] = useState<ExternalFDInput | null>(null);

  const selectedBank = banks.find((bank) => bank.id === bankId) ?? banks[0];
  const visibleBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();
    const matches =
      query === '' ? banks : banks.filter((bank) => bank.name.toLowerCase().includes(query));
    return [...matches].sort((a, b) => {
      const aPopular = POPULAR_BANK_IDS.indexOf(a.id);
      const bPopular = POPULAR_BANK_IDS.indexOf(b.id);
      return (
        (aPopular < 0 ? Number.MAX_SAFE_INTEGER : aPopular) -
        (bPopular < 0 ? Number.MAX_SAFE_INTEGER : bPopular)
      );
    });
  }, [bankSearch, banks]);
  if (!selectedBank) {
    return (
      <div className="container-detail py-8 md:py-12">
        <h1 className="text-h1 text-content">Add an existing FD</h1>
        <p className="text-body text-content-muted mt-2">
          {banksQuery.isError
            ? 'The bank catalogue is unavailable. Please try again.'
            : 'Loading supported banks…'}
        </p>
      </div>
    );
  }
  const startedAt = localDateAtMidnight(startDate);
  const maturesAt = localDateAtMidnight(maturity);
  const tenureMonths =
    termMode === 'tenure'
      ? Number(tenure)
      : startedAt === null || maturesAt === null
        ? null
        : exactTenureFromDates(startedAt, maturesAt);
  const amount = Number(principal);
  const annualRate = Number(rate);
  const dateMismatch = termMode === 'maturity-date' && maturity !== '' && tenureMonths === null;
  const valid =
    selectedBank !== undefined &&
    productName.trim() !== '' &&
    Number.isInteger(amount) &&
    amount > 0 &&
    startedAt !== null &&
    tenureMonths !== null &&
    Number.isInteger(tenureMonths) &&
    tenureMonths > 0 &&
    annualRate > 0;

  if (submitted) {
    return (
      <div className="container-detail">
        <ExternalHoldingReview
          input={submitted}
          backHref={ROUTES.portfolioAddFdManual}
          onBack={() => setSubmitted(null)}
        />
      </div>
    );
  }

  return (
    <div className="container-detail flex flex-col gap-8 py-8 md:py-12">
      <header className="flex max-w-2xl flex-col gap-3">
        <Link
          href={ROUTES.portfolioAddFd}
          className="focus-ring text-caption text-content-muted hover:text-content inline-flex w-fit items-center gap-1.5 rounded-md"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Add existing FD
        </Link>
        <div>
          <h1 className="text-h1 text-content">Add an existing FD</h1>
          <p className="text-body-lg text-content-muted mt-1">
            Enter the terms you know. This is a portfolio record, not a bank application.
          </p>
        </div>
      </header>

      <form
        className="max-w-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid || startedAt === null || tenureMonths === null) return;
          setSubmitted({
            id: opaqueId(),
            source: 'manually-added',
            bank: selectedBank,
            productName: productName.trim(),
            principal: amount,
            startedAt,
            tenureMonths,
            annualRate,
            isCumulative: payout === 'at-maturity',
            payoutLabel: PAYOUT_OPTIONS.find((option) => option.value === payout)?.label ?? payout,
            maturityInstruction:
              instruction === 'unknown' ? null : (instruction as MaturityInstruction),
            externalReference: externalReference.trim() === '' ? null : externalReference.trim(),
          });
        }}
      >
        <Card variant="outlined" className="flex flex-col gap-6 p-5 md:p-6">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-body-lg text-content font-semibold">Bank</legend>
            <Input
              value={bankSearch}
              onChange={(event) => setBankSearch(event.target.value)}
              placeholder="Search banks"
              prefix={<Search aria-hidden="true" className="size-4" />}
              aria-label="Search supported banks"
            />
            <p className="text-caption text-content-muted">
              Popular banks and other supported banks
            </p>
            <div className="flex flex-wrap gap-2" aria-label="Supported banks">
              {visibleBanks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setBankId(bank.id)}
                  aria-pressed={bank.id === selectedBank.id}
                  className={
                    bank.id === selectedBank.id
                      ? 'focus-ring bg-surface-brand text-content-on-brand text-caption rounded-full px-3 py-2 font-medium'
                      : 'focus-ring border-border-default text-content hover:bg-surface-subtle text-caption rounded-full border px-3 py-2 font-medium'
                  }
                >
                  {bank.name}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-body text-content font-medium">Product / FD name</span>
              <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-body text-content font-medium">Principal amount</span>
              <Input
                type="number"
                min="1"
                step="1"
                prefix="₹"
                value={principal}
                onChange={(event) => setPrincipal(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-body text-content font-medium">Interest rate</span>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                suffix="% p.a."
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-body text-content font-medium">Start date</span>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-body text-content font-medium">
              How do you know the term?
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="text-body text-content flex items-center gap-2">
                <input
                  type="radio"
                  checked={termMode === 'maturity-date'}
                  onChange={() => setTermMode('maturity-date')}
                />{' '}
                Maturity date
              </label>
              <label className="text-body text-content flex items-center gap-2">
                <input
                  type="radio"
                  checked={termMode === 'tenure'}
                  onChange={() => setTermMode('tenure')}
                />{' '}
                Tenure in months
              </label>
            </div>
            {termMode === 'maturity-date' ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-body text-content font-medium">Maturity date</span>
                <Input
                  type="date"
                  value={maturity}
                  invalid={dateMismatch}
                  onChange={(event) => setMaturity(event.target.value)}
                  aria-describedby={dateMismatch ? 'maturity-date-error' : undefined}
                />
                {dateMismatch ? (
                  <span id="maturity-date-error" className="text-caption text-error">
                    Use a whole-month maturity date that matches the start date, or enter the tenure
                    instead.
                  </span>
                ) : null}
              </label>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-body text-content font-medium">Tenure</span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  suffix="months"
                  value={tenure}
                  onChange={(event) => setTenure(event.target.value)}
                />
              </label>
            )}
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-body text-content font-medium">Interest option</span>
              <Select options={PAYOUT_OPTIONS} value={payout} onValueChange={setPayout} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-body text-content font-medium">Maturity instruction</span>
              <Select
                options={INSTRUCTION_OPTIONS}
                value={instruction}
                onValueChange={setInstruction}
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-body text-content font-medium">
                FD reference number{' '}
                <span className="text-content-muted font-normal">(optional)</span>
              </span>
              <Input
                value={externalReference}
                onChange={(event) => setExternalReference(event.target.value)}
              />
            </label>
          </div>
          <p className="text-caption text-content-muted">
            We use these customer-provided details to organize your portfolio. They are not
            independently verified with the bank in this POC.
          </p>
          <Button type="submit" size="lg" disabled={!valid}>
            Review FD
          </Button>
        </Card>
      </form>
    </div>
  );
}
