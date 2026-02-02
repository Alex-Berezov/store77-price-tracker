import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { BrowserService } from '../scraper/browser.service';

/** Cache TTL for images - 24 hours */
const IMAGE_CACHE_TTL = 86400;

/** Maximum cache size per image in bytes (1MB) */
const MAX_IMAGE_SIZE = 1024 * 1024;

interface CachedImage {
  data: string; // base64 encoded
  contentType: string;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly browserService: BrowserService
  ) {}

  /**
   * Get image from cache or download it
   * @param imageUrl - URL of the image to get
   * @returns Image data and content type, or null on failure
   */
  async getImage(imageUrl: string): Promise<{ data: Buffer; contentType: string } | null> {
    // Validate URL
    if (!imageUrl || !imageUrl.startsWith('https://store77.net/')) {
      this.logger.warn(`Invalid image URL: ${imageUrl}`);
      return null;
    }

    // Try to get from cache first
    const cacheKey = `image:${this.hashUrl(imageUrl)}`;
    const cached = await this.cacheService.get<CachedImage>(cacheKey);

    if (cached) {
      this.logger.debug(`Image cache hit: ${imageUrl}`);
      return {
        data: Buffer.from(cached.data, 'base64'),
        contentType: cached.contentType,
      };
    }

    // Download the image using HTTP request with proper headers
    this.logger.debug(`Downloading image: ${imageUrl}`);
    const result = await this.downloadImage(imageUrl);

    if (!result) {
      return null;
    }

    // Cache the image if it's not too large
    if (result.data.length <= MAX_IMAGE_SIZE) {
      const cacheData: CachedImage = {
        data: result.data.toString('base64'),
        contentType: result.contentType,
      };
      await this.cacheService.set(cacheKey, cacheData, IMAGE_CACHE_TTL);
      this.logger.debug(`Cached image: ${imageUrl} (${result.data.length} bytes)`);
    }

    return result;
  }

  /**
   * Create a simple hash of the URL for cache key
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Download image by intercepting it on a real store77 page
   */
  private async downloadImage(
    imageUrl: string
  ): Promise<{ data: Buffer; contentType: string } | null> {
    let context = null;
    let page = null;
    try {
      context = await this.browserService.createContext();
      page = await context.newPage();

      let imageData: Buffer | null = null;
      let imageContentType = 'image/jpeg';

      // Intercept all image requests
      await page.route('**/*', async (route) => {
        const request = route.request();
        const url = request.url();

        // If this is our target image, capture it
        if (url === imageUrl || url.includes(imageUrl.split('/').pop() || '')) {
          try {
            const response = await route.fetch();
            const contentType = response.headers()['content-type'] || 'image/jpeg';

            if (contentType.startsWith('image/')) {
              imageData = await response.body();
              imageContentType = contentType;
              this.logger.debug(`Intercepted image: ${url} (${imageData.length} bytes)`);
            }
            await route.fulfill({ response });
          } catch {
            await route.continue();
          }
        } else {
          await route.continue();
        }
      });

      // Navigate to the main page which will trigger image loads
      await page.goto('https://store77.net/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // If we didn't catch it yet, try to load the image directly in the page context
      if (!imageData) {
        // Use JavaScript fetch within the page context (has cookies)
        const result = await page.evaluate(async (url: string) => {
          try {
            const response = await fetch(url, {
              credentials: 'include',
              headers: {
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              },
            });

            if (!response.ok) return null;

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            if (!contentType.startsWith('image/')) return null;

            const arrayBuffer = await response.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
              )
            );

            return { base64, contentType };
          } catch {
            return null;
          }
        }, imageUrl);

        if (result) {
          imageData = Buffer.from(result.base64, 'base64');
          imageContentType = result.contentType;
          this.logger.debug(
            `Fetched image via page context: ${imageUrl} (${imageData.length} bytes)`
          );
        }
      }

      if (!imageData) {
        this.logger.warn(`Could not download image: ${imageUrl}`);
        return null;
      }

      return { data: imageData, contentType: imageContentType };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download image ${imageUrl}: ${message}`);
      return null;
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      if (context) {
        await context.close().catch(() => {});
      }
    }
  }
}
