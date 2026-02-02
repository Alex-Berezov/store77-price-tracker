import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CacheModule } from '../cache/cache.module';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [CacheModule, ScraperModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
