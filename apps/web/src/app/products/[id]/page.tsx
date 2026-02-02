import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Clock } from 'lucide-react';
import { api, getProxiedImageUrl } from '@/lib/api';
import { formatRubles, formatUsd } from '@/lib/utils';
import { ProductDetailSkeleton } from './product-detail-skeleton';
import { ProductImage } from '@/components/ui/product-image';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO and Open Graph
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await api.products.getById(id);

    if (!product) {
      return {
        title: 'Товар не найден',
      };
    }

    const finalPrice = formatRubles(product.finalPriceRub);
    const description = product.description
      ? `${product.description.slice(0, 150)}...`
      : `Купить ${product.name} по выгодной цене ${finalPrice}. Актуальные цены с пересчётом по курсу USDT.`;

    return {
      title: product.name,
      description,
      openGraph: {
        title: `${product.name} — ${finalPrice}`,
        description,
        type: 'website',
        locale: 'ru_RU',
        images: product.imageUrl
          ? [
              {
                url: getProxiedImageUrl(product.imageUrl),
                width: 600,
                height: 600,
                alt: product.name,
              },
            ]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} — ${finalPrice}`,
        description,
        images: product.imageUrl ? [getProxiedImageUrl(product.imageUrl)] : [],
      },
    };
  } catch {
    return {
      title: 'Товар не найден',
    };
  }
}

async function ProductContent({ id }: { id: string }) {
  let product;

  try {
    // API returns product directly, not wrapped in { data: ... }
    product = await api.products.getById(id);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  const formattedDate = new Date(product.updatedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const proxiedImageUrl = product.imageUrl ? getProxiedImageUrl(product.imageUrl) : null;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Product Image */}
      <div className="lg:w-1/2">
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
          <ProductImage
            src={proxiedImageUrl}
            alt={product.name}
            containerClassName="h-full w-full"
            fallbackIcon="📦"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col lg:w-1/2">
        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{product.name}</h1>

        {/* Prices */}
        <div className="mt-6 space-y-2">
          {/* Final Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground sm:text-4xl">
              {formatRubles(product.finalPriceRub)}
            </span>
          </div>

          {/* Original Price (strikethrough) */}
          {product.originalPriceRub > product.finalPriceRub && (
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground line-through">
                {formatRubles(product.originalPriceRub)}
              </span>
              <span className="rounded-md bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                −1 000 ₽
              </span>
            </div>
          )}

          {/* USD Price */}
          {product.finalPriceUsd !== null && (
            <div className="text-lg text-muted-foreground">
              ≈ {formatUsd(product.finalPriceUsd)}
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Описание</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{product.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={product.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ExternalLink className="h-5 w-5" />
            Открыть на сайте
          </a>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            Назад к каталогу
          </Link>
        </div>

        {/* Updated Date */}
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Обновлено: {formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <div className="container py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Каталог
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">Товар</li>
        </ol>
      </nav>

      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductContent id={id} />
      </Suspense>
    </div>
  );
}
