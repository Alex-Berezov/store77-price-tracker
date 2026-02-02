'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: string;
}

/**
 * Product image component with error handling and fallback
 */
export function ProductImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackIcon = '📦',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const showFallback = !src || hasError;

  return (
    <div className={cn('relative overflow-hidden bg-muted', containerClassName)}>
      {/* Loading skeleton */}
      {isLoading && !showFallback && <div className="absolute inset-0 animate-pulse bg-muted" />}

      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <span className="text-4xl text-muted-foreground">{fallbackIcon}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}
