import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma';
import { CacheModule } from './cache';
import { ScraperModule } from './scraper';
import { CurrencyModule } from './currency';
import { ProductsModule } from './products';
import { CategoriesModule } from './categories';
import { ImagesModule } from './images';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    PrismaModule,
    CacheModule,
    ScraperModule,
    CurrencyModule,
    ProductsModule,
    CategoriesModule,
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
