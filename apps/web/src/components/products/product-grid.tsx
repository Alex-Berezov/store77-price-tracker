import { Product } from '@/types';
import { ProductCard } from './product-card';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-6xl">📭</span>
        <h3 className="mt-4 text-lg font-semibold">Товары не найдены</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуйте изменить фильтры или поискать в другой категории
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
