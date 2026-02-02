function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      {/* Image Skeleton */}
      <div className="aspect-square animate-pulse bg-muted" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title Skeleton */}
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />

        {/* Price Skeleton */}
        <div className="mt-auto pt-3">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-16 animate-pulse rounded bg-muted" />
        </div>

        {/* Link Skeleton */}
        <div className="mt-3 h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function CategoryMenuSkeleton() {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="mb-3 flex items-center gap-2 px-2">
        <div className="h-5 w-5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>

      {/* Category Items Skeleton */}
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Sidebar Skeleton (Desktop) */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <CategoryMenuSkeleton />
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Mobile Categories Skeleton */}
        <div className="mb-6 h-12 animate-pulse rounded-lg bg-muted lg:hidden" />

        {/* Title Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted sm:h-9" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
