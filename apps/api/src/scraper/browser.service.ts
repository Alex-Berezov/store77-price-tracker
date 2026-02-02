import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const playwrightExtra = require('playwright-extra').chromium;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

/** Browser configuration */
const BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
  ],
};

/** Random delay range in milliseconds */
const DELAY_RANGE = { min: 500, max: 2000 };

/** Page load timeout */
const PAGE_TIMEOUT = 30000;

/** Additional wait time for JS execution after page load */
const JS_EXECUTION_WAIT = 3000;

/** List of realistic User Agents */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;
  private isInitializing = false;
  private initializationPromise: Promise<Browser> | null = null;

  /**
   * Initialize browser with stealth plugin
   */
  async initBrowser(): Promise<Browser> {
    // If browser exists and is connected, return it
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    // If browser exists but disconnected, clean up
    if (this.browser && !this.browser.isConnected()) {
      this.logger.warn('Browser disconnected, reinitializing...');
      this.browser = null;
    }

    // If already initializing, wait for it
    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }

    this.isInitializing = true;
    this.logger.log('Initializing browser with stealth mode...');

    this.initializationPromise = (async () => {
      try {
        // Apply stealth plugin
        playwrightExtra.use(StealthPlugin());

        this.browser = (await playwrightExtra.launch(BROWSER_CONFIG)) as Browser;
        this.logger.log('Browser initialized successfully');

        // Handle browser disconnect
        this.browser.on('disconnected', () => {
          this.logger.warn('Browser disconnected unexpectedly');
          this.browser = null;
        });

        return this.browser;
      } catch (error) {
        this.logger.error('Failed to initialize browser, trying without stealth...', error);
        // Fallback to regular playwright
        this.browser = await chromium.launch(BROWSER_CONFIG);

        this.browser.on('disconnected', () => {
          this.logger.warn('Browser disconnected unexpectedly');
          this.browser = null;
        });

        return this.browser;
      } finally {
        this.isInitializing = false;
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Create a new browser context with random user agent
   * @param options - Optional browser context options to merge
   */
  async createContext(options?: {
    extraHTTPHeaders?: Record<string, string>;
  }): Promise<BrowserContext> {
    const browser = await this.initBrowser();
    const userAgent = this.getRandomUserAgent();

    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow',
      extraHTTPHeaders: options?.extraHTTPHeaders,
    });

    return context;
  }

  /**
   * Create a new page with context (caller is responsible for closing)
   */
  async createPage(): Promise<Page> {
    const context = await this.createContext();
    const page = await context.newPage();
    return page;
  }

  /**
   * Get page HTML content after JS execution
   * @param url - URL to fetch
   * @param waitForSelector - Optional selector to wait for
   */
  async getPageContent(url: string, waitForSelector?: string): Promise<string> {
    const context = await this.createContext();
    let page: Page | null = null;

    try {
      page = await context.newPage();

      // Add random delay before navigation
      await this.randomDelay();

      this.logger.debug(`Navigating to: ${url}`);

      await page.goto(url, {
        waitUntil: 'load',
        timeout: PAGE_TIMEOUT,
      });

      // Wait for JS to execute (important for JS protection bypass)
      await page.waitForTimeout(JS_EXECUTION_WAIT);

      // Wait for optional selector
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: PAGE_TIMEOUT });
      }

      // Random delay after load
      await this.randomDelay();

      const content = await page.content();
      this.logger.debug(`Page loaded: ${url} (${content.length} bytes)`);

      return content;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get page content ${url}: ${message}`);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
      await context.close();
    }
  }

  /**
   * Get multiple pages with delay between requests
   * @param urls - Array of URLs to fetch
   * @param waitForSelector - Optional selector to wait for
   */
  async getMultiplePages(urls: string[], waitForSelector?: string): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const url of urls) {
      try {
        const content = await this.getPageContent(url, waitForSelector);
        results.set(url, content);

        // Delay between requests to avoid rate limiting
        await this.randomDelay(1000, 3000);
      } catch {
        this.logger.warn(`Skipping URL due to error: ${url}`);
      }
    }

    return results;
  }

  /**
   * Random delay between actions
   */
  async randomDelay(min = DELAY_RANGE.min, max = DELAY_RANGE.max): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Get random user agent from list
   */
  private getRandomUserAgent(): string {
    const index = Math.floor(Math.random() * USER_AGENTS.length);
    const userAgent = USER_AGENTS[index];
    return (
      userAgent ?? USER_AGENTS[0] ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
  }

  /**
   * Download an image through the browser to bypass hotlinking protection
   * @param imageUrl - URL of the image to download
   * @returns Buffer with image data and content type, or null on failure
   */
  async downloadImage(imageUrl: string): Promise<{ data: Buffer; contentType: string } | null> {
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let context: BrowserContext | null = null;
      let page: Page | null = null;

      try {
        context = await this.createContext();
        page = await context.newPage();

        // Set referer to bypass hotlinking protection
        await page.setExtraHTTPHeaders({
          Referer: 'https://store77.net/',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        });

        // Directly fetch the image with proper headers
        const response = await page.goto(imageUrl, {
          waitUntil: 'load',
          timeout: 15000, // Shorter timeout for images
        });

        if (!response) {
          this.logger.warn(`No response for image: ${imageUrl}`);
          return null;
        }

        const contentType = response.headers()['content-type'] || 'image/jpeg';

        // Check if we got an actual image
        if (!contentType.startsWith('image/')) {
          this.logger.warn(`Not an image (${contentType}): ${imageUrl}`);
          return null;
        }

        const data = await response.body();
        this.logger.debug(`Downloaded image: ${imageUrl} (${data.length} bytes)`);

        return { data, contentType };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to download image ${imageUrl} (attempt ${attempt}/${maxRetries}): ${message}`
        );

        // If browser is disconnected, it will be reinitialized on next createContext call
        if (message.includes('Target closed') || message.includes('browser has been closed')) {
          this.browser = null;
        }

        if (attempt === maxRetries) {
          return null;
        }

        // Wait before retry
        await this.randomDelay(500, 1000);
      } finally {
        try {
          if (page) await page.close().catch(() => {});
          if (context) await context.close().catch(() => {});
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    return null;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      this.logger.log('Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Check if browser is running
   */
  isBrowserActive(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }
}
