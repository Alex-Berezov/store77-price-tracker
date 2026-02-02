/** Category information in product response */
export interface ProductCategoryDto {
  id: string;
  name: string;
  slug: string;
}

/** Single product response */
export interface ProductResponseDto {
  id: string;
  externalId: string | null;
  name: string;
  slug: string;
  description: string | null;
  /** Original price in rubles (converted from kopecks) */
  originalPriceRub: number;
  /** Final price in rubles (converted from kopecks) */
  finalPriceRub: number;
  /** Final price in USD (calculated on the fly) */
  finalPriceUsd: number | null;
  imageUrl: string | null;
  externalUrl: string;
  category: ProductCategoryDto | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Paginated list response */
export interface PaginatedProductsResponse {
  data: ProductResponseDto[];
  meta: PaginationMeta;
  /** Current exchange rate used for USD prices */
  exchangeRate: number | null;
}
