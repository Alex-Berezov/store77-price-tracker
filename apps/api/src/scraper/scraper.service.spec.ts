import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { ScraperService } from './scraper.service';
import { PrismaService } from '../prisma';

describe('ScraperService', () => {
  let service: ScraperService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateFinalPrice', () => {
    it('should subtract 1000 rubles (100000 kopecks) from original price', () => {
      // 5000 rubles = 500000 kopecks
      const originalPrice = 500000;
      const expectedFinalPrice = 400000; // 4000 rubles

      const result = service.calculateFinalPrice(originalPrice);

      expect(result).toBe(expectedFinalPrice);
    });

    it('should return 0 if result would be negative', () => {
      // 500 rubles = 50000 kopecks (less than 1000 ruble discount)
      const originalPrice = 50000;

      const result = service.calculateFinalPrice(originalPrice);

      expect(result).toBe(0);
    });

    it('should handle exact 1000 rubles correctly', () => {
      // 1000 rubles = 100000 kopecks
      const originalPrice = 100000;

      const result = service.calculateFinalPrice(originalPrice);

      expect(result).toBe(0);
    });

    it('should handle large prices correctly', () => {
      // 100000 rubles = 10000000 kopecks
      const originalPrice = 10000000;
      const expectedFinalPrice = 9900000; // 99000 rubles

      const result = service.calculateFinalPrice(originalPrice);

      expect(result).toBe(expectedFinalPrice);
    });
  });

  describe('parsePriceToKopecks', () => {
    it('should parse simple integer price', () => {
      const result = service.parsePriceToKopecks('5000');
      expect(result).toBe(500000); // 5000 rubles in kopecks
    });

    it('should parse price with currency symbol', () => {
      const result = service.parsePriceToKopecks('5000 ₽');
      expect(result).toBe(500000);
    });

    it('should parse price with spaces as thousand separators', () => {
      const result = service.parsePriceToKopecks('1 234 567 ₽');
      expect(result).toBe(123456700);
    });

    it('should parse price with decimal point', () => {
      const result = service.parsePriceToKopecks('1234.50');
      expect(result).toBe(123450);
    });

    it('should parse price with comma as decimal separator', () => {
      const result = service.parsePriceToKopecks('1234,50');
      expect(result).toBe(123450);
    });

    it('should return 0 for invalid price', () => {
      const result = service.parsePriceToKopecks('invalid');
      expect(result).toBe(0);
    });

    it('should handle price with "руб" text', () => {
      const result = service.parsePriceToKopecks('5000 руб.');
      expect(result).toBe(500000);
    });
  });

  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      const result = service.generateSlug('Product Name');
      expect(result).toBe('product-name');
    });

    it('should handle Russian text', () => {
      const result = service.generateSlug('Телефон iPhone');
      expect(result).toBe('телефон-iphone');
    });

    it('should remove special characters', () => {
      const result = service.generateSlug('Product (New!) @2024');
      expect(result).toBe('product-new-2024');
    });

    it('should handle multiple spaces and hyphens', () => {
      const result = service.generateSlug('Product   Name---Test');
      expect(result).toBe('product-name-test');
    });

    it('should trim leading and trailing hyphens', () => {
      const result = service.generateSlug(' - Product Name - ');
      expect(result).toBe('product-name');
    });
  });

  describe('toAbsoluteUrl', () => {
    it('should return absolute URL unchanged', () => {
      const url = 'https://example.com/path';
      const result = service.toAbsoluteUrl(url);
      expect(result).toBe(url);
    });

    it('should convert relative URL starting with /', () => {
      const result = service.toAbsoluteUrl('/catalog/phones');
      expect(result).toBe('https://store77.net/catalog/phones');
    });

    it('should convert relative URL without leading /', () => {
      const result = service.toAbsoluteUrl('catalog/phones');
      expect(result).toBe('https://store77.net/catalog/phones');
    });
  });

  describe('extractExternalId', () => {
    it('should extract ID from /product/12345 pattern', () => {
      const result = service.extractExternalId('https://store77.net/product/12345');
      expect(result).toBe('12345');
    });

    it('should extract ID from URL with trailing number', () => {
      const result = service.extractExternalId('https://store77.net/catalog/12345/');
      expect(result).toBe('12345');
    });

    it('should extract ID from query parameter', () => {
      const result = service.extractExternalId('https://store77.net/product?id=12345');
      expect(result).toBe('12345');
    });

    it('should return null for URL without ID pattern', () => {
      const result = service.extractExternalId('https://store77.net/catalog');
      expect(result).toBeNull();
    });
  });

  describe('fetchPage', () => {
    it('should fetch HTML content successfully', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      const mockResponse: AxiosResponse<string> = {
        data: mockHtml,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        } as InternalAxiosRequestConfig,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.fetchPage('https://example.com');

      expect(result).toBe(mockHtml);
      expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com', {
        responseType: 'text',
      });
    });

    it('should throw error on fetch failure', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.fetchPage('https://example.com')).rejects.toThrow(
        'Failed to fetch page https://example.com: Network error'
      );
    });
  });

  describe('loadHtml', () => {
    it('should load HTML into Cheerio instance', () => {
      const html = '<html><body><div class="test">Hello</div></body></html>';
      const $ = service.loadHtml(html);

      expect($('.test').text()).toBe('Hello');
    });

    it('should handle empty HTML', () => {
      const $ = service.loadHtml('');
      expect($('body').length).toBe(1);
    });
  });

  describe('getBaseUrl', () => {
    it('should return store77.net base URL', () => {
      expect(service.getBaseUrl()).toBe('https://store77.net');
    });
  });

  describe('parseCategoriesFromHtml', () => {
    it('should parse categories from HTML with catalog_menu class', () => {
      const html = `
        <html>
          <body>
            <nav class="catalog_menu">
              <a href="/category/phones">Телефоны</a>
              <a href="/category/tablets">Планшеты</a>
              <a href="/category/accessories">Аксессуары</a>
            </nav>
          </body>
        </html>
      `;

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'Телефоны',
        url: 'https://store77.net/category/phones',
        slug: 'телефоны',
      });
      expect(result[1]).toEqual({
        name: 'Планшеты',
        url: 'https://store77.net/category/tablets',
        slug: 'планшеты',
      });
    });

    it('should parse categories from HTML with main_menu class', () => {
      const html = `
        <html>
          <body>
            <div class="main_menu">
              <a href="/apple">Apple</a>
              <a href="/samsung">Samsung</a>
            </div>
          </body>
        </html>
      `;

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Apple');
      expect(result[1]!.name).toBe('Samsung');
    });

    it('should skip invalid links (javascript, #, login, cart)', () => {
      const html = `
        <html>
          <body>
            <nav class="catalog_menu">
              <a href="javascript:void(0)">Invalid</a>
              <a href="#">Empty</a>
              <a href="/login">Login</a>
              <a href="/cart">Cart</a>
              <a href="/account">Account</a>
              <a href="/category/valid">Valid Category</a>
            </nav>
          </body>
        </html>
      `;

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Valid Category');
    });

    it('should skip duplicate categories by slug', () => {
      const html = `
        <html>
          <body>
            <nav class="catalog_menu">
              <a href="/phones">Телефоны</a>
              <a href="/phones-2">Телефоны</a>
              <a href="/tablets">Планшеты</a>
            </nav>
          </body>
        </html>
      `;

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(2);
    });

    it('should return empty array for HTML without categories', () => {
      const html = '<html><body><p>No categories here</p></body></html>';

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(0);
    });

    it('should skip entries with very short names', () => {
      const html = `
        <html>
          <body>
            <nav class="catalog_menu">
              <a href="/a">A</a>
              <a href="/phones">Phones</a>
            </nav>
          </body>
        </html>
      `;

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Phones');
    });

    it('should handle absolute URLs correctly', () => {
      const html = `
        <html>
          <body>
            <nav class="catalog_menu">
              <a href="https://store77.net/category/phones">Phones</a>
              <a href="https://external.com/tablets">Tablets</a>
            </nav>
          </body>
        </html>
      `;

      const result = service.parseCategoriesFromHtml(html);

      expect(result).toHaveLength(2);
      expect(result[0]!.url).toBe('https://store77.net/category/phones');
      expect(result[1]!.url).toBe('https://external.com/tablets');
    });
  });

  describe('saveCategories', () => {
    it('should save categories to database using upsert', async () => {
      const categories = [
        { name: 'Phones', url: 'https://store77.net/phones', slug: 'phones' },
        { name: 'Tablets', url: 'https://store77.net/tablets', slug: 'tablets' },
      ];

      mockPrismaService.category.upsert.mockResolvedValue({});

      const result = await service.saveCategories(categories);

      expect(result).toBe(2);
      expect(mockPrismaService.category.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.category.upsert).toHaveBeenCalledWith({
        where: { slug: 'phones' },
        update: { name: 'Phones', url: 'https://store77.net/phones' },
        create: { name: 'Phones', slug: 'phones', url: 'https://store77.net/phones' },
      });
    });

    it('should handle database errors gracefully', async () => {
      const categories = [
        { name: 'Phones', url: 'https://store77.net/phones', slug: 'phones' },
        { name: 'Tablets', url: 'https://store77.net/tablets', slug: 'tablets' },
      ];

      mockPrismaService.category.upsert
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({});

      const result = await service.saveCategories(categories);

      expect(result).toBe(1); // Only one succeeded
    });

    it('should return 0 for empty categories array', async () => {
      const result = await service.saveCategories([]);

      expect(result).toBe(0);
      expect(mockPrismaService.category.upsert).not.toHaveBeenCalled();
    });
  });
});
