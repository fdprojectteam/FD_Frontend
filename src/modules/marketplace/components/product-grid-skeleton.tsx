import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ProductGridSkeleton — loading placeholders shaped like real product
 * cards (M2.4), so swapping in content causes no layout shift.
 * Announced once at the container level, not per placeholder.
 */
export interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className="grid gap-6 md:grid-cols-3">
      <span className="sr-only">Loading products…</span>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="flex flex-col">
          <CardHeader className="gap-4">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-8">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter className="gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
