const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestConfig extends globalThis.RequestInit {
  params?: Record<string, string | number | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const { params, ...requestConfig } = config || {};
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...requestConfig,
      method: 'GET',
      cache: 'no-store', // Disable caching for dynamic data
      headers: {
        'Content-Type': 'application/json',
        ...requestConfig?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const { params, ...requestConfig } = config || {};
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...requestConfig,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...requestConfig?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API Endpoints
export const api = {
  // Products
  products: {
    getAll: (params?: { page?: number; limit?: number; category?: string }) =>
      apiClient.get<ProductsResponse>('/api/products', { params }),
    getById: (id: string) => apiClient.get<ProductResponse>(`/api/products/${id}`),
  },

  // Categories
  categories: {
    getAll: () => apiClient.get<CategoriesResponse>('/api/categories'),
  },

  // Currency
  currency: {
    getRate: () => apiClient.get<CurrencyRateResponse>('/api/currency/rate'),
  },
};

// Re-export types from centralized location
export type { Product, Category } from '@/types';

// Response Types
export interface ProductsResponse {
  data: import('@/types').Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  exchangeRate: number | null;
}

// ProductResponse is the product directly (no wrapper)
export type ProductResponse = import('@/types').Product;

export interface CategoriesResponse {
  data: import('@/types').Category[];
}

export interface CurrencyRateResponse {
  rate: number;
  updatedAt: string;
}

/**
 * Get proxied image URL that bypasses store77.net hotlinking protection
 * Uses the backend API with headless browser for image fetching
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return '';
  }
  return `${API_BASE_URL}/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
}
