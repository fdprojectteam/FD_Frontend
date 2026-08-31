'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { PortfolioHolding } from '@/types/portfolio';

const INSTRUCTION_OPTIONS = [
  { value: 'unknown', label: 'Not provided' },
  { value: 'renew-principal-and-interest', label: 'Renew principal and interest' },
  { value: 'renew-principal-only', label: 'Renew principal, pay out interest' },
  { value: 'pay-out', label: 'Pay out principal and interest' },
];

interface EditHoldingDialogProps {
  holding: PortfolioHolding | null;
  onOpenChange: (open: boolean) => void;
  onSave: (holding: PortfolioHolding) => void;
}

/** Editing stays at the canonical-holding boundary; platform bookings are never offered here. */
export function EditHoldingDialog({ holding, onOpenChange, onSave }: EditHoldingDialogProps) {
  const [productName, setProductName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [instruction, setInstruction] = useState('unknown');

  useEffect(() => {
    if (!holding) return;
    setProductName(holding.productName);
    setPrincipal(String(holding.principal));
    setRate(String(holding.annualRate));
    setInstruction(holding.maturityInstruction ?? 'unknown');
  }, [holding]);

  const amount = Number(principal);
  const annualRate = Number(rate);
  const valid =
    productName.trim() !== '' && Number.isInteger(amount) && amount > 0 && annualRate > 0;

  return (
    <Dialog open={holding !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit FD details</DialogTitle>
          <DialogDescription>
            Update the information you supplied. This changes only this portfolio record; it does
            not change anything at the bank.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-body text-content font-medium">Product / FD name</span>
            <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-body text-content font-medium">Maturity instruction</span>
            <Select
              options={INSTRUCTION_OPTIONS}
              value={instruction}
              onValueChange={setInstruction}
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid || holding === null}
            onClick={() => {
              if (!holding || !valid) return;
              onSave({
                ...holding,
                productName: productName.trim(),
                principal: amount,
                annualRate,
                maturityInstruction:
                  instruction === 'unknown'
                    ? null
                    : (instruction as PortfolioHolding['maturityInstruction']),
              });
              onOpenChange(false);
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RemoveHoldingDialogProps {
  holding: PortfolioHolding | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reference: string) => void;
}

export function RemoveHoldingDialog({
  holding,
  onOpenChange,
  onConfirm,
}: RemoveHoldingDialogProps) {
  return (
    <Dialog open={holding !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this FD?</DialogTitle>
          <DialogDescription>
            This removes the {holding?.bank.name} record from this portfolio only. It does not close
            or change the FD at the bank.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Keep FD
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-error text-error"
            onClick={() => {
              if (holding) onConfirm(holding.reference);
              onOpenChange(false);
            }}
          >
            Remove record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
