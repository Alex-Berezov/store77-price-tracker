import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CacheService } from '../cache/cache.service';
import { firstValueFrom } from 'rxjs';

/** Cache TTL for images - 24 hours */
const IMAGE_CACHE_TTL = 86400;

/** Maximum cache size per image in bytes (1MB) */
const MAX_IMAGE_SIZE = 1024 * 1024;

/** Timeout for image download */
const IMAGE_TIMEOUT = 10000;

interface CachedImage {
  data: string; // base64 encoded
  contentType: string;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService
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
   * Download image using HTTP request with proper headers
   */
  private async downloadImage(
    imageUrl: string
  ): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: IMAGE_TIMEOUT,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://store77.net/',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        })
      );

      const contentType = response.headers['content-type'] || 'image/jpeg';

      if (!contentType.startsWith('image/')) {
        this.logger.warn(`Not an image (${contentType}): ${imageUrl}`);
        return null;
      }

      const data = Buffer.from(response.data);
      this.logger.debug(`Downloaded image: ${imageUrl} (${data.length} bytes)`);

      return { data, contentType };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download image ${imageUrl}: ${message}`);
      return null;
    }
  }
}
