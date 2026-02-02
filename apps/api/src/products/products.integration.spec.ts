/**
 * Integration tests for Products API endpoints
 * Tests the complete request/response flow
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import { CacheService } from '../cache';

describe('Products API Integration', () => {
  let app: INestApplication;
  let _productsService: ProductsService;

  // Mock data
  const mockProducts = [
    {
      id: 'product-1',
      name: 'iPhone 16 Pro Max 256GB',
      slug: 'iphone-16-pro-max-256gb',
      originalPrice: 15000000, // 150,000 RUB in kopecks
      finalPrice: 14900000, // 149,000 RUB in kopecks
      imageUrl: 'https://store77.net/images/iphone16.jpg',
      externalUrl: 'https://store77.net/product/iphone-16',
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      category: {
        id: 'cat-1',
        name: 'iPhone 16 Pro',
        slug: 'iphone-16-pro',
        url: 'https://store77.net/iphone-16-pro/',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    },
    {
      id: 'product-2',
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      originalPrice: 12000000, // 120,000 RUB
      finalPrice: 11900000, // 119,000 RUB
      imageUrl: 'https://store77.net/images/s24.jpg',
      externalUrl: 'https://store77.net/product/s24-ultra',
      categoryId: 'cat-2',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      category: {
        id: 'cat-2',
        name: 'Samsung Galaxy',
        slug: 'samsung-galaxy',
        url: 'https://store77.net/samsung-galaxy/',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    },
  ];

  const mockPrismaService = {
    product: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue(mockProducts),
      findUnique: jest.fn().mockImplementation(({ where: { id } }) => {
        const product = mockProducts.find((p) => p.id === id);
        return Promise.resolve(product || null);
      }),
    },
  };

  const mockCurrencyService = {
    getCurrentRate: jest.fn().mockResolvedValue({
      rate: 90.5,
      originalBid: 90.6,
      timestamp: Date.now(),
      fromCache: true,
    }),
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    _productsService = moduleRef.get<ProductsService>(ProductsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    it('should return paginated products list', async () => {
      const response = await request(app.getHttpServer()).get('/products').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body).toHaveProperty('exchangeRate');

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Check product structure
      const product = response.body.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('originalPriceRub');
      expect(product).toHaveProperty('finalPriceRub');
      expect(product).toHaveProperty('finalPriceUsd');
      expect(product).toHaveProperty('category');
    });

    it('should return correct pagination metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?page=1&limit=10')
        .expect(200);

      expect(response.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should filter products by category', async () => {
      mockPrismaService.product.findMany.mockResolvedValueOnce([mockProducts[0]]);
      mockPrismaService.product.count.mockResolvedValueOnce(1);

      const response = await request(app.getHttpServer())
        .get('/products?category=iphone-16-pro')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    it('should search products by name', async () => {
      mockPrismaService.product.findMany.mockResolvedValueOnce([mockProducts[1]]);
      mockPrismaService.product.count.mockResolvedValueOnce(1);

      const response = await request(app.getHttpServer())
        .get('/products?search=samsung')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should calculate USD prices correctly', async () => {
      const response = await request(app.getHttpServer()).get('/products').expect(200);

      // finalPrice = 149,000 RUB, rate = 90.5
      // finalPriceUsd = 149000 / 90.5 ≈ 1646.41
      const product = response.body.data[0];
      expect(product.finalPriceUsd).toBeCloseTo(1646.41, 1);
    });

    it('should handle missing exchange rate gracefully', async () => {
      mockCurrencyService.getCurrentRate.mockRejectedValueOnce(new Error('API error'));

      const response = await request(app.getHttpServer()).get('/products').expect(200);

      expect(response.body.exchangeRate).toBeNull();
      expect(response.body.data[0].finalPriceUsd).toBeNull();
    });
  });

  describe('GET /products/:id', () => {
    it('should return single product by ID', async () => {
      const response = await request(app.getHttpServer()).get('/products/product-1').expect(200);

      expect(response.body).toHaveProperty('id', 'product-1');
      expect(response.body).toHaveProperty('name', 'iPhone 16 Pro Max 256GB');
      expect(response.body).toHaveProperty('originalPriceRub');
      expect(response.body).toHaveProperty('finalPriceRub');
      expect(response.body).toHaveProperty('finalPriceUsd');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 404 for non-existent product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .get('/products/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should include USD price in product response', async () => {
      const response = await request(app.getHttpServer()).get('/products/product-1').expect(200);

      // finalPrice = 149,000 RUB, rate = 90.5
      expect(response.body.finalPriceUsd).toBeCloseTo(1646.41, 1);
    });
  });
});
