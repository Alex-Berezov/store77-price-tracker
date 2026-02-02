import { Injectable, Logger } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma';
import {
  CategoryResponseDto,
  CategoriesListResponse,
  CategoryWithChildrenDto,
  CategoriesTreeResponse,
} from './dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all categories as a flat list
   * @returns List of all categories with product counts
   */
  async findAll(): Promise<CategoriesListResponse> {
    this.logger.debug('Finding all categories');

    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const data = categories.map((category) =>
      this.toCategoryResponse(category, category._count.products)
    );

    this.logger.debug(`Found ${categories.length} categories`);

    return {
      data,
      total: categories.length,
    };
  }

  /**
   * Get categories as hierarchical tree (only root categories with children)
   * @returns Tree of categories
   */
  async findTree(): Promise<CategoriesTreeResponse> {
    this.logger.debug('Finding categories tree');

    // Get root categories (no parent)
    const rootCategories = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
        children: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
      },
    });

    const data: CategoryWithChildrenDto[] = rootCategories.map((category) => ({
      ...this.toCategoryResponse(category, category._count.products),
      children: category.children.map((child) =>
        this.toCategoryResponse(child, child._count.products)
      ),
    }));

    this.logger.debug(`Found ${rootCategories.length} root categories`);

    return {
      data,
      total: rootCategories.length,
    };
  }

  /**
   * Get single category by slug
   * @param slug Category slug
   * @returns Category or null
   */
  async findBySlug(slug: string): Promise<CategoryResponseDto | null> {
    this.logger.debug(`Finding category by slug: ${slug}`);

    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return null;
    }

    return this.toCategoryResponse(category, category._count.products);
  }

  /**
   * Get total count of categories
   * @returns Total category count
   */
  async count(): Promise<number> {
    return this.prisma.category.count();
  }

  /**
   * Convert Category entity to response DTO
   */
  private toCategoryResponse(category: Category, productCount?: number): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      url: category.url,
      parentId: category.parentId,
      productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
