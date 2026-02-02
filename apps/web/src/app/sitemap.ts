import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  try {
    // Get all categories for category pages
    const { data: categories } = await api.categories.getAll();

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${siteUrl}?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }));

    // Get products for product pages (first 100 for sitemap)
    const { data: products } = await api.products.getAll({ page: 1, limit: 100 });

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/products/${product.id}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    // Return only static routes if API fails
    return staticRoutes;
  }
}
