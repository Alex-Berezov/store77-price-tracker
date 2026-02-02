/**
 * Integration test for Scraper Service
 * Tests real browser-based scraping of store77.net
 *
 * NOTE: These tests require a real browser (Playwright) and network access.
 * They are skipped in CI environments.
 * Run locally with: yarn workspace api test scraper.integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ScraperService } from './scraper.service';
import { BrowserService } from './browser.service';
import { PrismaService } from '../prisma';

// Skip in CI environment
const isCI = process.env.CI === 'true';
const describeOrSkip = isCI ? describe.skip : describe;

describeOrSkip('ScraperService Integration', () => {
  let service: ScraperService;
  let browserService: BrowserService;

  // Mock PrismaService for integration tests
  const mockPrismaService = {
    category: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    product: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        ScraperService,
        BrowserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
    browserService = module.get<BrowserService>(BrowserService);
  }, 30000);

  afterAll(async () => {
    // Close browser after all tests
    await browserService.onModuleDestroy();
  });

  describe('parseCategories (real browser)', () => {
    it('should fetch and parse categories from store77.net', async () => {
      const categories = await service.parseCategories();

      expect(categories.length).toBeGreaterThan(50);
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('url');
      expect(categories[0]).toHaveProperty('slug');

      // Check for known category patterns
      const hasApple = categories.some(
        (c) => c.name.toLowerCase().includes('apple') || c.slug.includes('apple')
      );
      expect(hasApple).toBe(true);
    }, 60000);
  });

  describe('parseProductsFromCategory (real browser)', () => {
    it('should fetch and parse products from a category page', async () => {
      const categoryUrl = 'https://store77.net/apple_iphone_16_pro_2/';
      const products = await service.parseProductsFromCategory(categoryUrl, 'apple-iphone-16-pro');

      expect(products.length).toBeGreaterThan(0);

      // Check product structure
      const product = products[0];
      expect(product).toBeDefined();
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('originalPrice');
      expect(product).toHaveProperty('finalPrice');
      expect(product).toHaveProperty('externalUrl');

      // Price should be in kopecks (rubles * 100)
      expect(product!.originalPrice).toBeGreaterThan(100000); // > 1000 RUB

      // Final price should be 1000 RUB less than original
      expect(product!.originalPrice - product!.finalPrice).toBe(100000); // 1000 RUB discount
    }, 60000);
  });
});
