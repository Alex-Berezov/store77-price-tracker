'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

interface CategoryMenuProps {
  categories: Category[];
  className?: string;
}

export function CategoryMenu({ categories, className }: CategoryMenuProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  // Filter out empty categories (productCount === 0 or undefined)
  const nonEmptyCategories = categories.filter(
    (category) => category.productCount !== undefined && category.productCount > 0
  );

  return (
    <nav className={cn('w-full', className)} aria-label="Категории">
      <div className="mb-3 flex items-center gap-2 px-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Категории
        </h2>
      </div>

      <ul className="space-y-1">
        {/* All Products Link */}
        <li>
          <Link
            href="/"
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
              !currentCategory
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground hover:bg-muted'
            )}
          >
            <span>Все товары</span>
            {!currentCategory && <ChevronRight className="h-4 w-4" />}
          </Link>
        </li>

        {/* Category Links */}
        {nonEmptyCategories.map((category) => {
          const isActive = currentCategory === category.slug;

          return (
            <li key={category.id}>
              <Link
                href={`/?category=${category.slug}`}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span className="line-clamp-1">{category.name}</span>
                <span className="flex items-center gap-1">
                  {category.productCount !== undefined && (
                    <span className="text-xs text-muted-foreground">{category.productCount}</span>
                  )}
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
