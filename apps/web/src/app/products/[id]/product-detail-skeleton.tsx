export function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Image Skeleton */}
      <div className="lg:w-1/2">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Info Skeleton */}
      <div className="flex flex-1 flex-col lg:w-1/2">
        {/* Title Skeleton */}
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-10 w-1/2 animate-pulse rounded-lg bg-muted" />

        {/* Price Skeleton */}
        <div className="mt-6 space-y-2">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        </div>

        {/* Description Skeleton */}
        <div className="mt-8">
          <div className="mb-3 h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted sm:w-48" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted sm:w-48" />
        </div>

        {/* Date Skeleton */}
        <div className="mt-8 h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
