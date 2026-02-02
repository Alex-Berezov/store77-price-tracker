'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl = '/',
  searchParams = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const buildPageUrl = (page: number): string => {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && key !== 'page') {
        params.set(key, value);
      }
    });

    if (page > 1) {
      params.set('page', String(page));
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsisThreshold = 7;

    if (totalPages <= showEllipsisThreshold) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      role="navigation"
      aria-label="Навигация по страницам"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Назад</span>
        </Link>
      ) : (
        <span
          className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium text-muted-foreground opacity-50"
          aria-label="Предыдущая страница"
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Назад</span>
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <Link
              key={page}
              href={buildPageUrl(page)}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
              )}
              aria-label={`Страница ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
          aria-label="Следующая страница"
        >
          <span className="hidden sm:inline">Вперёд</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium text-muted-foreground opacity-50"
          aria-label="Следующая страница"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Вперёд</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
