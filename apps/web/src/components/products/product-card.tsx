import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn, formatRubles, formatUsd } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/api';
import { ProductImage } from '@/components/ui/product-image';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { id, name, finalPriceRub, finalPriceUsd, imageUrl, externalUrl } = product;
  const proxiedImageUrl = imageUrl ? getProxiedImageUrl(imageUrl) : null;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20',
        className
      )}
    >
      {/* Image Container */}
      <Link href={`/products/${id}`} className="relative aspect-square overflow-hidden bg-muted">
        <ProductImage
          src={proxiedImageUrl}
          alt={name}
          containerClassName="h-full w-full"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Product Name */}
        <Link href={`/products/${id}`} className="group/title">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover/title:text-primary">
            {name}
          </h3>
        </Link>

        {/* Prices */}
        <div className="mt-auto pt-3">
          {/* Final Price in RUB */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatRubles(finalPriceRub)}</span>
          </div>

          {/* Price in USD */}
          {finalPriceUsd !== null && finalPriceUsd !== undefined && (
            <div className="mt-1">
              <span className="text-sm text-muted-foreground">≈ {formatUsd(finalPriceUsd)}</span>
            </div>
          )}
        </div>

        {/* External Link */}
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Открыть на сайте</span>
        </a>
      </div>
    </article>
  );
}
