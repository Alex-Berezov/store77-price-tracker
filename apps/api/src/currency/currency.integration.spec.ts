/**
 * Integration test for Currency Service
 * Tests real API calls to Grinex exchange
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { CacheService } from '../cache';
import { PrismaService } from '../prisma';

describe('Currency Integration', () => {
  let currencyService: CurrencyService;

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          timeout: 10000,
        }),
      ],
      providers: [
        CurrencyService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    currencyService = module.get<CurrencyService>(CurrencyService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchExchangeRate (real API)', () => {
    it('should fetch exchange rate from Grinex API', async () => {
      const result = await currencyService.fetchExchangeRate();

      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('originalBid');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('fromCache');

      // Rate should be a reasonable USDT/RUB value (between 50 and 200)
      expect(result.rate).toBeGreaterThan(50);
      expect(result.rate).toBeLessThan(200);

      // Rate should be 0.10 less than original bid
      expect(result.rate).toBe(Math.round((result.originalBid - 0.1) * 100) / 100);

      expect(result.fromCache).toBe(false);
    }, 15000);
  });

  describe('getCurrentRate with caching', () => {
    it('should cache the rate after fetching', async () => {
      mockCacheService.get.mockResolvedValueOnce(undefined);

      const result = await currencyService.getCurrentRate();

      expect(result.rate).toBeGreaterThan(50);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'currency:usdt_rub_rate',
        expect.objectContaining({ rate: result.rate }),
        300000 // 5 minutes TTL
      );
    }, 15000);

    it('should return cached rate if available', async () => {
      const cachedRate = {
        rate: 77.1,
        originalBid: 77.2,
        timestamp: Date.now(),
        fromCache: false,
      };
      mockCacheService.get.mockResolvedValueOnce(cachedRate);

      const result = await currencyService.getCurrentRate();

      expect(result.rate).toBe(77.1);
      expect(result.fromCache).toBe(true);
    });
  });
});

describe('Currency Controller Integration', () => {
  let app: INestApplication;

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          timeout: 10000,
        }),
      ],
      controllers: [CurrencyController],
      providers: [
        CurrencyService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.get.mockResolvedValue(undefined);
  });

  describe('GET /currency/rate', () => {
    it('should return exchange rate with correct structure', async () => {
      const response = await request(app.getHttpServer()).get('/currency/rate').expect(200);

      expect(response.body).toHaveProperty('rate');
      expect(response.body).toHaveProperty('originalBid');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('fromCache');

      expect(typeof response.body.rate).toBe('number');
      expect(response.body.rate).toBeGreaterThan(50);
      expect(response.body.rate).toBeLessThan(200);
    }, 15000);
  });

  describe('POST /currency/refresh', () => {
    it('should refresh and return new exchange rate', async () => {
      const response = await request(app.getHttpServer()).post('/currency/refresh').expect(201);

      expect(response.body).toHaveProperty('rate');
      expect(response.body.fromCache).toBe(false);
      expect(mockCacheService.set).toHaveBeenCalled();
    }, 15000);
  });

  describe('GET /currency/products/:id/price', () => {
    it('should return product price in USD', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
        finalPrice: 771000, // 7710 RUB in kopecks
      };
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);

      const response = await request(app.getHttpServer())
        .get('/currency/products/test-product-id/price')
        .expect(200);

      expect(response.body).toHaveProperty('productId', 'test-product-id');
      expect(response.body).toHaveProperty('productName', 'Test Product');
      expect(response.body).toHaveProperty('priceRub', 7710); // 771000 kopecks = 7710 RUB
      expect(response.body).toHaveProperty('priceUsd');
      expect(response.body).toHaveProperty('exchangeRate');
      expect(response.body).toHaveProperty('fromCache');

      // Price in USD should be reasonable
      expect(response.body.priceUsd).toBeGreaterThan(0);
      expect(response.body.priceUsd).toBeLessThan(response.body.priceRub);
    }, 15000);

    it('should return 404 for non-existent product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .get('/currency/products/non-existent-id/price')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });
});
