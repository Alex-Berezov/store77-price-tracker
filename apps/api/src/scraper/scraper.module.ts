import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';
import { BrowserService } from './browser.service';
import { ScraperScheduler } from './scraper.scheduler';
import { ScraperController } from './scraper.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout for scraping requests
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    }),
    PrismaModule,
  ],
  controllers: [ScraperController],
  providers: [BrowserService, ScraperService, ScraperScheduler],
  exports: [ScraperService, BrowserService],
})
export class ScraperModule {}
