import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Product, Category } from '@prisma/client';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import {
  ProductQueryDto,
  ProductResponseDto,
  PaginatedProductsResponse,
  PaginationMeta,
} from './dto';

/** Kopecks to rubles conversion factor */
const KOPECKS_TO_RUBLES = 100;

/** Product with category relation */
type ProductWithCategory = Product & {
  category: Category | null;
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly currencyService: CurrencyService
  ) {}

  /**
   * Get paginated list of products with optional filtering
   * @param query Pagination and filter parameters
   * @returns Paginated products with USD prices
   */
  async findAll(query: ProductQueryDto): Promise<PaginatedProductsResponse> {
    const { page = 1, limit = 20, category, search } = query;
    const skip = (page - 1) * limit;

    this.logger.debug(
      `Finding products: page=${page}, limit=${limit}, category=${category}, search=${search}`
    );

    // Build where clause
    const where = this.buildWhereClause(category, search);

    // Execute count and find in parallel
    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Get current exchange rate for USD conversion
    let exchangeRate: number | null = null;
    try {
      const rateResult = await this.currencyService.getCurrentRate();
      exchangeRate = rateResult.rate;
    } catch {
      this.logger.warn('Failed to get exchange rate for USD prices');
    }

    // Transform products to response DTOs
    const data = products.map((product) => this.toProductResponse(product, exchangeRate));

    // Build pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    this.logger.debug(`Found ${products.length} products (total: ${total})`);

    return { data, meta, exchangeRate };
  }

  /**
   * Get single product by ID
   * @param id Product ID
   * @returns Product with USD price
   * @throws NotFoundException if product not found
   */
  async findOne(id: string): Promise<ProductResponseDto> {
    this.logger.debug(`Finding product by ID: ${id}`);

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      this.logger.warn(`Product not found: ${id}`);
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // Get exchange rate for USD price
    let exchangeRate: number | null = null;
    try {
      const rateResult = await this.currencyService.getCurrentRate();
      exchangeRate = rateResult.rate;
    } catch {
      this.logger.warn('Failed to get exchange rate for USD price');
    }

    return this.toProductResponse(product, exchangeRate);
  }

  /**
   * Get product by slug
   * @param slug Product slug
   * @returns Product with USD price
   * @throws NotFoundException if product not found
   */
  async findBySlug(slug: string): Promise<ProductResponseDto> {
    this.logger.debug(`Finding product by slug: ${slug}`);

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) {
      this.logger.warn(`Product not found by slug: ${slug}`);
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    // Get exchange rate for USD price
    let exchangeRate: number | null = null;
    try {
      const rateResult = await this.currencyService.getCurrentRate();
      exchangeRate = rateResult.rate;
    } catch {
      this.logger.warn('Failed to get exchange rate for USD price');
    }

    return this.toProductResponse(product, exchangeRate);
  }

  /**
   * Get total count of active products
   * @returns Total product count
   */
  async count(): Promise<number> {
    return this.prisma.product.count({
      where: { isActive: true },
    });
  }

  /**
   * Build Prisma where clause from query parameters
   */
  private buildWhereClause(category?: string, search?: string) {
    const where: {
      isActive: boolean;
      category?: { slug: string };
      OR?: Array<
        | { name: { contains: string; mode: 'insensitive' } }
        | { description: { contains: string; mode: 'insensitive' } }
      >;
    } = {
      isActive: true,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Convert Product entity to response DTO
   */
  private toProductResponse(
    product: ProductWithCategory,
    exchangeRate: number | null
  ): ProductResponseDto {
    // Convert kopecks to rubles
    const originalPriceRub = product.originalPrice / KOPECKS_TO_RUBLES;
    const finalPriceRub = product.finalPrice / KOPECKS_TO_RUBLES;

    // Calculate USD price if exchange rate is available
    const finalPriceUsd =
      exchangeRate !== null ? Math.round((finalPriceRub / exchangeRate) * 100) / 100 : null;

    return {
      id: product.id,
      externalId: product.externalId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      originalPriceRub,
      finalPriceRub,
      finalPriceUsd,
      imageUrl: product.imageUrl,
      externalUrl: product.externalUrl,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
