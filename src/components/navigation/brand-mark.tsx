import { cn } from '@/lib/utils';

/**
 * BrandMark — the "FD Marketplace" wordmark from the approved UI:
 * "FD" in primary content colour, "Marketplace" in brand colour.
 * Presentation-only; used by TopNav and Footer.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('text-h3 text-content whitespace-nowrap', className)}>
      FD <span className="text-content-brand">Marketplace</span>
    </span>
  );
}
