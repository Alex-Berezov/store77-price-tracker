import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: jest.Mocked<PrismaService>;
  let currencyService: jest.Mocked<CurrencyService>;

  const mockProduct = {
    id: 'test-product-id',
    externalId: 'ext-123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    originalPrice: 500000, // 5000 RUB in kopecks
    finalPrice: 400000, // 4000 RUB in kopecks (after -1000 discount)
    imageUrl: 'https://example.com/image.jpg',
    externalUrl: 'https://store77.net/product/123',
    categoryId: 'cat-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    category: {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      url: 'https://store77.net/electronics',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  const mockExchangeRate = {
    rate: 100,
    originalBid: 100.1,
    timestamp: Date.now(),
    fromCache: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: CurrencyService,
          useValue: {
            getCurrentRate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get(PrismaService);
    currencyService = module.get(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products with USD prices', async () => {
      const products = [mockProduct];
      prismaService.product.count = jest.fn().mockResolvedValue(1);
      prismaService.product.findMany = jest.fn().mockResolvedValue(products);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.exchangeRate).toBe(100);
      expect(result.data[0]!.finalPriceRub).toBe(4000);
      expect(result.data[0]!.finalPriceUsd).toBe(40); // 4000 / 100
    });

    it('should handle pagination correctly', async () => {
      prismaService.product.count = jest.fn().mockResolvedValue(50);
      prismaService.product.findMany = jest.fn().mockResolvedValue([mockProduct]);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(true);
    });

    it('should filter by category', async () => {
      prismaService.product.count = jest.fn().mockResolvedValue(1);
      prismaService.product.findMany = jest.fn().mockResolvedValue([mockProduct]);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      await service.findAll({ page: 1, limit: 20, category: 'phones' });

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'phones' },
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      prismaService.product.count = jest.fn().mockResolvedValue(1);
      prismaService.product.findMany = jest.fn().mockResolvedValue([mockProduct]);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      await service.findAll({ page: 1, limit: 20, search: 'iphone' });

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'iphone', mode: 'insensitive' } },
              { description: { contains: 'iphone', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should return null USD prices when exchange rate unavailable', async () => {
      prismaService.product.count = jest.fn().mockResolvedValue(1);
      prismaService.product.findMany = jest.fn().mockResolvedValue([mockProduct]);
      currencyService.getCurrentRate = jest.fn().mockRejectedValue(new Error('API error'));

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data[0]!.finalPriceUsd).toBeNull();
      expect(result.exchangeRate).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return product by ID with USD price', async () => {
      prismaService.product.findUnique = jest.fn().mockResolvedValue(mockProduct);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      const result = await service.findOne('test-product-id');

      expect(result.id).toBe('test-product-id');
      expect(result.name).toBe('Test Product');
      expect(result.originalPriceRub).toBe(5000);
      expect(result.finalPriceRub).toBe(4000);
      expect(result.finalPriceUsd).toBe(40);
      expect(result.category).toEqual({
        id: 'cat-1',
        name: 'Electronics',
        slug: 'electronics',
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      prismaService.product.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return null USD price when exchange rate unavailable', async () => {
      prismaService.product.findUnique = jest.fn().mockResolvedValue(mockProduct);
      currencyService.getCurrentRate = jest.fn().mockRejectedValue(new Error('API error'));

      const result = await service.findOne('test-product-id');

      expect(result.finalPriceUsd).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      prismaService.product.findUnique = jest.fn().mockResolvedValue(mockProduct);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      const result = await service.findBySlug('test-product');

      expect(result.slug).toBe('test-product');
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
        include: { category: true },
      });
    });

    it('should throw NotFoundException when product not found by slug', async () => {
      prismaService.product.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return total count of active products', async () => {
      prismaService.product.count = jest.fn().mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(prismaService.product.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });

  describe('price conversion', () => {
    it('should correctly convert kopecks to rubles', async () => {
      const productInKopecks = {
        ...mockProduct,
        originalPrice: 123456, // 1234.56 RUB
        finalPrice: 23456, // 234.56 RUB
      };
      prismaService.product.findUnique = jest.fn().mockResolvedValue(productInKopecks);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(mockExchangeRate);

      const result = await service.findOne('test-product-id');

      expect(result.originalPriceRub).toBe(1234.56);
      expect(result.finalPriceRub).toBe(234.56);
    });

    it('should round USD price to 2 decimal places', async () => {
      const productWithOddPrice = {
        ...mockProduct,
        finalPrice: 33333, // 333.33 RUB
      };
      const rateWithDecimals = { ...mockExchangeRate, rate: 97.5 };

      prismaService.product.findUnique = jest.fn().mockResolvedValue(productWithOddPrice);
      currencyService.getCurrentRate = jest.fn().mockResolvedValue(rateWithDecimals);

      const result = await service.findOne('test-product-id');

      // 333.33 / 97.5 = 3.4187... should round to 3.42
      expect(result.finalPriceUsd).toBe(3.42);
    });
  });
});
