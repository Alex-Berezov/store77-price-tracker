import { Injectable, Logger, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma';
import { BrowserService } from './browser.service';

/** Base URL for store77.net */
const STORE77_BASE_URL = 'https://store77.net';

/** Price discount applied to all products (in kopecks/cents) */
const PRICE_DISCOUNT_KOPECKS = 1000_00; // 1000 rubles = 100000 kopecks

/** Parsed category data from website */
export interface ParsedCategory {
  name: string;
  url: string;
  slug: string;
}

/** Parsed product data from website */
export interface ParsedProduct {
  externalId: string | null;
  name: string;
  description: string | null;
  originalPrice: number; // in kopecks
  finalPrice: number; // in kopecks (originalPrice - 1000 RUB)
  imageUrl: string | null;
  externalUrl: string;
  categorySlug: string | null;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    @Optional() private readonly browserService?: BrowserService
  ) {}

  /**
   * Fetch HTML content from a URL using browser (Playwright) or HTTP
   * @param url - URL to fetch
   * @param useBrowser - Whether to use headless browser (default: true for store77.net)
   * @returns HTML content as string
   */
  async fetchPage(url: string, useBrowser = true): Promise<string> {
    // Use browser for store77.net (has JS protection)
    if (useBrowser && this.browserService && url.includes('store77.net')) {
      return this.fetchPageWithBrowser(url);
    }

    return this.fetchPageWithHttp(url);
  }

  /**
   * Fetch page using headless browser
   */
  private async fetchPageWithBrowser(url: string): Promise<string> {
    if (!this.browserService) {
      throw new Error('BrowserService not available');
    }

    this.logger.debug(`Fetching page with browser: ${url}`);
    return this.browserService.getPageContent(url);
  }

  /**
   * Fetch page using HTTP (for sites without JS protection)
   */
  private async fetchPageWithHttp(url: string): Promise<string> {
    this.logger.debug(`Fetching page with HTTP: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          responseType: 'text',
        })
      );

      this.logger.debug(`Successfully fetched page: ${url} (${response.data.length} bytes)`);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch page ${url}: ${message}`);
      throw new Error(`Failed to fetch page ${url}: ${message}`);
    }
  }

  /**
   * Load HTML content into Cheerio for parsing
   * @param html - HTML content
   * @returns Cheerio instance
   */
  loadHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Calculate the final price with discount
   * @param originalPriceKopecks - Original price in kopecks
   * @returns Final price in kopecks (originalPrice - 1000 RUB)
   */
  calculateFinalPrice(originalPriceKopecks: number): number {
    const finalPrice = originalPriceKopecks - PRICE_DISCOUNT_KOPECKS;
    // Ensure price doesn't go below zero
    return Math.max(0, finalPrice);
  }

  /**
   * Generate a slug from a string
   * @param text - Text to convert to slug
   * @returns URL-friendly slug
   */
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\sа-яё-]/gi, '') // Remove special characters
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Parse price string to kopecks
   * @param priceStr - Price string (e.g., "1 234 ₽", "1234.50")
   * @returns Price in kopecks
   */
  parsePriceToKopecks(priceStr: string): number {
    // Remove currency symbols, spaces, and non-numeric characters except decimal separators
    const cleanedPrice = priceStr
      .replace(/[^\d.,]/g, '')
      .replace(/\s/g, '')
      .replace(',', '.');

    const price = parseFloat(cleanedPrice);

    if (isNaN(price)) {
      this.logger.warn(`Failed to parse price: "${priceStr}"`);
      return 0;
    }

    // Convert rubles to kopecks (multiply by 100)
    return Math.round(price * 100);
  }

  /**
   * Convert relative URL to absolute URL
   * @param relativeUrl - Relative URL path
   * @returns Absolute URL
   */
  toAbsoluteUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }

    const cleanPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${STORE77_BASE_URL}${cleanPath}`;
  }

  /**
   * Get the base URL for store77.net
   */
  getBaseUrl(): string {
    return STORE77_BASE_URL;
  }

  /**
   * Extract external ID from product URL
   * @param url - Product URL
   * @returns External ID or null
   */
  extractExternalId(url: string): string | null {
    // Try to extract ID from URL patterns like /product/12345 or ?id=12345
    const patterns = [/\/product\/(\d+)/i, /\/(\d+)(?:\/|$)/, /[?&]id=(\d+)/i, /\/p(\d+)/i];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    // Generate ID from URL hash if no pattern matches
    return null;
  }

  /**
   * Log scraping statistics
   * @param operation - Name of the operation
   * @param stats - Statistics object
   */
  logStats(operation: string, stats: Record<string, number | string>): void {
    const statsStr = Object.entries(stats)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    this.logger.log(`[${operation}] ${statsStr}`);
  }

  /**
   * Get the Prisma service instance for database operations
   * Used by derived methods for saving parsed data
   */
  getPrisma(): PrismaService {
    return this.prisma;
  }

  /**
   * CSS Selectors for store77.net - based on actual site structure
   */
  private readonly selectors = {
    // Category selectors - store77.net uses .catalog_menu
    categoryMenu: ['.catalog_menu a', '.main_menu a', '[class*="menu"] a[href^="/"]'],
    // Product list selectors - store77.net uses .blocks_product
    productCard: ['.blocks_product'],
    productName: ['.bp_text_info', '.bp_text a', 'a[title]'],
    productPrice: ['.bp_text_price'],
    productImage: ['.bp_product_img img', 'img'],
    productLink: ['a'],
  };

  /**
   * Parse categories from the main page HTML
   * @param html - HTML content of the main page
   * @returns Array of parsed categories
   */
  parseCategoriesFromHtml(html: string): ParsedCategory[] {
    const $ = this.loadHtml(html);
    const categories: ParsedCategory[] = [];
    const seenSlugs = new Set<string>();

    // Try each selector until we find categories
    for (const selector of this.selectors.categoryMenu) {
      $(selector).each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const name = $el.text().trim();

        // Skip empty or invalid entries
        if (!href || !name || name.length < 2) {
          return;
        }

        // Skip non-category links
        if (
          href.includes('javascript:') ||
          href === '#' ||
          href.includes('login') ||
          href.includes('cart') ||
          href.includes('account')
        ) {
          return;
        }

        const url = this.toAbsoluteUrl(href);
        const slug = this.generateSlug(name);

        // Skip duplicates
        if (seenSlugs.has(slug)) {
          return;
        }

        seenSlugs.add(slug);
        categories.push({ name, url, slug });
      });

      // If we found categories, stop trying other selectors
      if (categories.length > 0) {
        this.logger.debug(`Found ${categories.length} categories using selector: ${selector}`);
        break;
      }
    }

    return categories;
  }

  /**
   * Fetch and parse categories from store77.net
   * @returns Array of parsed categories
   */
  async parseCategories(): Promise<ParsedCategory[]> {
    this.logger.log('Starting category parsing...');

    try {
      const html = await this.fetchPage(this.getBaseUrl());
      const categories = this.parseCategoriesFromHtml(html);

      this.logStats('parseCategories', {
        total: categories.length,
        status: 'success',
      });

      return categories;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to parse categories: ${message}`);
      throw error;
    }
  }

  /**
   * Save parsed categories to the database
   * @param categories - Array of parsed categories
   * @returns Number of saved/updated categories
   */
  async saveCategories(categories: ParsedCategory[]): Promise<number> {
    this.logger.log(`Saving ${categories.length} categories to database...`);

    let savedCount = 0;

    for (const category of categories) {
      try {
        await this.prisma.category.upsert({
          where: { slug: category.slug },
          update: {
            name: category.name,
            url: category.url,
          },
          create: {
            name: category.name,
            slug: category.slug,
            url: category.url,
          },
        });
        savedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to save category "${category.name}": ${message}`);
      }
    }

    this.logStats('saveCategories', {
      total: categories.length,
      saved: savedCount,
      failed: categories.length - savedCount,
    });

    return savedCount;
  }

  /**
   * Fetch, parse and save all categories
   * @returns Number of saved categories
   */
  async scrapeAndSaveCategories(): Promise<number> {
    const categories = await this.parseCategories();
    return this.saveCategories(categories);
  }

  /**
   * CSS Selectors for product parsing
   * Based on actual store77.net structure
   */
  private readonly productSelectors = {
    // Product card selectors - store77.net uses .blocks_product
    productCard: ['.blocks_product'],
    productName: ['.bp_text_info', '.bp_text a', 'a[title]', 'a'],
    productPrice: ['.bp_text_price'],
    productImage: ['.bp_product_img img', 'img'],
    productLink: ['a[href^="/"]', 'a'],
    productDescription: ['.bp_text_info'],
  };

  /**
   * Parse products from category page HTML
   * @param html - HTML content of category page
   * @param categorySlug - Category slug for reference
   * @returns Array of parsed products
   */
  parseProductsFromHtml(html: string, categorySlug: string | null = null): ParsedProduct[] {
    const $ = this.loadHtml(html);
    const products: ParsedProduct[] = [];
    const seenUrls = new Set<string>();

    // Try each product card selector
    for (const cardSelector of this.productSelectors.productCard) {
      const cards = $(cardSelector);

      if (cards.length === 0) continue;

      cards.each((_, element) => {
        const $card = $(element);

        // Extract product URL
        let productUrl = '';
        for (const linkSelector of this.productSelectors.productLink) {
          const href = $card.find(linkSelector).first().attr('href');
          if (href && href.length > 1 && !href.startsWith('#')) {
            productUrl = this.toAbsoluteUrl(href);
            break;
          }
        }

        if (!productUrl || seenUrls.has(productUrl)) return;
        seenUrls.add(productUrl);

        // Extract product name - try selectors first, then fallback to link title/text
        let name = '';
        for (const nameSelector of this.productSelectors.productName) {
          name = $card.find(nameSelector).first().text().trim();
          if (name && name.length > 3) break;
        }
        // Fallback: get title attribute from first link
        if (!name || name.length < 3) {
          name = $card.find('a').first().attr('title') || '';
        }
        if (!name) return;

        // Extract price
        let originalPrice = 0;
        for (const priceSelector of this.productSelectors.productPrice) {
          const priceText = $card.find(priceSelector).first().text().trim();
          if (priceText) {
            originalPrice = this.parsePriceToKopecks(priceText);
            if (originalPrice > 0) break;
          }
        }

        // Extract image URL
        let imageUrl: string | null = null;
        for (const imgSelector of this.productSelectors.productImage) {
          const img = $card.find(imgSelector).first();
          imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || null;
          if (imageUrl) {
            imageUrl = this.toAbsoluteUrl(imageUrl);
            break;
          }
        }

        // Extract description (if available on list page)
        let description: string | null = null;
        for (const descSelector of this.productSelectors.productDescription) {
          description = $card.find(descSelector).first().text().trim() || null;
          if (description) break;
        }

        const product: ParsedProduct = {
          externalId: this.extractExternalId(productUrl),
          name,
          description,
          originalPrice,
          finalPrice: this.calculateFinalPrice(originalPrice),
          imageUrl,
          externalUrl: productUrl,
          categorySlug,
        };

        products.push(product);
      });

      // If we found products, stop trying other selectors
      if (products.length > 0) {
        this.logger.debug(`Found ${products.length} products using selector: ${cardSelector}`);
        break;
      }
    }

    return products;
  }

  /**
   * Parse products from a category URL
   * @param categoryUrl - Category page URL
   * @param categorySlug - Category slug for reference
   */
  async parseProductsFromCategory(
    categoryUrl: string,
    categorySlug: string | null = null
  ): Promise<ParsedProduct[]> {
    this.logger.log(`Parsing products from category: ${categoryUrl}`);

    try {
      const html = await this.fetchPage(categoryUrl);
      const products = this.parseProductsFromHtml(html, categorySlug);

      this.logStats('parseProductsFromCategory', {
        url: categoryUrl,
        products: products.length,
      });

      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to parse products from ${categoryUrl}: ${message}`);
      return [];
    }
  }

  /**
   * Save parsed products to database
   * @param products - Array of parsed products
   * @returns Number of saved/updated products
   */
  async saveProducts(products: ParsedProduct[]): Promise<number> {
    this.logger.log(`Saving ${products.length} products to database...`);

    let savedCount = 0;

    for (const product of products) {
      try {
        // Find category by slug if provided
        let categoryId: string | null = null;
        if (product.categorySlug) {
          const category = await this.prisma.category.findUnique({
            where: { slug: product.categorySlug },
          });
          categoryId = category?.id || null;
        }

        const slug = this.generateSlug(product.name);

        await this.prisma.product.upsert({
          where: { slug },
          update: {
            name: product.name,
            description: product.description,
            originalPrice: product.originalPrice,
            finalPrice: product.finalPrice,
            imageUrl: product.imageUrl,
            externalUrl: product.externalUrl,
            categoryId,
            isActive: true,
          },
          create: {
            externalId: product.externalId,
            name: product.name,
            slug,
            description: product.description,
            originalPrice: product.originalPrice,
            finalPrice: product.finalPrice,
            imageUrl: product.imageUrl,
            externalUrl: product.externalUrl,
            categoryId,
            isActive: true,
          },
        });
        savedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to save product "${product.name}": ${message}`);
      }
    }

    this.logStats('saveProducts', {
      total: products.length,
      saved: savedCount,
      failed: products.length - savedCount,
    });

    return savedCount;
  }

  /**
   * Full scrape: fetch all categories and their products
   * @returns Statistics of the scrape operation
   */
  async scrapeAll(): Promise<{
    categories: number;
    products: number;
    errors: number;
  }> {
    this.logger.log('Starting full scrape...');
    const startTime = Date.now();

    let totalProducts = 0;
    let errors = 0;

    try {
      // First, scrape categories
      const categoriesCount = await this.scrapeAndSaveCategories();

      // Get all categories from DB
      const categories = await this.prisma.category.findMany();

      // Scrape products from each category
      for (const category of categories) {
        try {
          const products = await this.parseProductsFromCategory(category.url, category.slug);

          if (products.length > 0) {
            const saved = await this.saveProducts(products);
            totalProducts += saved;
          }

          // Random delay between categories
          if (this.browserService) {
            await this.browserService.randomDelay(2000, 5000);
          }
        } catch {
          errors++;
          this.logger.error(`Error scraping category ${category.name}`);
        }
      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      this.logStats('scrapeAll', {
        categories: categoriesCount,
        products: totalProducts,
        errors,
        durationSeconds: duration,
      });

      return { categories: categoriesCount, products: totalProducts, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Full scrape failed: ${message}`);
      throw error;
    }
  }
}
