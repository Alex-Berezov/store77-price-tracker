import { Controller, Post, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScraperScheduler } from './scraper.scheduler';

/**
 * Controller for manual scraper operations
 * Provides endpoints for debugging and manual triggering
 */
@ApiTags('scraper')
@Controller('scraper')
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperScheduler: ScraperScheduler) {}

  /**
   * Manually trigger a full scrape
   */
  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Запустить парсинг вручную',
    description: 'Запускает асинхронный парсинг товаров с store77.net',
  })
  @ApiResponse({ status: 202, description: 'Парсинг запущен' })
  async triggerScrape(): Promise<{ message: string; status: string }> {
    this.logger.log('Manual scrape triggered via API');

    // Trigger async scrape (don't wait for completion)
    this.scraperScheduler.triggerScrape().catch((error) => {
      this.logger.error(`Manual scrape failed: ${error.message}`);
    });

    return {
      message: 'Scrape triggered successfully',
      status: 'in_progress',
    };
  }

  /**
   * Get current scraper status
   */
  @Get('status')
  @ApiOperation({
    summary: 'Получить статус парсера',
    description: 'Возвращает информацию о текущем состоянии парсера',
  })
  @ApiResponse({ status: 200, description: 'Статус парсера' })
  getStatus(): { isRunning: boolean; lastRunAt: Date | null; message: string } {
    const status = this.scraperScheduler.getStatus();
    return {
      isRunning: status.isRunning,
      lastRunAt: status.lastRunAt,
      message: status.isRunning ? 'Scraper is currently running' : 'Scraper is idle',
    };
  }
}
