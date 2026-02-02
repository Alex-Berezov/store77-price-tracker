import { Suspense } from 'react';
import { api } from '@/lib/api';
import { ProductGrid } from '@/components/products';
import { CategoryMenu, CategoryMenuMobile } from '@/components/categories';
import { Pagination } from '@/components/ui/pagination';
import { CatalogSkeleton } from './catalog-skeleton';

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = 12;
  const category = searchParams.category;

  // Fetch products and categories in parallel
  const [productsResponse, categoriesResponse] = await Promise.all([
    api.products.getAll({ page, limit, category }),
    api.categories.getAll(),
  ]);

  const { data: products, meta } = productsResponse;
  const { data: categories } = categoriesResponse;

  const currentCategoryName = category ? categories.find((c) => c.slug === category)?.name : null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Sidebar - Categories (Desktop) */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-4">
          <CategoryMenu categories={categories} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Mobile Categories */}
        <div className="mb-6 lg:hidden">
          <CategoryMenuMobile categories={categories} />
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{currentCategoryName || 'Все товары'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.total > 0
              ? `Найдено ${meta.total} ${getProductsWord(meta.total)}`
              : 'Товары не найдены'}
          </p>
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} />

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              searchParams={{ category }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get correct Russian word form for products count
function getProductsWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'товаров';
  }

  if (lastOne === 1) {
    return 'товар';
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return 'товара';
  }

  return 'товаров';
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const page = typeof params.page === 'string' ? params.page : undefined;

  return (
    <div className="container py-6 sm:py-8">
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParams={{ category, page }} />
      </Suspense>
    </div>
  );
}
