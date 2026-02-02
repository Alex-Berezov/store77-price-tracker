import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ScraperService } from './scraper.service';

@Injectable()
export class ScraperScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScraperScheduler.name);
  private isRunning = false;
  private lastRunAt: Date | null = null;
  private lastResult: { categories: number; products: number; errors: number } | null = null;

  constructor(
    private readonly scraperService: ScraperService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Run initial scrape on module initialization (if DB is empty)
   */
  async onModuleInit(): Promise<void> {
    const scrapeOnStart = this.configService.get<boolean>('SCRAPE_ON_START', false);

    if (scrapeOnStart) {
      this.logger.log('Running initial scrape on startup...');
      // Delay to allow other services to initialize
      setTimeout(() => this.runScrape(), 5000);
    }
  }

  /**
   * Scheduled scrape job - runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleScheduledScrape(): Promise<void> {
    this.logger.log('Scheduled scrape triggered');
    await this.runScrape();
  }

  /**
   * Manual trigger for scraping
   * @returns Scrape results or null if already running
   */
  async triggerScrape(): Promise<{
    categories: number;
    products: number;
    errors: number;
  } | null> {
    if (this.isRunning) {
      this.logger.warn('Scrape already in progress, skipping manual trigger');
      return null;
    }

    return this.runScrape();
  }

  /**
   * Run the scrape operation
   */
  private async runScrape(): Promise<{
    categories: number;
    products: number;
    errors: number;
  }> {
    if (this.isRunning) {
      this.logger.warn('Scrape already in progress, skipping');
      return this.lastResult || { categories: 0, products: 0, errors: 0 };
    }

    this.isRunning = true;
    this.logger.log('Starting scrape operation...');

    try {
      const result = await this.scraperService.scrapeAll();

      this.lastRunAt = new Date();
      this.lastResult = result;

      this.logger.log(
        `Scrape completed: ${result.categories} categories, ${result.products} products, ${result.errors} errors`
      );

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Scrape failed: ${message}`);

      return { categories: 0, products: 0, errors: 1 };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scraper status
   */
  getStatus(): {
    isRunning: boolean;
    lastRunAt: Date | null;
    lastResult: { categories: number; products: number; errors: number } | null;
  } {
    return {
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt,
      lastResult: this.lastResult,
    };
  }
}
