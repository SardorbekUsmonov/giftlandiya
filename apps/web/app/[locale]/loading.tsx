import { ProductCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <div className="h-80 animate-pulse rounded-none bg-purple-200" />

      {/* Giftbot banner skeleton */}
      <div className="mx-4 mt-4 h-20 animate-pulse rounded-xl bg-purple-100" />

      {/* Category chips skeleton */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-20 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>

      {/* Products grid skeleton */}
      <div className="px-4 mt-4">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
