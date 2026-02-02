import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [HttpModule, CacheModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
