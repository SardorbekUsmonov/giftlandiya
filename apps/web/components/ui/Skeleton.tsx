import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-gray-200', className)}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full rounded-[18px] mb-[11px]" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-24 mt-1" />
      </div>
    </div>
  );
}

export function CategoryChipSkeleton() {
  return <Skeleton className="h-9 w-24 rounded-full flex-shrink-0" />;
}
