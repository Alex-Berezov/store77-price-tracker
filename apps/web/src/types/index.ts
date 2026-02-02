export interface Product {
  id: string;
  externalId: string | null;
  name: string;
  slug: string;
  description: string | null;
  /** Original price in rubles */
  originalPriceRub: number;
  /** Final price in rubles (after discount) */
  finalPriceRub: number;
  /** Final price in USD (calculated by API) */
  finalPriceUsd: number | null;
  imageUrl: string | null;
  externalUrl: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  productCount?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
