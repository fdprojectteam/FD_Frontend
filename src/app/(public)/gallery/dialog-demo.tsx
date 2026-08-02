'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

/**
 * Dev-only Dialog demos for the gallery: basic, confirmation, long
 * scrolling content, and nested interactive controls. Domain-neutral.
 */
export function DialogDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Basic */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Basic dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Basic dialog</DialogTitle>
            <DialogDescription>
              A title, a description, and body content on the card surface.
            </DialogDescription>
          </DialogHeader>
          <p className="text-body text-content-muted">
            Escape, the close button, and clicking the overlay all dismiss this dialog. Focus is
            trapped while open and returns to the trigger on close.
          </p>
        </DialogContent>
      </Dialog>

      {/* Confirmation */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Confirmation dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Confirm</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Long scrolling content */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Long scrolling content</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Long content</DialogTitle>
            <DialogDescription>
              The panel is capped to the viewport and scrolls internally.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 12 }, (_, index) => (
              <p key={index} className="text-body text-content-muted">
                Paragraph {index + 1}. The dialog panel never exceeds the viewport height thanks to
                the overlay viewport utility, so long content scrolls inside the panel rather than
                pushing the page or clipping beyond the screen edge.
              </p>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested interactive controls */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Nested controls</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nested interactive controls</DialogTitle>
            <DialogDescription>
              Input and Select continue to work inside the focus trap, including the Select&apos;s
              own portal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="dialog-amount" className="text-body text-content font-medium">
                Amount
              </label>
              <Input id="dialog-amount" prefix="₹" defaultValue="1,00,000" inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="dialog-tenure" className="text-body text-content font-medium">
                Tenure
              </label>
              <Select
                id="dialog-tenure"
                placeholder="Select tenure"
                options={[
                  { value: '6m', label: '6 months' },
                  { value: '12m', label: '12 months' },
                  { value: '24m', label: '24 months' },
                ]}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Save</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
