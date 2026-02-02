'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

interface CategoryMenuMobileProps {
  categories: Category[];
  className?: string;
}

export function CategoryMenuMobile({ categories, className }: CategoryMenuMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  const currentCategoryName = currentCategory
    ? categories.find((c) => c.slug === currentCategory)?.name || 'Категория'
    : 'Все товары';

  const closeMenu = () => setIsOpen(false);

  return (
    <div className={cn('relative', className)}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
        aria-expanded={isOpen}
        aria-label="Открыть меню категорий"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{currentCategoryName}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={closeMenu} aria-hidden="true" />

          {/* Menu */}
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Выберите категорию</span>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="p-2">
              {/* All Products */}
              <li>
                <Link
                  href="/"
                  onClick={closeMenu}
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

              {/* Categories */}
              {categories.map((category) => {
                const isActive = currentCategory === category.slug;

                return (
                  <li key={category.id}>
                    <Link
                      href={`/?category=${category.slug}`}
                      onClick={closeMenu}
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
                          <span className="text-xs text-muted-foreground">
                            {category.productCount}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
